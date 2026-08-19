#!/usr/bin/env tsx
import { clearRegistry } from './lib/id-registry';
import { initFaker } from './lib/faker';
import { loadMasters, loadUsers } from './lib/load-masters';
import { disconnectPrisma, getPrisma } from './lib/prisma-client';
import { SeedContext } from './lib/seed-context';
import { wipeDatabase } from './lib/wipe';
import { seedParties } from './lib/generators/party.generator';
import { seedMedicine, seedPricing } from './lib/generators/medicine.generator';
import { seedInventory } from './lib/generators/inventory.generator';
import { seedPurchase } from './lib/generators/purchase.generator';
import { seedSales } from './lib/generators/sales.generator';
import { seedFinancialAndAudit, seedSync } from './lib/generators/sync.generator';

type Phase =
  | 'masters'
  | 'party'
  | 'medicine'
  | 'pricing'
  | 'inventory'
  | 'purchase'
  | 'sales'
  | 'sync'
  | 'financial';

const PHASE_ORDER: Phase[] = [
  'masters',
  'party',
  'medicine',
  'pricing',
  'inventory',
  'purchase',
  'sales',
  'sync',
  'financial',
];

function parseArgs(argv: string[]): { fresh: boolean; only?: Phase } {
  const fresh = !argv.includes('--no-wipe');
  const onlyIdx = argv.indexOf('--only');
  const only = onlyIdx >= 0 ? (argv[onlyIdx + 1] as Phase | undefined) : undefined;
  return { fresh, only };
}

function shouldRun(phase: Phase, only: Phase | undefined, startIdx: number, phaseIdx: number): boolean {
  if (!only) return true;
  const onlyIdx = PHASE_ORDER.indexOf(only);
  return phaseIdx >= onlyIdx;
}

async function printSummary(prisma: ReturnType<typeof getPrisma>): Promise<void> {
  const counts = await Promise.all([
    prisma.salesInvoice.count(),
    prisma.batch.count(),
    prisma.stockMovement.count(),
    prisma.outbox.count(),
    prisma.party.count(),
    prisma.medicine.count(),
  ]);

  console.log('\nSeed summary:');
  console.log(`  Sales invoices: ${counts[0]}`);
  console.log(`  Batches:        ${counts[1]}`);
  console.log(`  Stock movements:${counts[2]}`);
  console.log(`  Outbox rows:    ${counts[3]}`);
  console.log(`  Parties:        ${counts[4]}`);
  console.log(`  Medicines:      ${counts[5]}`);
}

async function main(): Promise<void> {
  const { fresh, only } = parseArgs(process.argv.slice(2));
  initFaker();
  clearRegistry();

  const prisma = getPrisma();
  const ctx = new SeedContext(prisma);

  console.log(`Pharmacy ERP seed starting (fresh=${fresh}${only ? `, only=${only}` : ''})`);

  if (fresh && !only) {
    console.log('Wiping existing data...');
    await wipeDatabase(prisma);
    clearRegistry();
  }

  const run = (phase: Phase, fn: () => Promise<void>) => {
    const idx = PHASE_ORDER.indexOf(phase);
    if (!shouldRun(phase, only, 0, idx)) return Promise.resolve();
    console.log(`Phase: ${phase}`);
    return fn();
  };

  await run('masters', async () => {
    await loadMasters(prisma, ctx);
  });

  await run('party', async () => {
    await seedParties(prisma, ctx);
    await loadUsers(prisma, ctx);
  });

  await run('medicine', () => seedMedicine(prisma, ctx));
  await run('pricing', () => seedPricing(prisma, ctx));
  await run('inventory', () => seedInventory(prisma, ctx));
  await run('purchase', () => seedPurchase(prisma, ctx));
  await run('sales', () => seedSales(prisma, ctx));
  await run('sync', () => seedSync(prisma, ctx));
  await run('financial', () => seedFinancialAndAudit(prisma, ctx));

  await printSummary(prisma);
  await disconnectPrisma();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
