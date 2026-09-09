import { ChangeHistory } from '@prisma/client';

export interface ChangeHistoryResponse {
  id: string;
  uuid: string;
  auditLogId: string;
  entityType: string;
  entityId: string;
  entityUuid: string | null;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  dataType: string | null;
  changeType: string;
  changedAt: string;
  version: number;
}

function serializeEpochMs(value: bigint): string {
  return new Date(Number(value)).toISOString();
}

export function toChangeHistoryResponse(
  changeHistory: ChangeHistory,
): ChangeHistoryResponse {
  return {
    id: changeHistory.id.toString(),
    uuid: changeHistory.uuid,
    auditLogId: changeHistory.auditLogId.toString(),
    entityType: changeHistory.entityType,
    entityId: changeHistory.entityId.toString(),
    entityUuid: changeHistory.entityUuid,
    fieldName: changeHistory.fieldName,
    oldValue: changeHistory.oldValue,
    newValue: changeHistory.newValue,
    dataType: changeHistory.dataType,
    changeType: changeHistory.changeType,
    changedAt: serializeEpochMs(changeHistory.changedAt),
    version: changeHistory.version,
  };
}
