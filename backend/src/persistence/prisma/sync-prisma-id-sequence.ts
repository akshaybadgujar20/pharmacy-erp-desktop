import type { PrismaClient } from '@prisma/client';
import { syncBigIntIdSequenceFromDb } from './bigint-id-sequence';

/** Align in-memory id allocator with seeded SQLite rows (BIGINT PKs). */
export async function syncPrismaIdSequenceFromDatabase(
  client: PrismaClient,
): Promise<void> {
  await syncBigIntIdSequenceFromDb(async () => {
    const tables = await client.$queryRawUnsafe<Array<{ name: string }>>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%'",
    );

    let peak = 0n;

    for (const { name } of tables) {
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

    return peak > 0n ? peak : null;
  });
}
