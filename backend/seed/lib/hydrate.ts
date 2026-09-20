import type { PrismaClient } from '@prisma/client';
import { bootstrapIdSequence } from '../../src/persistence/prisma/id-sequence.service';
import { decimal, register } from './id-registry';
import type { SeedContext } from './seed-context';

function maxSeqFromNumbers(
  numbers: string[],
  prefix: string,
  branchCode: string,
): number {
  const expectedPrefix = `${prefix}-${branchCode}-`;
  let max = 0;
  for (const docNumber of numbers) {
    if (!docNumber.startsWith(expectedPrefix)) continue;
    const seq = parseInt(docNumber.slice(expectedPrefix.length), 10);
    if (!Number.isNaN(seq) && seq > max) max = seq;
  }
  return max;
}

function setSeqIfHigher(
  map: Map<string, number>,
  branchCode: string,
  seq: number,
): void {
  if (seq > (map.get(branchCode) ?? 0)) {
    map.set(branchCode, seq);
  }
}

async function hydrateRegistryModel(
  prisma: PrismaClient,
  model: keyof PrismaClient,
  registryName: string,
): Promise<void> {
  const delegate = prisma[model] as {
    findMany?: (args: {
      select: { id: true; uuid: true };
    }) => Promise<Array<{ id: bigint; uuid: string }>>;
  };
  if (!delegate?.findMany) return;
  const rows = await delegate.findMany({ select: { id: true, uuid: true } });
  for (const row of rows) {
    register(registryName, row.uuid, row.id);
  }
}

export async function hydrateRegistry(prisma: PrismaClient): Promise<void> {
  const models: Array<[keyof PrismaClient, string]> = [
    ['country', 'Country'],
    ['state', 'State'],
    ['city', 'City'],
    ['area', 'Area'],
    ['unitOfMeasure', 'UnitOfMeasure'],
    ['medicineCategory', 'MedicineCategory'],
    ['medicineSchedule', 'MedicineSchedule'],
    ['medicineGeneric', 'MedicineGeneric'],
    ['saltComposition', 'SaltComposition'],
    ['permission', 'Permission'],
    ['role', 'Role'],
    ['rolePermission', 'RolePermission'],
    ['tax', 'Tax'],
    ['company', 'Company'],
    ['branch', 'Branch'],
    ['financialYear', 'FinancialYear'],
    ['sequenceGenerator', 'SequenceGenerator'],
    ['appSetting', 'AppSetting'],
    ['barcodeConfiguration', 'BarcodeConfiguration'],
    ['printerConfiguration', 'PrinterConfiguration'],
    ['priceList', 'PriceList'],
  ];
  for (const [model, name] of models) {
    await hydrateRegistryModel(prisma, model, name);
  }
}

