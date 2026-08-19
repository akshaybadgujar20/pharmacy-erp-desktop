import { Prisma } from '@prisma/client';
import { ApplicationException } from '../../src/common/exceptions/application.exception';
import { ErrorCode } from '../../src/common/exceptions/error-code';
import { InventoryLedgerService } from '../../src/persistence/inventory/inventory-ledger.service';
import {
  createPersistenceTestContext,
  ensureStockMovementSequence,
  loadSeededBatchWithStock,
  loadSeededBranch,
  runWithTestContext,
} from './persistence-test.helpers';

describe('InventoryLedgerService (integration)', () => {
  let inventoryLedger: InventoryLedgerService;
  let services: Awaited<ReturnType<typeof createPersistenceTestContext>>['services'];
  let seed: Awaited<ReturnType<typeof loadSeededBranch>>;
  let moduleRef: Awaited<ReturnType<typeof createPersistenceTestContext>>['moduleRef'];

  beforeAll(async () => {
    const ctx = await createPersistenceTestContext();
    moduleRef = ctx.moduleRef;
    services = ctx.services;
    inventoryLedger = moduleRef.get(InventoryLedgerService);
    seed = await loadSeededBranch(services.prisma);
    await ensureStockMovementSequence(services.prisma, seed.company.id, seed.branch.id);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('IN increases stock and OUT decreases stock', async () => {
    const { stock, batch } = await loadSeededBatchWithStock(services.prisma, seed.branch.id);
    const before = new Prisma.Decimal(stock.availableQuantity);

    await runWithTestContext(services, seed, () =>
      services.unitOfWork.run(async (tx) =>
        inventoryLedger.applyMovement(tx, {
          branchId: seed.branch.id,
          branchCode: seed.branch.branchCode,
          companyId: seed.company.id,
          medicineId: batch.medicineId,
          batchId: batch.id,
          direction: 'IN',
          quantity: 5,
          unitCost: batch.purchaseRate,
          movementType: 'ADJUSTMENT_GAIN',
          referenceTable: 'integration_test',
          referenceId: 1n,
        }),
      ),
    );

    const afterIn = await services.prisma.client.stock.findFirstOrThrow({
      where: { id: stock.id },
    });
    expect(new Prisma.Decimal(afterIn.availableQuantity).equals(before.add(5))).toBe(true);

    await runWithTestContext(services, seed, () =>
      services.unitOfWork.run(async (tx) =>
        inventoryLedger.applyMovement(tx, {
          branchId: seed.branch.id,
          branchCode: seed.branch.branchCode,
          companyId: seed.company.id,
          medicineId: batch.medicineId,
          batchId: batch.id,
          direction: 'OUT',
          quantity: 3,
          unitCost: batch.purchaseRate,
          movementType: 'SALES_INVOICE',
          referenceTable: 'integration_test',
          referenceId: 2n,
        }),
      ),
    );

    const afterOut = await services.prisma.client.stock.findFirstOrThrow({
      where: { id: stock.id },
    });
    expect(new Prisma.Decimal(afterOut.availableQuantity).equals(before.add(2))).toBe(true);
  });

  it('throws STOCK_INSUFFICIENT when OUT exceeds available quantity', async () => {
    const { stock, batch } = await loadSeededBatchWithStock(services.prisma, seed.branch.id);
    const available = new Prisma.Decimal(
      (await services.prisma.client.stock.findFirstOrThrow({ where: { id: stock.id } }))
        .availableQuantity,
    );

    await expect(
      runWithTestContext(services, seed, () =>
        services.unitOfWork.run(async (tx) =>
          inventoryLedger.applyMovement(tx, {
            branchId: seed.branch.id,
            branchCode: seed.branch.branchCode,
            companyId: seed.company.id,
            medicineId: batch.medicineId,
            batchId: batch.id,
            direction: 'OUT',
            quantity: available.add(9999),
            unitCost: batch.purchaseRate,
            movementType: 'SALES_INVOICE',
            referenceTable: 'integration_test',
            referenceId: 3n,
          }),
        ),
      ),
    ).rejects.toMatchObject<Partial<ApplicationException>>({
      code: ErrorCode.STOCK_INSUFFICIENT,
    });
  });
});

