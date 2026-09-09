import { AuditLog } from '@prisma/client';

export interface AuditLogResponse {
  id: string;
  uuid: string;
  userId: string | null;
  companyId: string | null;
  branchId: string | null;
  entityType: string;
  entityId: string | null;
  entityUuid: string | null;
  action: string;
  module: string;
  description: string | null;
  ipAddress: string | null;
  deviceId: string | null;
  sessionId: string | null;
  actionTimestamp: string;
  correlationId: string | null;
  createdAt: string;
  version: number;
}

function serializeEpochMs(value: bigint): string {
  return new Date(Number(value)).toISOString();
}

function serializeOptionalBigInt(value: bigint | null): string | null {
  return value != null ? value.toString() : null;
}

export function toAuditLogResponse(auditLog: AuditLog): AuditLogResponse {
  return {
    id: auditLog.id.toString(),
    uuid: auditLog.uuid,
    userId: serializeOptionalBigInt(auditLog.userId),
    companyId: serializeOptionalBigInt(auditLog.companyId),
    branchId: serializeOptionalBigInt(auditLog.branchId),
    entityType: auditLog.entityType,
    entityId: serializeOptionalBigInt(auditLog.entityId),
    entityUuid: auditLog.entityUuid,
    action: auditLog.action,
    module: auditLog.module,
    description: auditLog.description,
    ipAddress: auditLog.ipAddress,
    deviceId: auditLog.deviceId,
    sessionId: auditLog.sessionId,
    actionTimestamp: serializeEpochMs(auditLog.actionTimestamp),
    correlationId: auditLog.correlationId,
    createdAt: serializeEpochMs(auditLog.createdAt),
    version: auditLog.version,
  };
}
