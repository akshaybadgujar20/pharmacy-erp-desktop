import { Injectable } from '@nestjs/common';
import type { TxClient } from '../../persistence/prisma/prisma-tx.type';
import type { SyncCloudPullRecord } from '../cloud/sync-cloud.contract';
import { applyPhase1Record } from '../apply/masters-party.apply';
import {
  SyncApplyConflictError,
  SyncApplyError,
  extractApplyData,
} from '../apply/sync-apply.util';
import { applyTransactionalRecord } from '../apply/transactional/transactional.apply';
import { isSyncEnabledEntityType } from '../constants/sync-enabled-entity-types';
import { isSyncPhase1EntityType } from '../constants/sync-phase1-entity-types';
import { SyncConflictResolutionStatus } from '../constants/sync.constants';

export type SyncApplyOutcome =
  | { kind: 'applied' }
  | { kind: 'skipped' }
  | {
      kind: 'conflict';
      conflictType: string;
      localPayload: unknown;
      serverPayload: unknown;
      message: string;
    };

@Injectable()
export class SyncApplyService {
  async applyPullRecord(
    tx: TxClient,
    record: SyncCloudPullRecord,
    currentDeviceId: string,
  ): Promise<SyncApplyOutcome> {
    if (!isSyncEnabledEntityType(record.entityType)) {
      return { kind: 'skipped' };
    }
    if (record.originDeviceId && record.originDeviceId === currentDeviceId) {
      return { kind: 'skipped' };
    }

    try {
      if (isSyncPhase1EntityType(record.entityType)) {
        await applyPhase1Record(tx, record);
      } else {
        await applyTransactionalRecord(tx, record);
      }
      return { kind: 'applied' };
    } catch (error) {
      if (error instanceof SyncApplyConflictError) {
        return {
          kind: 'conflict',
          conflictType: 'VERSION_MISMATCH',
          localPayload: record.payload,
          serverPayload: record.payload,
          message: error.message,
        };
      }
      if (error instanceof SyncApplyError) {
        return {
          kind: 'conflict',
          conflictType: 'APPLY_FAILED',
          localPayload: record.payload,
          serverPayload: record.payload,
          message: error.message,
        };
      }
      throw error;
    }
  }

  async applyServerWinFromPush(
    tx: TxClient,
    entityType: string,
    entityUuid: string,
    serverPayload: unknown,
    serverEntityVersion: string,
  ): Promise<SyncApplyOutcome> {
    const record: SyncCloudPullRecord = {
      entityType,
      entityUuid,
      operation: 'UPDATE',
      entityVersion: serverEntityVersion,
      originDeviceId: 'cloud',
      payload:
        typeof serverPayload === 'object' && serverPayload !== null
          ? { data: extractApplyData(serverPayload) }
          : { data: {} },
    };
    return this.applyPullRecord(tx, record, 'cloud');
  }

  async recordConflict(
    tx: TxClient,
    input: {
      syncLogId: bigint;
      entityType: string;
      entityUuid: string;
      conflictType: string;
      localPayload: unknown;
      serverPayload: unknown;
    },
  ): Promise<void> {
    const now = BigInt(Date.now());
    await tx.syncConflict.create({
      data: {
        syncLogId: input.syncLogId,
        entityType: input.entityType,
        entityUuid: input.entityUuid,
        conflictType: input.conflictType,
        localPayload: input.localPayload as object,
        serverPayload: input.serverPayload as object,
        resolutionStatus: SyncConflictResolutionStatus.PENDING,
        createdAt: now,
      },
    });
  }
}
