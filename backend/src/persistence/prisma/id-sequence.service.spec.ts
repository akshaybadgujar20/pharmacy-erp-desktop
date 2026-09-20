import type { PrismaClient } from '@prisma/client';
import { ErrorCode } from '../../common/exceptions/error-code';
import { ApplicationException } from '../../common/exceptions/application.exception';
import {
  allocateNextId,
  allocateNextIds,
  bootstrapIdSequence,
} from './id-sequence.service';
import { ID_SEQUENCE_SINGLETON_ID } from './id-sequence.constants';

function createBootstrapMockClient(
  peakId: bigint,
  existingRow: {
    id: bigint;
    currentValue: bigint;
    version: number;
    updatedAt: bigint;
  } | null,
): {
  client: PrismaClient;
  create: jest.Mock;
  update: jest.Mock;
} {
  const create = jest.fn().mockResolvedValue({});
  const update = jest.fn().mockResolvedValue({});
  const client = {
    idSequence: {
      findUnique: jest.fn().mockResolvedValue(existingRow),
      create,
      update,
    },
    $queryRawUnsafe: jest
      .fn()
      .mockResolvedValueOnce([{ name: 'customer' }])
      .mockResolvedValueOnce([{ maxId: peakId === 0n ? null : peakId }]),
  } as unknown as PrismaClient;

  return { client, create, update };
}

function createMockClient(updateResults: number[]): {
  client: PrismaClient;
  updateMany: jest.Mock;
  transaction: jest.Mock;
} {
  let updateIndex = 0;
  const findUnique = jest.fn().mockResolvedValue({
    id: ID_SEQUENCE_SINGLETON_ID,
    currentValue: 10n,
    version: 2,
    updatedAt: 1000n,
  });
  const updateMany = jest
    .fn()
    .mockImplementation(() =>
      Promise.resolve({ count: updateResults[updateIndex++] ?? 1 }),
    );
  const tx = { idSequence: { findUnique, updateMany } };
  const transaction = jest.fn((fn: (inner: typeof tx) => Promise<unknown>) =>
    fn(tx),
  );
  const client = { $transaction: transaction } as unknown as PrismaClient;

  return { client, updateMany, transaction };
}

describe('id-sequence.service', () => {
  it('allocateNextId returns currentValue + 1 and persists', async () => {
    const { client, updateMany } = createMockClient([1]);

    const id = await allocateNextId(client);

    expect(id).toBe(11n);
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: ID_SEQUENCE_SINGLETON_ID, version: 2 },
      data: {
        currentValue: 11n,
        version: { increment: 1 },
        updatedAt: expect.anything() as bigint,
      },
    });
    const firstCall = updateMany.mock.calls[0] as [
      { data: { updatedAt: bigint } },
    ];
    expect(typeof firstCall[0].data.updatedAt).toBe('bigint');
  });

  it('allocateNextIds returns contiguous ids from one update', async () => {
    const { client } = createMockClient([1]);

    const ids = await allocateNextIds(client, 5);

    expect(ids).toEqual([11n, 12n, 13n, 14n, 15n]);
  });

  it('retries when updateMany count is zero then succeeds', async () => {
    const { client, transaction } = createMockClient([0, 1]);

    const id = await allocateNextId(client);

    expect(id).toBe(11n);
    expect(transaction).toHaveBeenCalledTimes(2);
  });

  it('throws SEQUENCE_CONFLICT after retries are exhausted', async () => {
    const { client, transaction } = createMockClient([0, 0, 0]);

    await expect(allocateNextId(client)).rejects.toMatchObject({
      code: ErrorCode.SEQUENCE_CONFLICT,
    });
    expect(transaction).toHaveBeenCalledTimes(3);
  });

  it('throws when singleton row is missing', async () => {
    const tx = {
      idSequence: {
        findUnique: jest.fn().mockResolvedValue(null),
        updateMany: jest.fn(),
      },
    };
    const client = {
      $transaction: jest.fn((fn: (inner: typeof tx) => Promise<unknown>) =>
        fn(tx),
      ),
    } as unknown as PrismaClient;

    await expect(allocateNextId(client)).rejects.toBeInstanceOf(
      ApplicationException,
    );
  });

  describe('bootstrapIdSequence', () => {
    it('creates singleton when missing', async () => {
      const { client, create, update } = createBootstrapMockClient(50n, null);

      await bootstrapIdSequence(client);

      expect(create).toHaveBeenCalledWith({
        data: {
          id: ID_SEQUENCE_SINGLETON_ID,
          currentValue: 50n,
          version: 1,
          updatedAt: expect.anything() as bigint,
        },
      });
      expect(update).not.toHaveBeenCalled();
    });

    it('heals currentValue when peak business id is higher', async () => {
      const { client, create, update } = createBootstrapMockClient(50n, {
        id: ID_SEQUENCE_SINGLETON_ID,
        currentValue: 10n,
        version: 2,
        updatedAt: 1000n,
      });

      await bootstrapIdSequence(client);

      expect(create).not.toHaveBeenCalled();
      expect(update).toHaveBeenCalledWith({
        where: { id: ID_SEQUENCE_SINGLETON_ID },
        data: {
          currentValue: 50n,
          updatedAt: expect.anything() as bigint,
        },
      });
    });

    it('does nothing when currentValue is already high enough', async () => {
      const { client, create, update } = createBootstrapMockClient(50n, {
        id: ID_SEQUENCE_SINGLETON_ID,
        currentValue: 100n,
        version: 2,
        updatedAt: 1000n,
      });

      await bootstrapIdSequence(client);

      expect(create).not.toHaveBeenCalled();
      expect(update).not.toHaveBeenCalled();
    });
  });
});
