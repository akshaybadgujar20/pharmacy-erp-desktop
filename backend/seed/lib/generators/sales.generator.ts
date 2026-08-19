import type { PrismaClient } from '@prisma/client';
import { faker, uuid } from '../faker';
import { decimal, docNumber } from '../id-registry';
import type { SeedContext } from '../seed-context';
import { recordMovement } from './inventory.generator';

function pickBatchFefo(ctx: SeedContext, branchId: bigint, medicineId: bigint) {
  const candidates = ctx.batchRecords
    .filter((b) => b.medicineId === medicineId && ctx.getStock(branchId, b.id) > 0)
    .sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime());
  return candidates[0];
}

export async function seedSales(prisma: PrismaClient, ctx: SeedContext): Promise<void> {
  const userId = ctx.userIds[0];
  const invoices: Array<{ id: bigint; branchId: bigint; branchCode: string; netAmount: string; uuid: string }> = [];

  for (let i = 0; i < 100; i++) {
    const branch = ctx.branchRecords[i % ctx.branchRecords.length]!;
    const customerId = faker.helpers.arrayElement(ctx.customerIds);
    const lineCount = faker.number.int({ min: 1, max: 3 });
    const seq = ctx.nextSalesSeq(branch.branchCode);
    const invoiceUuid = uuid();

    let gross = 0;
    let tax = 0;
    let discount = 0;

    const invoice = await prisma.salesInvoice.create({
      data: {
        uuid: invoiceUuid,
        invoiceNumber: docNumber('SI', branch.branchCode, seq),
        customerId,
        branchId: branch.id,
        invoiceDate: faker.date.recent({ days: 30 }),
        grossAmount: '0',
        discountAmount: '0',
        taxAmount: '0',
        netAmount: '0',
        paidAmount: '0',
        balanceAmount: '0',
        paymentMode: faker.helpers.arrayElement(['CASH', 'UPI', 'CARD']),
        paymentStatus: 'PAID',
        status: 'POSTED',
        salesType: faker.helpers.arrayElement(['RETAIL_OTC', 'PRESCRIPTION']),
        createdBy: userId,
      },
    });

    const usedBatches = new Set<string>();
    for (let line = 1; line <= lineCount; line++) {
      const medicine = faker.helpers.arrayElement(ctx.medicineRecords);
      const batch = pickBatchFefo(ctx, branch.id, medicine.id);
      if (!batch) continue;
      const batchKey = String(batch.id);
      if (usedBatches.has(batchKey)) continue;
      usedBatches.add(batchKey);

      const available = ctx.getStock(branch.id, batch.id);
      const qty = faker.number.int({ min: 1, max: Math.min(5, available) });
      if (qty <= 0) continue;

      const pricing = ctx.priceListItems.get(String(medicine.id));
      const unitPrice = pricing?.sellingPrice ?? batch.mrp;
      const mrp = pricing?.mrp ?? batch.mrp;
      const lineGross = Number(unitPrice) * qty;
      const lineTax = lineGross * 0.12;
      const lineDiscount = lineGross * 0.02;
      gross += lineGross;
      tax += lineTax;
      discount += lineDiscount;

      await prisma.salesInvoiceItem.create({
        data: {
          uuid: uuid(),
          salesInvoiceId: invoice.id,
          medicineId: medicine.id,
          batchId: batch.id,
          unitId: medicine.unitId,
          lineNumber: line,
          soldQuantity: decimal(qty),
          mrp,
          unitPrice,
          purchaseRate: batch.purchaseRate,
          discountAmount: decimal(lineDiscount),
          taxPercent: decimal(12),
          taxAmount: decimal(lineTax),
          lineAmount: decimal(lineGross - lineDiscount + lineTax),
          taxId: pricing?.taxId,
        },
      });

      await recordMovement(prisma, ctx, {
        branchId: branch.id,
        branchCode: branch.branchCode,
        medicineId: medicine.id,
        batchId: batch.id,
        movementType: 'SALES_INVOICE',
        direction: 'OUT',
        quantity: qty,
        unitCost: batch.purchaseRate,
        referenceTable: 'sales_invoices',
        referenceId: invoice.id,
        createdBy: userId,
      });
    }

    const net = gross - discount + tax;
    await prisma.salesInvoice.update({
      where: { id: invoice.id },
      data: {
        grossAmount: decimal(gross),
        discountAmount: decimal(discount),
        taxAmount: decimal(tax),
        netAmount: decimal(net),
        paidAmount: decimal(net),
        balanceAmount: decimal(0),
      },
    });

    invoices.push({
      id: invoice.id,
      branchId: branch.id,
      branchCode: branch.branchCode,
      netAmount: decimal(net),
      uuid: invoiceUuid,
    });
    ctx.entityUuidsForOutbox.push(invoiceUuid);
  }

  for (let i = 0; i < 80; i++) {
    const invoice = faker.helpers.arrayElement(invoices);
    await prisma.salesPayment.create({
      data: {
        uuid: uuid(),
        paymentNumber: docNumber('SP', invoice.branchCode, i + 1),
        salesInvoiceId: invoice.id,
        branchId: invoice.branchId,
        paymentDate: faker.date.recent({ days: 25 }),
        paymentMethod: faker.helpers.arrayElement(['CASH', 'UPI', 'CREDIT_CARD', 'DEBIT_CARD']),
        paymentAmount: invoice.netAmount,
        status: 'COMPLETED',
        createdBy: userId,
      },
    });
  }

  for (let i = 0; i < 15; i++) {
    const invoice = faker.helpers.arrayElement(invoices);
    const items = await prisma.salesInvoiceItem.findMany({ where: { salesInvoiceId: invoice.id }, take: 1 });
    const item = items[0];
    if (!item) continue;

    const qty = faker.number.int({ min: 1, max: Math.min(2, Number(item.soldQuantity)) });
    const amount = Number(item.unitPrice) * qty;
    const ret = await prisma.salesReturn.create({
      data: {
        uuid: uuid(),
        salesReturnNumber: docNumber('SR', invoice.branchCode, i + 1),
        salesInvoiceId: invoice.id,
        customerId: faker.helpers.arrayElement(ctx.customerIds),
        branchId: invoice.branchId,
        returnDate: faker.date.recent({ days: 10 }),
        returnReason: 'OTHER',
        grossAmount: decimal(amount),
        taxAmount: decimal(amount * 0.12),
        netAmount: decimal(amount * 1.12),
        refundAmount: decimal(amount * 1.12),
        refundMode: 'CASH',
        status: 'COMPLETED',
        approvedByEmployeeId: ctx.employeeIds[0],
        approvedAt: new Date(),
      },
    });

    await prisma.salesReturnItem.create({
      data: {
        uuid: uuid(),
        salesReturnId: ret.id,
        salesInvoiceItemId: item.id,
        medicineId: item.medicineId,
        batchId: item.batchId,
        unitId: item.unitId,
        lineNumber: 1,
        returnQuantity: decimal(qty),
        unitPrice: item.unitPrice,
        lineAmount: decimal(amount),
        returnReason: 'OTHER',
      },
    });
  }
}
