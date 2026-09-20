import path from 'path';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { Prisma, PrismaClient } from '@prisma/client';
import { allocateNextId, allocateNextIds } from './id-sequence.service';
import { runWithPrismaTransactionContext } from './prisma-transaction.storage';

const ID_SEQUENCE_MODEL = 'IdSequence';

export function getDefaultDatabaseUrl(): string {
  return path.join(process.cwd(), '..', 'db', 'pharmacy.sqlite');
}

function patchTransactionContext(client: PrismaClient): void {
  /* Query extensions must stay on the client passed to $transaction; patch after $extends. */
  /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call -- Prisma $transaction overloads */
  const boundTransaction = client.$transaction.bind(client);

  client.$transaction = ((arg: unknown, options?: unknown) => {
    if (typeof arg === 'function') {
      const fn = arg as (tx: Prisma.TransactionClient) => Promise<unknown>;
      return boundTransaction(
        (tx: Prisma.TransactionClient) =>
          runWithPrismaTransactionContext(tx, () => fn(tx)),
        options,
      );
    }
    return boundTransaction(
      arg as Parameters<PrismaClient['$transaction']>[0],
      options as Parameters<PrismaClient['$transaction']>[1],
    );
  }) as PrismaClient['$transaction'];
  /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call */
}

export function createPrismaClient(databasePath?: string): PrismaClient {
  const filePath = databasePath ?? getDefaultDatabaseUrl();
  const base = new PrismaClient({
    adapter: new PrismaBetterSqlite3({
      url: `file:${filePath}`,
    }),
  });

  const client = base.$extends({
    query: {
      $allModels: {
        async create({ model, args, query }) {
          if (model === ID_SEQUENCE_MODEL) {
            return query(args);
          }
          const data = args.data as Record<string, unknown>;
          if (data && data.id === undefined) {
            const id = await allocateNextId(base, model);
            args.data = { ...data, id } as typeof args.data;
          }
          return query(args);
        },
        async createMany({ model, args, query }) {
          if (model === ID_SEQUENCE_MODEL) {
            return query(args);
          }
          const rows = args.data as Array<Record<string, unknown>>;
          if (!Array.isArray(rows)) {
            return query(args);
          }

          const missingIdCount = rows.filter(
            (row) => row.id === undefined,
          ).length;
          if (missingIdCount === 0) {
            return query(args);
          }

          const ids = await allocateNextIds(base, model, missingIdCount);
          let idIndex = 0;
          args.data = rows.map((row) =>
            row.id === undefined ? { ...row, id: ids[idIndex++] } : row,
          ) as typeof args.data;

          return query(args);
        },
      },
    },
  }) as unknown as PrismaClient;

  patchTransactionContext(client);
  return client;
}
