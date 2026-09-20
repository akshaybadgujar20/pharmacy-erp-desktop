import { Outbox } from '@prisma/client';
import { serializeEpochMs, serializeOptionalBigInt } from '../utils/sync.util';

export interface OutboxResponse {
  id: string;
  uuid: string;
  entityType: string;
  entityUuid: string;
  operation: string;
  payload: unknown;
  payloadVersion: string;
  deviceId: string;
  branchId: string | null;
  operationId: string;
  sequenceNo: string;
  syncStatus: string;
  retryCount: number;
  lastError: string | null;
  createdAt: string;
  processedAt: string | null;
  version: string;
}

export function toOutboxResponse(outbox: Outbox): OutboxResponse {
  return {
    id: outbox.id.toString(),
    uuid: outbox.uuid,
    entityType: outbox.entityType,
    entityUuid: outbox.entityUuid,
    operation: outbox.operation,
    payload: outbox.payload,
    payloadVersion: outbox.payloadVersion.toString(),
    deviceId: outbox.deviceId,
    branchId: serializeOptionalBigInt(outbox.branchId),
    operationId: outbox.operationId,
    sequenceNo: outbox.sequenceNo.toString(),
    syncStatus: outbox.syncStatus,
    retryCount: outbox.retryCount,
    lastError: outbox.lastError,
    createdAt: serializeEpochMs(outbox.createdAt) ?? '',
    processedAt: serializeEpochMs(outbox.processedAt),
    version: outbox.version.toString(),
  };
}
