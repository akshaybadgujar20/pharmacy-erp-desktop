import { OutboxEntityType } from '../../persistence/outbox/entity-type.constants';
import type { SyncCloudPullRecord } from '../cloud/sync-cloud.contract';

export class SyncApplyConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SyncApplyConflictError';
  }
}

export class SyncApplyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SyncApplyError';
  }
}

export function extractApplyData(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== 'object') {
    return {};
  }
  const root = payload as Record<string, unknown>;
  if (root.data && typeof root.data === 'object') {
    return root.data as Record<string, unknown>;
  }
  return root;
}

export function recordEntityUuid(
  record: SyncCloudPullRecord,
  data: Record<string, unknown>,
): string {
  const fromData = data.uuid;
  if (typeof fromData === 'string' && fromData.length > 0) {
    return fromData;
  }
  return record.entityUuid;
}

export function asBigInt(value: unknown, fieldName: string): bigint {
  if (typeof value === 'bigint') {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return BigInt(Math.trunc(value));
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    return BigInt(value);
  }
  throw new SyncApplyError(`Missing or invalid ${fieldName}`);
}

export function asOptionalBigInt(value: unknown): bigint | null | undefined {
  if (value == null || value === '') {
    return null;
  }
  return asBigInt(value, 'id');
}

export function asString(value: unknown, fieldName: string): string {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  throw new SyncApplyError(`Missing or invalid ${fieldName}`);
}

export function asOptionalString(value: unknown): string | null | undefined {
  if (value == null || value === '') {
    return null;
  }
  return asString(value, 'value');
}

export function asBool(value: unknown, defaultValue: boolean): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  return defaultValue;
}

export function serverVersionFromRecord(record: SyncCloudPullRecord): bigint {
  return asBigInt(record.entityVersion, 'entityVersion');
}

export function isPartyLinkedEntity(entityType: string): boolean {
  return (
    entityType === OutboxEntityType.CUSTOMER ||
    entityType === OutboxEntityType.SUPPLIER ||
    entityType === OutboxEntityType.DOCTOR ||
    entityType === OutboxEntityType.EMPLOYEE ||
    entityType === OutboxEntityType.MANUFACTURER
  );
}
