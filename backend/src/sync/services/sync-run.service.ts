import { randomUUID } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import type { Outbox } from '@prisma/client';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import { RequestContextService } from '../../persistence/context/request-context.service';
import { OutboxSyncStatus } from '../../persistence/outbox/outbox-operation.constants';
import { UnitOfWorkService } from '../../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../../prisma.service';
import type { SyncCloudRequestContext } from '../cloud/sync-cloud.contract';
import { SyncPushResultStatus } from '../cloud/sync-cloud.contract';
import { SyncCloudClient } from '../cloud/sync-cloud.client';
import {
  getSyncBatchSize,
  getSyncCloudBaseUrl,
  getSyncMaxPullPages,
} from '../cloud/sync-cloud.config';
import { getSyncPushEntityTypes } from '../constants/sync-enabled-entity-types';
import { isSyncEnabledEntityType } from '../constants/sync-enabled-entity-types';
import { sortPullRecords } from '../utils/sync-pull-sort.util';
import { DeviceSyncStateService } from './device-sync-state.service';
import { SyncApplyService } from './sync-apply.service';
import { SyncOutboxExpandService } from './sync-outbox-expand.service';

export interface SyncRunSummary {
  syncLogId: string;
  recordsUploaded: number;
  failedRecords: number;
  status: string;
  conflictsDetected?: number;
}

export interface SyncPullSummary {
  syncLogId: string;
  recordsDownloaded: number;
  failedRecords: number;
  conflictsDetected: number;
  status: string;
}

function outboxEntityVersion(row: Outbox): string {
  const payload = row.payload as Record<string, unknown> | null;
  if (payload) {
    const entityVersion = payload.entityVersion;
    if (
      typeof entityVersion === 'string' ||
      typeof entityVersion === 'number' ||
      typeof entityVersion === 'bigint'
    ) {
      return String(entityVersion);
    }
    const version = payload.version;
    if (
      typeof version === 'string' ||
      typeof version === 'number' ||
      typeof version === 'bigint'
    ) {
      return String(version);
    }
  }
  return row.version.toString();
}

