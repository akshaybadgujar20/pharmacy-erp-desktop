import { Prisma } from '@prisma/client';
import { OutboxOperation } from '../../../persistence/outbox/outbox-operation.constants';
import type { TxClient } from '../../../persistence/prisma/prisma-tx.type';
import type { SyncCloudPullRecord } from '../../cloud/sync-cloud.contract';
import {
  extractApplyData,
  recordEntityUuid,
  serverVersionFromRecord,
  SyncApplyConflictError,
} from '../sync-apply.util';

export function asDecimal(value: unknown, fallback = '0'): Prisma.Decimal {
  if (value == null) {
    return new Prisma.Decimal(fallback);
  }
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'bigint'
  ) {
    return new Prisma.Decimal(String(value));
  }
  return new Prisma.Decimal(fallback);
}

export function asOptionalDecimal(value: unknown): Prisma.Decimal | null {
  if (value == null || value === '') {
    return null;
  }
  return asDecimal(value);
}

export function asInt(value: unknown, fieldName: string): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const n = Number(value);
    if (Number.isFinite(n)) {
      return Math.trunc(n);
    }
  }
  throw new Error(`Missing or invalid ${fieldName}`);
}

export function assertServerWins(
  existingVersion: bigint,
  serverVersion: bigint,
): void {
  if (existingVersion > serverVersion) {
    throw new SyncApplyConflictError('Local version is newer than server');
  }
}

type VersionedRow = { id: bigint; version: bigint };

export async function applyServerWin(
  tx: TxClient,
  record: SyncCloudPullRecord,
  load: (uuid: string) => Promise<VersionedRow | null>,
  buildCreate: (
    data: Record<string, unknown>,
    uuid: string,
    serverVersion: bigint,
  ) => Record<string, unknown> | Promise<Record<string, unknown>>,
  buildUpdate: (
    data: Record<string, unknown>,
    serverVersion: bigint,
  ) => Record<string, unknown> | Promise<Record<string, unknown>>,
  create: (row: Record<string, unknown>) => Promise<unknown>,
  update: (id: bigint, row: Record<string, unknown>) => Promise<unknown>,
  afterUpsert?: (
    data: Record<string, unknown>,
    headerUuid: string,
  ) => Promise<void>,
): Promise<void> {
  const data = extractApplyData(record.payload);
  const uuid = recordEntityUuid(record, data);
  const serverVersion = serverVersionFromRecord(record);

  if (record.operation === OutboxOperation.DELETE) {
    const existing = await load(uuid);
    if (existing) {
      await update(existing.id, {
        deletedAt: BigInt(Date.now()),
        version: serverVersion,
        updatedAt: BigInt(Date.now()),
      });
    }
    return;
  }

  const existing = await load(uuid);
  if (existing) {
    assertServerWins(existing.version, serverVersion);
    const patch = await Promise.resolve(buildUpdate(data, serverVersion));
    await update(existing.id, patch);
    if (afterUpsert) {
      await afterUpsert(data, uuid);
    }
    return;
  }

  const row = await Promise.resolve(buildCreate(data, uuid, serverVersion));
  await create(row);
  if (afterUpsert) {
    await afterUpsert(data, uuid);
  }
}

export async function applyConflictFirst(
  tx: TxClient,
  record: SyncCloudPullRecord,
  load: (uuid: string) => Promise<VersionedRow | null>,
  buildCreate: (
    data: Record<string, unknown>,
    uuid: string,
    serverVersion: bigint,
  ) => Record<string, unknown> | Promise<Record<string, unknown>>,
  buildUpdate: (
    data: Record<string, unknown>,
    serverVersion: bigint,
  ) => Record<string, unknown> | Promise<Record<string, unknown>>,
  create: (row: Record<string, unknown>) => Promise<unknown>,
  update: (id: bigint, row: Record<string, unknown>) => Promise<unknown>,
): Promise<void> {
  const data = extractApplyData(record.payload);
  const uuid = recordEntityUuid(record, data);
  const serverVersion = serverVersionFromRecord(record);
  const existing = await load(uuid);

  if (existing && existing.version > serverVersion) {
    throw new SyncApplyConflictError(
      'Conflict-first entity has newer local version',
    );
  }

  if (record.operation === OutboxOperation.DELETE) {
    return;
  }

  if (existing) {
    assertServerWins(existing.version, serverVersion);
    const patch = await Promise.resolve(buildUpdate(data, serverVersion));
    await update(existing.id, patch);
    return;
  }

  const row = await Promise.resolve(buildCreate(data, uuid, serverVersion));
  await create(row);
}

export type LineApplyHandler = (
  tx: TxClient,
  line: Record<string, unknown>,
  headerUuid: string,
) => Promise<void>;

export async function applyEmbeddedLines(
  tx: TxClient,
  data: Record<string, unknown>,
  headerUuid: string,
  applyLine: LineApplyHandler,
): Promise<void> {
  const lines = data.lines;
  if (!Array.isArray(lines)) {
    return;
  }
  for (const raw of lines) {
    if (!raw || typeof raw !== 'object') {
      continue;
    }
    await applyLine(tx, raw as Record<string, unknown>, headerUuid);
  }
}
