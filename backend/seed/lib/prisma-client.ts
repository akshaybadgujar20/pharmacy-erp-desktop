import path from 'path';
import { createPrismaClient } from '../../src/persistence/prisma/prisma-client.factory';
import type { PrismaClient } from '@prisma/client';

let client: PrismaClient | null = null;

function resolveDatabasePathFromEnv(): string | undefined {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl?.startsWith('file:')) {
    return undefined;
  }
  const rawPath = databaseUrl.replace(/^file:/, '');
  return path.isAbsolute(rawPath)
    ? rawPath
    : path.resolve(process.cwd(), rawPath);
}

export function getPrisma(): PrismaClient {
  if (!client) {
    client = createPrismaClient(resolveDatabasePathFromEnv());
  }
  return client;
}

export async function disconnectPrisma(): Promise<void> {
  if (client) {
    await client.$disconnect();
    client = null;
  }
}
