import type { PrismaClient } from '@prisma/client';
import { faker, uuid } from '../faker';
import { decimal, docNumber } from '../id-registry';
import type { SeedContext } from '../seed-context';
import { recordMovement } from './inventory.generator';

export async function seedPurchase(prisma: PrismaClient, ctx: SeedContext): Promise<void> {
  const employeeId = ctx.employeeIds[0]!;
  const userId = ctx.userIds[0];
  const poRecords: Array<{ id: bigint; branchId: bigint; branchCode: string; supplierId: bigint }> = [];

  for (let i = 0; i < 30; i++) {
    const branch = faker.helpers.arrayElement(ctx.branchRecords);
    const supplierId = faker.helpers.arrayElement(ctx.supplierIds);
    const seq = ctx.nextPoSeq(branch.branchCode);
    const medicines = faker.helpers.arrayElements(ctx.medicineRecords, faker.number.int({ min: 1, max: 3 }));

    let gross = 0;
    let tax = 0;
    const poUuid = uuid();
    const po = await prisma.purchaseOrder.create({
      data: {
        uuid: poUuid,
        purchaseOrderNumber: docNumber('PO', branch.branchCode, seq),
        supplierId,
        branchId: branch.id,
        orderDate: faker.date.recent({ days: 60 }),
        expectedDeliveryDate: faker.date.soon({ days: 14 }),
        grossAmount: '0',
        taxAmount: '0',
        netAmount: '0',
        status: i < 25 ? 'COMPLETED' : 'APPROVED',
        approvedByEmployeeId: employeeId,
        approvedAt: new Date(),
      },
    });
    poRecords.push({ id: po.id, branchId: branch.id, branchCode: branch.branchCode, supplierId });

    let line = 1;
    for (const medicine of medicines) {
      const qty = faker.number.int({ min: 10, max: 100 });
      const unitPrice = faker.number.int({ min: 8, max: 120 });
      const lineAmount = qty * unitPrice;
      const lineTax = lineAmount * 0.12;
      gross += lineAmount;
      tax += lineTax;

      await prisma.purchaseOrderItem.create({
        data: {
          uuid: uuid(),
          purchaseOrderId: po.id,
          medicineId: medicine.id,
          unitId: medicine.unitId,
          lineNumber: line++,
          orderedQuantity: decimal(qty),
          receivedQuantity: decimal(qty),
          unitPrice: decimal(unitPrice),
          taxPercent: decimal(12),
          taxAmount: decimal(lineTax),
          lineAmount: decimal(lineAmount + lineTax),
          isClosed: true,
        },
      });
    }

    await prisma.purchaseOrder.update({
      where: { id: po.id },
      data: {
        grossAmount: decimal(gross),
        taxAmount: decimal(tax),
        netAmount: decimal(gross + tax),
      },
    });
  }

  let grnCount = 0;
  for (const po of poRecords.slice(0, 25)) {
    grnCount++;
    const seq = ctx.nextGrnSeq(po.branchCode);
    const items = await prisma.purchaseOrderItem.findMany({ where: { purchaseOrderId: po.id } });

    const grnUuid = uuid();
    const grn = await prisma.goodsReceipt.create({
      data: {
        uuid: grnUuid,
        goodsReceiptNumber: docNumber('GRN', po.branchCode, seq),
        purchaseOrderId: po.id,
        supplierId: po.supplierId,
        branchId: po.branchId,
        receiptDate: faker.date.recent({ days: 45 }),
        supplierChallanNo: `CH-${faker.string.numeric(6)}`,
        supplierInvoiceNo: `SUP-INV-${faker.string.numeric(6)}`,
        status: 'ACCEPTED',
        isBilled: true,
        receivedByEmployeeId: employeeId,
        inspectedByEmployeeId: employeeId,
        inspectedAt: new Date(),
      },
    });

    let invoiceGross = 0;
    let invoiceTax = 0;

    for (const item of items) {
      const medicineBatches = ctx.batchRecords.filter((b) => b.medicineId === item.medicineId);
      const chosenBatch = medicineBatches.length
        ? faker.helpers.arrayElement(medicineBatches)
        : faker.helpers.arrayElement(ctx.batchRecords);
      const qty = Number(item.orderedQuantity);
      const purchaseRate = Number(chosenBatch.purchaseRate);
      const mrp = Number(chosenBatch.mrp);
      const saleRate = mrp * 0.92;
      const lineAmount = qty * purchaseRate;
      const lineTax = lineAmount * 0.12;
      invoiceGross += lineAmount;
      invoiceTax += lineTax;

      await prisma.goodsReceiptItem.create({
        data: {
          uuid: uuid(),
          goodsReceiptId: grn.id,
          purchaseOrderItemId: item.id,
          medicineId: item.medicineId,
          batchId: chosenBatch.id,
          unitId: item.unitId,
          lineNumber: item.lineNumber,
          batchNumber: chosenBatch.batchNumber,
          expiryDate: chosenBatch.expiryDate,
          receivedQuantity: item.orderedQuantity,
          acceptedQuantity: item.orderedQuantity,
          purchaseRate: chosenBatch.purchaseRate,
          mrp: chosenBatch.mrp,
          saleRate: decimal(saleRate),
          taxPercent: decimal(12),
          taxAmount: decimal(lineTax),
          lineAmount: decimal(lineAmount + lineTax),
        },
      });

      await recordMovement(prisma, ctx, {
        branchId: po.branchId,
        branchCode: po.branchCode,
        medicineId: item.medicineId,
        batchId: chosenBatch.id,
        movementType: 'PURCHASE_GRN',
        direction: 'IN',
        quantity: qty,
        unitCost: chosenBatch.purchaseRate,
        referenceTable: 'goods_receipts',
        referenceId: grn.id,
        createdBy: userId,
      });
    }

    const piUuid = uuid();
    const net = invoiceGross + invoiceTax;
    await prisma.purchaseInvoice.create({
      data: {
        uuid: piUuid,
        purchaseInvoiceNumber: docNumber('PI', po.branchCode, grnCount),
        supplierInvoiceNumber: `VENDOR-${grnCount}-${faker.string.numeric(5)}`,
        supplierId: po.supplierId,
        goodsReceiptId: grn.id,
        branchId: po.branchId,
        invoiceDate: faker.date.recent({ days: 40 }),
        dueDate: faker.date.soon({ days: 30 }),
        grossAmount: decimal(invoiceGross),
        taxAmount: decimal(invoiceTax),
        netAmount: decimal(net),
        paidAmount: decimal(net),
        balanceAmount: decimal(0),
        status: 'POSTED',
        paymentStatus: 'PAID',
      },
    });
  }

  for (let i = 0; i < 10; i++) {
    const branch = faker.helpers.arrayElement(ctx.branchRecords);
    const supplierId = faker.helpers.arrayElement(ctx.supplierIds);
    const medicine = faker.helpers.arrayElement(ctx.medicineRecords);
    const medicineBatches = ctx.batchRecords.filter((b) => b.medicineId === medicine.id);
    const batch = medicineBatches.length
      ? faker.helpers.arrayElement(medicineBatches)
      : faker.helpers.arrayElement(ctx.batchRecords);

    const qty = faker.number.int({ min: 1, max: 5 });
    const amount = qty * Number(batch.purchaseRate);
    const ret = await prisma.purchaseReturn.create({
      data: {
        uuid: uuid(),
        purchaseReturnNumber: docNumber('PR', branch.branchCode, i + 1),
        supplierId,
        branchId: branch.id,
        returnDate: faker.date.recent({ days: 20 }),
        returnType: 'NEAR_EXPIRY',
        grossAmount: decimal(amount),
        taxAmount: decimal(amount * 0.12),
        netAmount: decimal(amount * 1.12),
        status: 'ACCEPTED',
        approvedByEmployeeId: employeeId,
        approvedAt: new Date(),
      },
    });

    await prisma.purchaseReturnItem.create({
      data: {
        uuid: uuid(),
        purchaseReturnId: ret.id,
        medicineId: medicine.id,
        batchId: batch.id,
        unitId: medicine.unitId,
        lineNumber: 1,
        returnQuantity: decimal(qty),
        unitPrice: batch.purchaseRate,
        lineAmount: decimal(amount),
      },
    });
  }
}
