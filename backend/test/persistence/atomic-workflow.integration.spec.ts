import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { OutboxOperation } from '../../src/persistence/outbox/outbox-operation.constants';
import { OutboxService } from '../../src/persistence/outbox/outbox.service';
import { DocumentType } from '../../src/persistence/sequence/document-type.constants';
import { SequenceGeneratorService } from '../../src/persistence/sequence/sequence-generator.service';
import { InventoryLedgerService } from '../../src/persistence/inventory/inventory-ledger.service';
import {
  createPersistenceTestContext,
  ensureSalesInvoiceSequence,
  ensureStockMovementSequence,
  loadSeededBatchWithStock,
  loadSeededBranch,
  runWithTestContext,
} from './persistence-test.helpers';

describe('Atomic workflow (integration)', () => {
  let sequences: SequenceGeneratorService;
  let inventoryLedger: InventoryLedgerService;
  let outbox: OutboxService;
  let services: Awaited<ReturnType<typeof createPersistenceTestContext>>['services'];
  let seed: Awaited<ReturnType<typeof loadSeededBranch>>;
  let moduleRef: Awaited<ReturnType<typeof createPersistenceTestContext>>['moduleRef'];

  beforeAll(async () => {
    const ctx = await createPersistenceTestContext();
    moduleRef = ctx.moduleRef;
    services = ctx.services;
    sequences = moduleRef.get(SequenceGeneratorService);
    inventoryLedger = moduleRef.get(InventoryLedgerService);
    outbox = moduleRef.get(OutboxService);
    seed = await loadSeededBranch(services.prisma);
    await ensureStockMovementSequence(services.prisma, seed.company.id, seed.branch.id);
    await ensureSalesInvoiceSequence(services.prisma, seed.company.id, seed.branch.id);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('creates invoice, stock movement, and outbox rows in one transaction', async () => {
    const { stock, batch } = await loadSeededBatchWithStock(services.prisma, seed.branch.id);
    const invoiceUuid = randomUUID();
    const qty = new Prisma.Decimal(1);

    const result = await runWithTestContext(services, seed, () =>
      services.unitOfWork.run(async (tx) => {
        const { documentNumber } = await sequences.next(tx, {
          companyId: seed.company.id,
          branchId: seed.branch.id,
          documentType: DocumentType.SALES_INVOICE,
          branchCode: seed.branch.branchCode,
        });

        const invoice = await tx.salesInvoice.create({
          data: {
            uuid: invoiceUuid,
            invoiceNumber: documentNumber,
            branchId: seed.branch.id,
            grossAmount: batch.mrp,
            netAmount: batch.mrp,
            balanceAmount: new Prisma.Decimal(0),
          },
        });

        const movement = await inventoryLedger.applyMovement(tx, {
          branchId: seed.branch.id,
          branchCode: seed.branch.branchCode,
          companyId: seed.company.id,
          medicineId: batch.medicineId,
          batchId: batch.id,
          direction: 'OUT',
          quantity: qty,
          unitCost: batch.purchaseRate,
          movementType: 'SALES_INVOICE',
          referenceTable: 'sales_invoices',
          referenceId: invoice.id,
        });

        await outbox.enqueue(tx, {
          entityType: 'SalesInvoice',
          entityUuid: invoice.uuid,
          operation: OutboxOperation.CREATE,
          payload: { invoiceNumber: invoice.invoiceNumber, netAmount: invoice.netAmount.toString() },
          branchId: seed.branch.id,
        });

        await outbox.enqueue(tx, {
          entityType: 'StockMovement',
          entityUuid: movement.uuid,
          operation: OutboxOperation.CREATE,
          payload: { movementNumber: movement.movementNumber, quantity: movement.quantity.toString() },
          branchId: seed.branch.id,
        });

        return { invoice, movement };
      }),
    );

    const persistedInvoice = await services.prisma.client.salesInvoice.findUnique({
      where: { uuid: invoiceUuid },
    });
    expect(persistedInvoice).not.toBeNull();

    const outboxRows = await services.prisma.client.outbox.findMany({
      where: {
        entityUuid: { in: [result.invoice.uuid, result.movement.uuid] },
      },
    });
    expect(outboxRows).toHaveLength(2);

    const updatedStock = await services.prisma.client.stock.findFirstOrThrow({ where: { id: stock.id } });
    expect(new Prisma.Decimal(updatedStock.availableQuantity).lt(stock.availableQuantity)).toBe(true);
  });
});

