import path from 'path';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';
import { nextId } from './id-registry';

let client: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  if (!client) {
    const base = new PrismaClient({
      adapter: new PrismaBetterSqlite3({
        url: `file:${path.join(process.cwd(), '..', 'db', 'pharmacy.sqlite')}`,
      }),
    });

    client = base.$extends({
      query: {
        $allModels: {
          async create({ args, query }) {
            const data = args.data as Record<string, unknown>;
            if (data && data.id === undefined) {
              args.data = { ...data, id: nextId() };
            }
            return query(args);
          },
        },
      },
    }) as unknown as PrismaClient;
  }
  return client;
}

export async function disconnectPrisma(): Promise<void> {
  if (client) {
    await client.$disconnect();
    client = null;
  }
}
