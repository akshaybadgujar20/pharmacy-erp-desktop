import path from 'path';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';
import { nextBigIntId } from './bigint-id-sequence';

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
        async create({ args, query }) {
          const data = args.data as Record<string, unknown>;
          if (data && data.id === undefined) {
            args.data = { ...data, id: nextBigIntId() } as typeof args.data;
          }
          return query(args);
        },
      },
    },
  }) as unknown as PrismaClient;
}

