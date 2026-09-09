import { Prisma } from '@prisma/client';
import type { AuditService, AuditLogInput } from '../audit.service';
import type { TxClient } from '../../persistence/prisma/prisma-tx.type';

export interface FieldChangeInput {
  entityType: string;
  entityId: bigint;
  entityUuid?: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  dataType: string;
  changeType: 'UPDATE';
}

export interface FieldDefinition {
  name: string;
  dataType?: string;
}

function serializeValue(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (value instanceof Prisma.Decimal) {
    return value.toString();
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  return JSON.stringify(value);
}

function valuesEqual(a: unknown, b: unknown): boolean {
  return serializeValue(a) === serializeValue(b);
}

function inferDataType(a: unknown, b: unknown): string {
  const sample = a ?? b;
  if (typeof sample === 'boolean') {
    return 'boolean';
  }
  if (typeof sample === 'bigint') {
    return 'bigint';
  }
  if (sample instanceof Prisma.Decimal) {
    return 'decimal';
  }
  if (typeof sample === 'number') {
    return 'number';
  }
  return 'string';
}

export function buildFieldChanges<T extends Record<string, unknown>>(
  before: T,
  after: T,
  fields: FieldDefinition[],
  entityType: string,
  entityId: bigint,
  entityUuid?: string,
): FieldChangeInput[] {
  const changes: FieldChangeInput[] = [];

  for (const field of fields) {
    const oldValue = before[field.name];
    const newValue = after[field.name];

    if (!valuesEqual(oldValue, newValue)) {
      changes.push({
        entityType,
        entityId,
        entityUuid,
        fieldName: field.name,
        oldValue: serializeValue(oldValue),
        newValue: serializeValue(newValue),
        dataType: field.dataType ?? inferDataType(oldValue, newValue),
        changeType: 'UPDATE',
      });
    }
  }

  return changes;
}

export async function auditAndLogChanges(
  tx: TxClient,
  auditService: AuditService,
  input: AuditLogInput,
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  fields: FieldDefinition[],
): Promise<void> {
  const auditLogId = await auditService.log(tx, input);
  const changes = buildFieldChanges(
    before,
    after,
    fields,
    input.entityType,
    input.entityId!,
    input.entityUuid,
  );

  if (changes.length > 0) {
    await auditService.logFieldChanges(tx, auditLogId, changes);
  }
}
