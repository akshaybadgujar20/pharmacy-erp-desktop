import { HttpStatus } from '@nestjs/common';
import type { PrismaClient } from '@prisma/client';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import { ID_SEQUENCE_MAX_RETRIES } from './id-sequence.constants';
import {
  getAllocatableModel,
  getAllocatableModels,
} from './id-sequence-models.util';

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

/** Highest BigInt PK for a physical table. */
export async function computePeakIdForTable(
  client: PrismaClient,
  tableName: string,
): Promise<bigint> {
  try {
    const rows = await client.$queryRawUnsafe<Array<{ maxId: bigint | null }>>(
      `SELECT MAX(id) as maxId FROM "${tableName}"`,
    );
    const maxId = rows[0]?.maxId;
    return maxId != null ? maxId : 0n;
  } catch {
    return 0n;
  }
}

/** @deprecated Use computePeakIdForTable per model; kept for migration diagnostics. */
export async function computePeakBusinessId(
  client: PrismaClient,
): Promise<bigint> {
  let peak = 0n;
  for (const model of getAllocatableModels()) {
    const maxId = await computePeakIdForTable(client, model.tableName);
    if (maxId > peak) {
      peak = maxId;
    }
  }
  return peak;
}

async function ensureSequenceRow(
  client: Pick<PrismaClient, 'idSequence' | '$queryRawUnsafe'>,
  modelName: string,
): Promise<void> {
  const allocatable = getAllocatableModel(modelName);
  if (!allocatable) {
    throw new ApplicationException(
      ErrorCode.SEQUENCE_NOT_FOUND,
      `No id sequence for model ${modelName}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  const existing = await client.idSequence.findUnique({
    where: { modelName },
  });
  if (existing) {
    return;
  }

  const peakId = await computePeakIdForTable(
    client as PrismaClient,
    allocatable.tableName,
  );
  const now = BigInt(Date.now());
  await client.idSequence.create({
    data: {
      modelName,
      currentValue: peakId,
      version: 1n,
      updatedAt: now,
    },
  });
}

/** Ensure one counter row per allocatable model; reconcile currentValue with MAX(id). */
export async function bootstrapIdSequence(client: PrismaClient): Promise<void> {
  const now = BigInt(Date.now());

  for (const model of getAllocatableModels()) {
    const peakId = await computePeakIdForTable(client, model.tableName);
    const existing = await client.idSequence.findUnique({
      where: { modelName: model.modelName },
    });

    if (!existing) {
      await client.idSequence.create({
        data: {
          modelName: model.modelName,
          currentValue: peakId,
          version: 1n,
          updatedAt: now,
        },
      });
      continue;
    }

    if (peakId > existing.currentValue) {
      await client.idSequence.update({
        where: { modelName: model.modelName },
        data: { currentValue: peakId, updatedAt: now },
      });
    }
  }
}

async function allocateIdBlock(
  client: PrismaClient,
  modelName: string,
  count: bigint,
): Promise<bigint[]> {
  if (count <= 0n) {
    return [];
  }

  for (let attempt = 0; attempt < ID_SEQUENCE_MAX_RETRIES; attempt++) {
    try {
      return await client.$transaction(async (tx) => {
        let row = await tx.idSequence.findUnique({
          where: { modelName },
        });

        if (!row) {
          await ensureSequenceRow(tx, modelName);
          row = await tx.idSequence.findUnique({
            where: { modelName },
          });
        }

        if (!row) {
          throw new ApplicationException(
            ErrorCode.SEQUENCE_NOT_FOUND,
            `IdSequence row is missing for ${modelName}; run bootstrapIdSequence first`,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }

        const startId = row.currentValue + 1n;
        const endId = row.currentValue + count;
        const now = BigInt(Date.now());

        const updated = await tx.idSequence.updateMany({
          where: { modelName, version: row.version },
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
            { modelName },
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
    { modelName, count: count.toString() },
  );
}

/** Allocate one PK id via atomic DB update (per-row allocation). */
export async function allocateNextId(
  client: PrismaClient,
  modelName: string,
): Promise<bigint> {
  const ids = await allocateIdBlock(client, modelName, 1n);
  return ids[0];
}

/** Allocate N contiguous PK ids in one atomic DB update (for createMany). */
export async function allocateNextIds(
  client: PrismaClient,
  modelName: string,
  count: number,
): Promise<bigint[]> {
  return allocateIdBlock(client, modelName, BigInt(count));
}
