import type { PrismaClient } from '@prisma/client';
import { syncBigIntIdSequenceFromDb } from './bigint-id-sequence';

async function maxId(client: PrismaClient, finder: () => Promise<{ id: bigint } | null>): Promise<bigint> {
  const row = await finder();
  return row?.id ?? 0n;
}

/** Align in-memory id allocator with seeded SQLite rows (BIGINT PKs lack AUTOINCREMENT). */
export async function syncPrismaIdSequenceFromDatabase(client: PrismaClient): Promise<void> {
  await syncBigIntIdSequenceFromDb(async () => {
    const ids = await Promise.all([
      maxId(client, () => client.stockMovement.findFirst({ orderBy: { id: 'desc' }, select: { id: true } })),
      maxId(client, () => client.salesInvoice.findFirst({ orderBy: { id: 'desc' }, select: { id: true } })),
      maxId(client, () => client.outbox.findFirst({ orderBy: { id: 'desc' }, select: { id: true } })),
      maxId(client, () => client.stock.findFirst({ orderBy: { id: 'desc' }, select: { id: true } })),
      maxId(client, () => client.batch.findFirst({ orderBy: { id: 'desc' }, select: { id: true } })),
      maxId(client, () => client.medicine.findFirst({ orderBy: { id: 'desc' }, select: { id: true } })),
      maxId(client, () => client.party.findFirst({ orderBy: { id: 'desc' }, select: { id: true } })),
      maxId(client, () => client.sequenceGenerator.findFirst({ orderBy: { id: 'desc' }, select: { id: true } })),
      maxId(client, () => client.customer.findFirst({ orderBy: { id: 'desc' }, select: { id: true } })),
      maxId(client, () => client.goodsReceipt.findFirst({ orderBy: { id: 'desc' }, select: { id: true } })),
    ]);

    const peak = ids.reduce((a, b) => (b > a ? b : a), 0n);
    return peak > 0n ? peak : null;
  });
}
