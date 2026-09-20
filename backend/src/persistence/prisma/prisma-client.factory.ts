import path from 'path';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';
import { allocateNextId, allocateNextIds } from './id-sequence.service';

const ID_SEQUENCE_MODEL = 'IdSequence';

export function getDefaultDatabaseUrl(): string {
  return path.join(process.cwd(), '..', 'db', 'pharmacy.sqlite');
}

export function createPrismaClient(databasePath?: string): PrismaClient {
  const filePath = databasePath ?? getDefaultDatabaseUrl();
  const base = new PrismaClient({
    adapter: new PrismaBetterSqlite3({
      url: `file:${filePath}`,
    }),
  });

  return base.$extends({
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
}
