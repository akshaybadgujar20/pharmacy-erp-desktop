import { randomUUID } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import { RequestContextService } from '../../persistence/context/request-context.service';
import { OutboxSyncStatus } from '../../persistence/outbox/outbox-operation.constants';
import { UnitOfWorkService } from '../../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../../prisma.service';

export interface SyncRunSummary {
  syncLogId: string;
  recordsUploaded: number;
  failedRecords: number;
  status: string;
}

@Injectable()
export class SyncRunService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly requestContext: RequestContextService,
  ) {}

  async getLatestRun() {
    const deviceId = this.requestContext.tryGet()?.deviceId;
    const log = await this.prisma.client.syncLog.findFirst({
      where: deviceId ? { deviceId } : undefined,
      orderBy: { startedAt: 'desc' },
    });
    if (!log) {
      return null;
    }
    return {
      id: log.id.toString(),
      status: log.status,
      recordsUploaded: log.recordsUploaded,
      failedRecords: log.failedRecords,
      startedAt: log.startedAt.toString(),
      completedAt: log.completedAt?.toString() ?? null,
    };
  }

  async runPush(): Promise<SyncRunSummary> {
    const cloudUrl = process.env.SYNC_CLOUD_URL?.trim();
    if (!cloudUrl) {
      throw new ApplicationException(
        ErrorCode.SYNC_CLOUD_URL_NOT_CONFIGURED,
        'SYNC_CLOUD_URL is not configured',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const deviceId = this.requestContext.getDeviceId();
    const batchSize = Math.min(
      Math.max(parseInt(process.env.SYNC_BATCH_SIZE ?? '50', 10), 1),
      200,
    );
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
      where: { deviceId, syncStatus: OutboxSyncStatus.PENDING },
      orderBy: { sequenceNo: 'asc' },
      take: batchSize,
    });

    let uploaded = 0;
    let failed = 0;

    for (const row of pending) {
      const claimed = await this.unitOfWork.run(async (tx) => {
        const result = await tx.outbox.updateMany({
          where: {
            id: row.id,
            syncStatus: OutboxSyncStatus.PENDING,
          },
          data: {
            syncStatus: OutboxSyncStatus.PROCESSING,
            version: { increment: 1 },
          },
        });
        return result.count === 1;
      });

      if (!claimed) {
        continue;
      }

      try {
        const response = await fetch(cloudUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operationId: row.operationId,
            entityType: row.entityType,
            entityUuid: row.entityUuid,
            operation: row.operation,
            payload: row.payload,
            deviceId: row.deviceId,
            sequenceNo: row.sequenceNo.toString(),
          }),
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || `HTTP ${response.status}`);
        }

        const now = BigInt(Date.now());
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
      } catch (error) {
        failed += 1;
        const message =
          error instanceof Error ? error.message : 'Unknown sync error';
        await this.unitOfWork.run(async (tx) => {
          await tx.outbox.update({
            where: { id: row.id },
            data: {
              syncStatus: OutboxSyncStatus.FAILED,
              lastError: message.slice(0, 2000),
              retryCount: { increment: 1 },
              version: { increment: 1 },
            },
          });
        });
      }
    }

    const completedAt = BigInt(Date.now());
    const finalStatus = failed > 0 && uploaded === 0 ? 'FAILED' : 'COMPLETED';

    await this.prisma.client.syncLog.update({
      where: { id: syncLog.id },
      data: {
        completedAt,
        recordsUploaded: uploaded,
        failedRecords: failed,
        status: finalStatus,
        errorMessage: failed > 0 ? `${failed} record(s) failed` : null,
        version: { increment: 1 },
      },
    });

    return {
      syncLogId: syncLog.id.toString(),
      recordsUploaded: uploaded,
      failedRecords: failed,
      status: finalStatus,
    };
  }

  async runPull(): Promise<{ recordsDownloaded: number; status: string }> {
    const cloudUrl = process.env.SYNC_CLOUD_URL?.trim();
    if (!cloudUrl) {
      return { recordsDownloaded: 0, status: 'SKIPPED' };
    }

    const deviceId = this.requestContext.getDeviceId();
    const pullUrl = `${cloudUrl.replace(/\/$/, '')}/pull?deviceId=${encodeURIComponent(deviceId)}`;

    try {
      const response = await fetch(pullUrl, { method: 'GET' });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}`);
      }
      const payload = (await response.json()) as { records?: unknown[] };
      const records = Array.isArray(payload.records) ? payload.records : [];
      return { recordsDownloaded: records.length, status: 'COMPLETED' };
    } catch {
      return { recordsDownloaded: 0, status: 'FAILED' };
    }
  }

  async runPushAndPull(): Promise<{
    push: SyncRunSummary;
    pull: { recordsDownloaded: number; status: string };
  }> {
    const push = await this.runPush();
    const pull = await this.runPull();
    return { push, pull };
  }
}