async function hydrateDocumentSequences(
  prisma: PrismaClient,
  ctx: SeedContext,
): Promise<void> {
  for (const branch of ctx.branchRecords) {
    const [
      movements,
      salesInvoices,
      purchaseOrders,
      goodsReceipts,
      purchaseReturns,
      salesReturns,
      salesPayments,
      purchaseInvoices,
      adjustments,
      transfers,
      stockTakes,
      expenses,
      prescriptions,
    ] = await Promise.all([
      prisma.stockMovement.findMany({
        where: { branchId: branch.id },
        select: { movementNumber: true },
      }),
      prisma.salesInvoice.findMany({
        where: { branchId: branch.id },
        select: { invoiceNumber: true },
      }),
      prisma.purchaseOrder.findMany({
        where: { branchId: branch.id },
        select: { purchaseOrderNumber: true },
      }),
      prisma.goodsReceipt.findMany({
        where: { branchId: branch.id },
        select: { goodsReceiptNumber: true },
      }),
      prisma.purchaseReturn.findMany({
        where: { branchId: branch.id },
        select: { purchaseReturnNumber: true },
      }),
      prisma.salesReturn.findMany({
        where: { branchId: branch.id },
        select: { salesReturnNumber: true },
      }),
      prisma.salesPayment.findMany({
        where: { branchId: branch.id },
        select: { paymentNumber: true },
      }),
      prisma.purchaseInvoice.findMany({
        where: { branchId: branch.id },
        select: { purchaseInvoiceNumber: true },
      }),
      prisma.stockAdjustment.findMany({
        where: { branchId: branch.id },
        select: { adjustmentNumber: true },
      }),
      prisma.stockTransfer.findMany({
        where: { sourceBranchId: branch.id },
        select: { transferNumber: true },
      }),
      prisma.stockTake.findMany({
        where: { branchId: branch.id },
        select: { stockTakeNumber: true },
      }),
      prisma.expense.findMany({
        where: { branchId: branch.id },
        select: { expenseNumber: true },
      }),
      prisma.prescription.findMany({
        where: { branchId: branch.id },
        select: { prescriptionNumber: true },
      }),
    ]);

    setSeqIfHigher(
      ctx.movementSeqByBranch,
      branch.branchCode,
      maxSeqFromNumbers(
        movements.map((r) => r.movementNumber),
        'SM',
        branch.branchCode,
      ),
    );
    setSeqIfHigher(
      ctx.salesSeqByBranch,
      branch.branchCode,
      maxSeqFromNumbers(
        salesInvoices.map((r) => r.invoiceNumber),
        'SI',
        branch.branchCode,
      ),
    );
    setSeqIfHigher(
      ctx.poSeqByBranch,
      branch.branchCode,
      maxSeqFromNumbers(
        purchaseOrders.map((r) => r.purchaseOrderNumber),
        'PO',
        branch.branchCode,
      ),
    );
    setSeqIfHigher(
      ctx.grnSeqByBranch,
      branch.branchCode,
      maxSeqFromNumbers(
        goodsReceipts.map((r) => r.goodsReceiptNumber),
        'GRN',
        branch.branchCode,
      ),
    );
    setSeqIfHigher(
      ctx.purchaseReturnSeqByBranch,
      branch.branchCode,
      maxSeqFromNumbers(
        purchaseReturns.map((r) => r.purchaseReturnNumber),
        'PR',
        branch.branchCode,
      ),
    );
    setSeqIfHigher(
      ctx.salesReturnSeqByBranch,
      branch.branchCode,
      maxSeqFromNumbers(
        salesReturns.map((r) => r.salesReturnNumber),
        'SR',
        branch.branchCode,
      ),
    );
    setSeqIfHigher(
      ctx.paymentSeqByBranch,
      branch.branchCode,
      maxSeqFromNumbers(
        salesPayments.map((r) => r.paymentNumber),
        'SP',
        branch.branchCode,
      ),
    );
    setSeqIfHigher(
      ctx.purchaseInvoiceSeqByBranch,
      branch.branchCode,
      maxSeqFromNumbers(
        purchaseInvoices.map((r) => r.purchaseInvoiceNumber),
        'PI',
        branch.branchCode,
      ),
    );
    setSeqIfHigher(
      ctx.adjustmentSeqByBranch,
      branch.branchCode,
      maxSeqFromNumbers(
        adjustments.map((r) => r.adjustmentNumber),
        'ADJ',
        branch.branchCode,
      ),
    );
    setSeqIfHigher(
      ctx.transferSeqByBranch,
      branch.branchCode,
      maxSeqFromNumbers(
        transfers.map((r) => r.transferNumber),
        'ST',
        branch.branchCode,
      ),
    );
    setSeqIfHigher(
      ctx.takeSeqByBranch,
      branch.branchCode,
      maxSeqFromNumbers(
        stockTakes.map((r) => r.stockTakeNumber),
        'TK',
        branch.branchCode,
      ),
    );
    setSeqIfHigher(
      ctx.expenseSeqByBranch,
      branch.branchCode,
      maxSeqFromNumbers(
        expenses.map((r) => r.expenseNumber),
        'EXP',
        branch.branchCode,
      ),
    );
    setSeqIfHigher(
      ctx.prescriptionSeqByBranch,
      branch.branchCode,
      maxSeqFromNumbers(
        prescriptions.map((r) => r.prescriptionNumber),
        'RX',
        branch.branchCode,
      ),
    );
  }
}