@Injectable()
export class SyncRunService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly requestContext: RequestContextService,
    private readonly cloudClient: SyncCloudClient,
    private readonly deviceSyncState: DeviceSyncStateService,
    private readonly syncApply: SyncApplyService,
    private readonly outboxExpand: SyncOutboxExpandService,
  ) {}

  async getLatestRun() {
    const deviceId = this.requestContext.tryGet()?.deviceId;
    const baseWhere = deviceId ? { deviceId } : undefined;

    const mapLog = (
      log: {
        id: bigint;
        status: string;
        syncType: string;
        recordsUploaded: number;
        recordsDownloaded: number;
        failedRecords: number;
        conflictsDetected: number;
        startedAt: bigint;
        completedAt: bigint | null;
      } | null,
    ) => {
      if (!log) {
        return null;
      }
      return {
        id: log.id.toString(),
        syncType: log.syncType,
        status: log.status,
        recordsUploaded: log.recordsUploaded,
        recordsDownloaded: log.recordsDownloaded,
        failedRecords: log.failedRecords,
        conflictsDetected: log.conflictsDetected,
        startedAt: log.startedAt.toString(),
        completedAt: log.completedAt?.toString() ?? null,
      };
    };

    const [lastPush, lastPull] = await Promise.all([
      this.prisma.client.syncLog.findFirst({
        where: baseWhere
          ? { ...baseWhere, syncType: 'PUSH' }
          : { syncType: 'PUSH' },
        orderBy: { startedAt: 'desc' },
      }),
      this.prisma.client.syncLog.findFirst({
        where: baseWhere
          ? { ...baseWhere, syncType: 'PULL' }
          : { syncType: 'PULL' },
        orderBy: { startedAt: 'desc' },
      }),
    ]);

    if (!lastPush && !lastPull) {
      return null;
    }

    return {
      push: mapLog(lastPush),
      pull: mapLog(lastPull),
    };
  }

  buildCloudContext(authorization?: string): SyncCloudRequestContext {
    const ctx = this.requestContext.get();
    return {
      deviceId: ctx.deviceId,
      branchId: ctx.branchId,
      companyId: ctx.companyId,
      authorization,
    };
  }

  async runPush(authorization?: string): Promise<SyncRunSummary> {
    if (!getSyncCloudBaseUrl()) {
      throw new ApplicationException(
        ErrorCode.SYNC_CLOUD_URL_NOT_CONFIGURED,
        'SYNC_CLOUD_URL is not configured',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const deviceId = this.requestContext.getDeviceId();
    const batchSize = getSyncBatchSize();
    const startedAt = BigInt(Date.now());
    const syncLog = await this.prisma.client.syncLog.create({
      data: {
        uuid: randomUUID(),
        syncType: 'PUSH',
        syncDirection: 'UPLOAD',
        startedAt,
        status: 'IN_PROGRESS',
        deviceId,
        createdAt: startedAt,
      },
    });

    const pending = await this.prisma.client.outbox.findMany({
      where: {
        deviceId,
        syncStatus: OutboxSyncStatus.PENDING,
        entityType: { in: [...getSyncPushEntityTypes()] },
      },
      orderBy: { sequenceNo: 'asc' },
      take: batchSize,
    });

    if (pending.length === 0) {
      const completedAt = BigInt(Date.now());
      await this.prisma.client.syncLog.update({
        where: { id: syncLog.id },
        data: {
          completedAt,
          status: 'COMPLETED',
          version: { increment: 1 },
        },
      });
      return {
        syncLogId: syncLog.id.toString(),
        recordsUploaded: 0,
        failedRecords: 0,
        status: 'COMPLETED',
        conflictsDetected: 0,
      };
    }

    const claimedRows: Outbox[] = [];
    for (const row of pending) {
      const claimed = await this.unitOfWork.run(async (tx) => {
        const result = await tx.outbox.updateMany({
          where: { id: row.id, syncStatus: OutboxSyncStatus.PENDING },
          data: {
            syncStatus: OutboxSyncStatus.PROCESSING,
            version: { increment: 1 },
          },
        });
        return result.count === 1;
      });
      if (claimed) {
        claimedRows.push(row);
      }
    }

    const ctx = this.buildCloudContext(authorization);
    const branchId = ctx.branchId?.toString() ?? null;

    let uploaded = 0;
    let failed = 0;
    let conflictsDetected = 0;

    const operations = await this.unitOfWork.run(async (tx) => {
      const built: Array<{
        operationId: string;
        entityType: string;
        entityUuid: string;
        operation: string;
        entityVersion: string;
        sequenceNo: string;
        payload: unknown;
        rowId: bigint;
      }> = [];
      for (const row of claimedRows) {
        const expanded = await this.outboxExpand.expand(tx, row);
        if (!expanded) {
          await tx.outbox.update({
            where: { id: row.id },
            data: {
              syncStatus: OutboxSyncStatus.FAILED,
              lastError: 'Entity not found for outbox expand',
              retryCount: { increment: 1 },
              version: { increment: 1 },
            },
          });
          continue;
        }
        built.push({
          operationId: row.operationId,
          entityType: row.entityType,
          entityUuid: row.entityUuid,
          operation: row.operation,
          entityVersion: expanded.entityVersion,
          sequenceNo: row.sequenceNo.toString(),
          payload: expanded,
          rowId: row.id,
        });
      }
      return built;
    });

    try {
      const response = await this.cloudClient.pushBatch(ctx, {
        deviceId,
        branchId,
        operations: operations.map(({ rowId: _id, ...op }) => op),
      });

      const resultMap = new Map(
        response.results.map((item) => [item.operationId, item]),
      );
      const now = BigInt(Date.now());

      const opsByOperationId = new Map(
        operations.map((op) => [op.operationId, op]),
      );

      for (const row of claimedRows) {
        if (!opsByOperationId.has(row.operationId)) {
          continue;
        }
        const item = resultMap.get(row.operationId);
        if (!item) {
          failed += 1;
          await this.markOutboxFailed(row.id, 'Missing result for operation');
          continue;
        }

        if (
          item.status === SyncPushResultStatus.ACCEPTED ||
          item.status === SyncPushResultStatus.DUPLICATE
        ) {
          await this.unitOfWork.run(async (tx) => {
            await tx.outbox.update({
              where: { id: row.id },
              data: {
                syncStatus: OutboxSyncStatus.SYNCED,
                processedAt: now,
                lastError: null,
                version: { increment: 1 },
              },
            });
          });
          uploaded += 1;
          continue;
        }

        if (item.status === SyncPushResultStatus.CONFLICT) {
          const serverVersion = item.serverEntityVersion ?? '1';
          const applyResult = await this.unitOfWork.run(async (tx) => {
            const outcome = await this.syncApply.applyServerWinFromPush(
              tx,
              row.entityType,
              row.entityUuid,
              item.serverPayload ?? row.payload,
              serverVersion,
            );
            if (outcome.kind === 'applied') {
              await tx.outbox.update({
                where: { id: row.id },
                data: {
                  syncStatus: OutboxSyncStatus.SYNCED,
                  processedAt: now,
                  lastError: null,
                  version: { increment: 1 },
                },
              });
              return 'synced' as const;
            }
            if (outcome.kind === 'conflict') {
              await this.syncApply.recordConflict(tx, {
                syncLogId: syncLog.id,
                entityType: row.entityType,
                entityUuid: row.entityUuid,
                conflictType: 'VERSION_MISMATCH',
                localPayload: row.payload,
                serverPayload: item.serverPayload ?? row.payload,
              });
              await tx.outbox.update({
                where: { id: row.id },
                data: {
                  syncStatus: OutboxSyncStatus.FAILED,
                  lastError: outcome.message.slice(0, 2000),
                  retryCount: { increment: 1 },
                  version: { increment: 1 },
                },
              });
              return 'conflict' as const;
            }
            return 'failed' as const;
          });

          if (applyResult === 'synced') {
            uploaded += 1;
          } else if (applyResult === 'conflict') {
            conflictsDetected += 1;
            failed += 1;
          } else {
            failed += 1;
          }
          continue;
        }

        failed += 1;
        await this.markOutboxFailed(
          row.id,
          `Unexpected push status: ${item.status}`,
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown sync error';
      await this.revertOutboxBatchToPending(claimedRows, message);
    }

    try {
      const state = await this.deviceSyncState.getOrCreateForCurrentContext();
      await this.deviceSyncState.touchPushAt(state.id);
    } catch {
      // branch context optional for push-only diagnostics
    }

    const completedAt = BigInt(Date.now());
    const finalStatus = failed > 0 && uploaded === 0 ? 'FAILED' : 'COMPLETED';

    await this.prisma.client.syncLog.update({
      where: { id: syncLog.id },
      data: {
        completedAt,
        recordsUploaded: uploaded,
        failedRecords: failed,
        conflictsDetected,
        status: finalStatus,
        errorMessage: failed > 0 ? `${failed} record(s) failed` : null,
        version: { increment: 1 },
      },
    });

    return {
      syncLogId: syncLog.id.toString(),
      recordsUploaded: uploaded,
      failedRecords: failed,
      conflictsDetected,
      status: finalStatus,
    };
  }

  async runPull(authorization?: string): Promise<SyncPullSummary> {
    if (!getSyncCloudBaseUrl()) {
      return {
        syncLogId: '0',
        recordsDownloaded: 0,
        failedRecords: 0,
        conflictsDetected: 0,
        status: 'SKIPPED',
      };
    }

    const ctx = this.requestContext.tryGet();
    if (ctx?.branchId == null) {
      throw new ApplicationException(
        ErrorCode.SYNC_BRANCH_REQUIRED,
        'branchId is required in request context for pull sync',
        HttpStatus.BAD_REQUEST,
      );
    }

    const cloudCtx = this.buildCloudContext(authorization);
    const deviceId = cloudCtx.deviceId;
    const startedAt = BigInt(Date.now());
    const syncLog = await this.prisma.client.syncLog.create({
      data: {
        uuid: randomUUID(),
        syncType: 'PULL',
        syncDirection: 'DOWNLOAD',
        startedAt,
        status: 'IN_PROGRESS',
        deviceId,
        createdAt: startedAt,
      },
    });

    const deviceState =
      await this.deviceSyncState.getOrCreateForCurrentContext();
    let cursor = deviceState.lastPullCursor;
    let downloaded = 0;
    let failed = 0;
    let conflictsDetected = 0;
    let pages = 0;

    try {
      while (pages < getSyncMaxPullPages()) {
        const page = await this.cloudClient.pullDelta(cloudCtx, cursor);
        pages += 1;

        if (page.records.length === 0 && !page.hasMore) {
          cursor = page.nextCursor;
          break;
        }

        const applyPage = await this.unitOfWork.run(async (tx) => {
          let pageDownloaded = 0;
          let pageFailed = 0;
          let pageConflicts = 0;

          const ordered = sortPullRecords(page.records);
          for (const record of ordered) {
            if (!isSyncEnabledEntityType(record.entityType)) {
              continue;
            }
            const outcome = await this.syncApply.applyPullRecord(
              tx,
              record,
              deviceId,
            );
            if (outcome.kind === 'applied') {
              pageDownloaded += 1;
            } else if (outcome.kind === 'skipped') {
              continue;
            } else if (outcome.kind === 'conflict') {
              pageConflicts += 1;
              pageFailed += 1;
              await this.syncApply.recordConflict(tx, {
                syncLogId: syncLog.id,
                entityType: record.entityType,
                entityUuid: record.entityUuid,
                conflictType: outcome.conflictType,
                localPayload: outcome.localPayload,
                serverPayload: outcome.serverPayload,
              });
            }
          }

          const pageClean = pageFailed === 0 && pageConflicts === 0;
          if (pageClean) {
            const state = await tx.deviceSyncState.findFirst({
              where: { id: deviceState.id },
            });
            if (state) {
              await tx.deviceSyncState.updateMany({
                where: { id: state.id, version: state.version },
                data: {
                  lastPullCursor: page.nextCursor,
                  lastPullAt: BigInt(Date.now()),
                  updatedAt: BigInt(Date.now()),
                  version: { increment: 1 },
                },
              });
            }
          }

          return {
            pageDownloaded,
            pageFailed,
            pageConflicts,
            nextCursor: page.nextCursor,
            pageClean,
          };
        });

        downloaded += applyPage.pageDownloaded;
        failed += applyPage.pageFailed;
        conflictsDetected += applyPage.pageConflicts;
        if (applyPage.pageClean) {
          cursor = applyPage.nextCursor;
        }

        if (!applyPage.pageClean) {
          break;
        }

        if (!page.hasMore) {
          break;
        }
      }
    } catch {
      const completedAt = BigInt(Date.now());
      await this.prisma.client.syncLog.update({
        where: { id: syncLog.id },
        data: {
          completedAt,
          status: 'FAILED',
          recordsDownloaded: downloaded,
          failedRecords: failed + 1,
          conflictsDetected,
          errorMessage: 'Pull request failed',
          version: { increment: 1 },
        },
      });
      return {
        syncLogId: syncLog.id.toString(),
        recordsDownloaded: downloaded,
        failedRecords: failed + 1,
        conflictsDetected,
        status: 'FAILED',
      };
    }

    const completedAt = BigInt(Date.now());
    const status = failed > 0 ? 'COMPLETED' : 'COMPLETED';

    await this.prisma.client.syncLog.update({
      where: { id: syncLog.id },
      data: {
        completedAt,
        recordsDownloaded: downloaded,
        failedRecords: failed,
        conflictsDetected,
        status,
        errorMessage: failed > 0 ? `${failed} pull record(s) failed` : null,
        version: { increment: 1 },
      },
    });

    return {
      syncLogId: syncLog.id.toString(),
      recordsDownloaded: downloaded,
      failedRecords: failed,
      conflictsDetected,
      status,
    };
  }

  async runPushAndPull(authorization?: string): Promise<{
    push: SyncRunSummary;
    pull: SyncPullSummary;
  }> {
    const push = await this.runPush(authorization);
    const pull = await this.runPull(authorization);
    return { push, pull };
  }

  private async markOutboxFailed(id: bigint, message: string) {
    await this.unitOfWork.run(async (tx) => {
      await tx.outbox.update({
        where: { id },
        data: {
          syncStatus: OutboxSyncStatus.FAILED,
          lastError: message.slice(0, 2000),
          retryCount: { increment: 1 },
          version: { increment: 1 },
        },
      });
    });
  }

  private async revertOutboxBatchToPending(rows: Outbox[], message: string) {
    const note = message.slice(0, 2000);
    for (const row of rows) {
      await this.unitOfWork.run(async (tx) => {
        await tx.outbox.updateMany({
          where: {
            id: row.id,
            syncStatus: OutboxSyncStatus.PROCESSING,
          },
          data: {
            syncStatus: OutboxSyncStatus.PENDING,
            lastError: note,
            version: { increment: 1 },
          },
        });
      });
    }
  }
}
