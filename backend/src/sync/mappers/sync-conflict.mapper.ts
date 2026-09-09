import { SyncConflict } from '@prisma/client';
import { serializeEpochMs } from '../utils/sync.util';

export interface SyncConflictResponse {
  id: string;
  uuid: string;
  syncLogId: string;
  entityType: string;
  entityUuid: string;
  conflictType: string;
  localPayload: unknown;
  serverPayload: unknown;
  resolutionStatus: string;
  resolutionStrategy: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  remarks: string | null;
  createdAt: string;
  version: number;
}

export function toSyncConflictResponse(
  conflict: SyncConflict,
): SyncConflictResponse {
  return {
    id: conflict.id.toString(),
    uuid: conflict.uuid,
    syncLogId: conflict.syncLogId.toString(),
    entityType: conflict.entityType,
    entityUuid: conflict.entityUuid,
    conflictType: conflict.conflictType,
    localPayload: conflict.localPayload,
    serverPayload: conflict.serverPayload,
    resolutionStatus: conflict.resolutionStatus,
    resolutionStrategy: conflict.resolutionStrategy,
    resolvedBy: conflict.resolvedBy,
    resolvedAt: serializeEpochMs(conflict.resolvedAt),
    remarks: conflict.remarks,
    createdAt: serializeEpochMs(conflict.createdAt) ?? '',
    version: conflict.version,
  };
}