export async function hydrateContext(
  prisma: PrismaClient,
  ctx: SeedContext,
): Promise<void> {
  const branches = await prisma.branch.findMany({
    select: { id: true, uuid: true, branchCode: true },
  });
  ctx.branchRecords = branches.map((b) => ({
    id: b.id,
    uuid: b.uuid,
    branchCode: b.branchCode,
  }));

  ctx.customerIds = (
    await prisma.customer.findMany({ select: { id: true } })
  ).map((r) => r.id);
  ctx.supplierIds = (
    await prisma.supplier.findMany({ select: { id: true } })
  ).map((r) => r.id);
  ctx.doctorIds = (await prisma.doctor.findMany({ select: { id: true } })).map(
    (r) => r.id,
  );
  ctx.employeeIds = (
    await prisma.employee.findMany({ select: { id: true } })
  ).map((r) => r.id);
  ctx.employeeUuids = (
    await prisma.employee.findMany({ select: { uuid: true } })
  ).map((r) => r.uuid);
  ctx.userIds = (await prisma.user.findMany({ select: { id: true } })).map(
    (r) => r.id,
  );
  ctx.taxIds = (await prisma.tax.findMany({ select: { id: true } })).map(
    (r) => r.id,
  );

  const defaultPriceList = await prisma.priceList.findFirst({
    where: { isDefault: true },
    select: { id: true },
  });
  ctx.defaultPriceListId = defaultPriceList?.id;

  ctx.priceListItems.clear();
  if (defaultPriceList) {
    const items = await prisma.priceListItem.findMany({
      where: { priceListId: defaultPriceList.id },
      select: { medicineId: true, sellingPrice: true, mrp: true, taxId: true },
    });
    for (const item of items) {
      ctx.priceListItems.set(String(item.medicineId), {
        medicineId: item.medicineId,
        sellingPrice: item.sellingPrice.toString(),
        mrp: item.mrp.toString(),
        taxId: item.taxId ?? undefined,
      });
    }
  }

  const medicines = await prisma.medicine.findMany({
    select: { id: true, uuid: true, unitId: true },
  });
  ctx.medicineRecords = [];
  for (const med of medicines) {
    const pricing = ctx.priceListItems.get(String(med.id));
    let mrp = pricing?.mrp ?? '0.00';
    if (mrp === '0.00') {
      const batch = await prisma.batch.findFirst({
        where: { medicineId: med.id },
        orderBy: { id: 'asc' },
        select: { mrp: true },
      });
      if (batch) mrp = batch.mrp.toString();
    }
    ctx.medicineRecords.push({
      id: med.id,
      uuid: med.uuid,
      unitId: med.unitId,
      mrp: decimal(mrp),
    });
  }

  const batches = await prisma.batch.findMany({
    select: {
      id: true,
      uuid: true,
      medicineId: true,
      batchNumber: true,
      expiryDate: true,
      purchaseRate: true,
      mrp: true,
    },
  });
  ctx.batchRecords = batches.map((b) => ({
    id: b.id,
    uuid: b.uuid,
    medicineId: b.medicineId,
    batchNumber: b.batchNumber,
    expiryDate: b.expiryDate,
    purchaseRate: b.purchaseRate.toString(),
    mrp: b.mrp.toString(),
  }));

  ctx.stockBalances.clear();
  const stocks = await prisma.stock.findMany({
    select: { branchId: true, batchId: true, availableQuantity: true },
  });
  for (const stock of stocks) {
    ctx.setStock(
      stock.branchId,
      stock.batchId,
      Number(stock.availableQuantity),
    );
  }

  ctx.entityUuidsForOutbox = (
    await prisma.salesInvoice.findMany({ select: { uuid: true } })
  ).map((r) => r.uuid);

  await hydrateDocumentSequences(prisma, ctx);
}

export async function hydrateFromDb(
  prisma: PrismaClient,
  ctx: SeedContext,
): Promise<void> {
  await bootstrapIdSequence(prisma);
  await hydrateRegistry(prisma);
  await hydrateContext(prisma, ctx);
}
