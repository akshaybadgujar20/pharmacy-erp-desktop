import { HttpStatus } from '@nestjs/common';
import type { PrismaClient } from '@prisma/client';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import {
  ID_SEQUENCE_MAX_RETRIES,
  ID_SEQUENCE_SINGLETON_ID,
  ID_SEQUENCE_TABLE_NAME,
} from './id-sequence.constants';

function retryBackoffMs(attempt: number): number {
  return 25 + Math.floor(Math.random() * 50) * attempt;
}

function isRetryableSequenceConflict(error: unknown): boolean {
  return (
    error instanceof ApplicationException &&
    error.code === ErrorCode.SEQUENCE_CONFLICT &&
    error.retryable
  );
}

/** Highest BigInt PK across business tables (excludes id_sequence). */
export async function computePeakBusinessId(
  client: PrismaClient,
): Promise<bigint> {
  const tables = await client.$queryRawUnsafe<Array<{ name: string }>>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%'",
  );

  let peak = 0n;

  for (const { name } of tables) {
    if (name === ID_SEQUENCE_TABLE_NAME) {
      continue;
    }
    try {
      const rows = await client.$queryRawUnsafe<
        Array<{ maxId: bigint | null }>
      >(`SELECT MAX(id) as maxId FROM "${name}"`);
      const maxId = rows[0]?.maxId;
      if (maxId != null && maxId > peak) {
        peak = maxId;
      }
    } catch {
      // Table may not have an id column — skip.
    }
  }

  return peak;
}

/** Ensure singleton row exists and is at least as high as existing business ids. */
export async function bootstrapIdSequence(client: PrismaClient): Promise<void> {
  const peakId = await computePeakBusinessId(client);
  const now = BigInt(Date.now());
  const row = await client.idSequence.findUnique({
    where: { id: ID_SEQUENCE_SINGLETON_ID },
  });

  if (!row) {
    await client.idSequence.create({
      data: {
        id: ID_SEQUENCE_SINGLETON_ID,
        currentValue: peakId,
        version: 1,
        updatedAt: now,
      },
    });
    return;
  }

  if (peakId > row.currentValue) {
    await client.idSequence.update({
      where: { id: ID_SEQUENCE_SINGLETON_ID },
      data: { currentValue: peakId, updatedAt: now },
    });
  }
}

async function allocateIdBlock(
  client: PrismaClient,
  count: bigint,
): Promise<bigint[]> {
  if (count <= 0n) {
    return [];
  }

  for (let attempt = 0; attempt < ID_SEQUENCE_MAX_RETRIES; attempt++) {
    try {
      return await client.$transaction(async (tx) => {
        const row = await tx.idSequence.findUnique({
          where: { id: ID_SEQUENCE_SINGLETON_ID },
        });

        if (!row) {
          throw new ApplicationException(
            ErrorCode.SEQUENCE_NOT_FOUND,
            'IdSequence singleton row is missing; run bootstrapIdSequence first',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }

        const startId = row.currentValue + 1n;
        const endId = row.currentValue + count;
        const now = BigInt(Date.now());

        const updated = await tx.idSequence.updateMany({
          where: { id: ID_SEQUENCE_SINGLETON_ID, version: row.version },
          data: {
            currentValue: endId,
            version: { increment: 1 },
            updatedAt: now,
          },
        });

        if (updated.count !== 1) {
          throw new ApplicationException(
            ErrorCode.SEQUENCE_CONFLICT,
            'IdSequence row was modified concurrently',
            HttpStatus.CONFLICT,
            { sequenceId: ID_SEQUENCE_SINGLETON_ID.toString() },
            true,
          );
        }

        const ids: bigint[] = [];
        for (let id = startId; id <= endId; id += 1n) {
          ids.push(id);
        }
        return ids;
      });
    } catch (error) {
      if (
        isRetryableSequenceConflict(error) &&
        attempt < ID_SEQUENCE_MAX_RETRIES - 1
      ) {
        await new Promise((resolve) =>
          setTimeout(resolve, retryBackoffMs(attempt)),
        );
        continue;
      }
      throw error;
    }
  }

  throw new ApplicationException(
    ErrorCode.SEQUENCE_CONFLICT,
    'IdSequence allocation failed after retries',
    HttpStatus.CONFLICT,
    { count: count.toString() },
  );
}

/** Allocate one PK id via atomic DB update (per-row allocation). */
export async function allocateNextId(client: PrismaClient): Promise<bigint> {
  const ids = await allocateIdBlock(client, 1n);
  return ids[0];
}

/** Allocate N contiguous PK ids in one atomic DB update (for createMany). */
export async function allocateNextIds(
  client: PrismaClient,
  count: number,
): Promise<bigint[]> {
  return allocateIdBlock(client, BigInt(count));
}
