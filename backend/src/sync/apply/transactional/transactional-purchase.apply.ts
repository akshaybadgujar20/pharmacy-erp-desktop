import { OutboxEntityType } from '../../../persistence/outbox/entity-type.constants';
import type { TxClient } from '../../../persistence/prisma/prisma-tx.type';
import type { SyncCloudPullRecord } from '../../cloud/sync-cloud.contract';
import {
  asBigInt,
  asBool,
  asOptionalString,
  asString,
  extractApplyData,
  recordEntityUuid,
  serverVersionFromRecord,
  SyncApplyError,
} from '../sync-apply.util';
import {
  resolveIdField,
  resolveOptionalIdField,
  stripIncomingSyncData,
  txBatchLookup,
  txBranchLookup,
  txEmployeeLookup,
  txGoodsReceiptLookup,
  txMedicineLookup,
  txPurchaseInvoiceLookup,
  txPurchaseOrderLookup,
  txPurchaseReturnLookup,
  txSupplierLookup,
  txUnitLookup,
} from '../sync-fk-resolve.util';
import {
  applyEmbeddedLines,
  applyServerWin,
  asDecimal,
  asInt,
  asOptionalDecimal,
} from './transactional-apply-shared';

export async function applyPurchaseTransactional(
  tx: TxClient,
  record: SyncCloudPullRecord,
): Promise<void> {
  switch (record.entityType) {
    case OutboxEntityType.PURCHASE_ORDER:
      await applyPurchaseOrder(tx, record);
      return;
    case 'PurchaseOrderItem':
      await applyPurchaseOrderItemRecord(tx, record);
      return;
    case OutboxEntityType.GOODS_RECEIPT:
      await applyGoodsReceipt(tx, record);
      return;
    case 'GoodsReceiptItem':
      await applyGoodsReceiptItemRecord(tx, record);
      return;
    case OutboxEntityType.PURCHASE_INVOICE:
      await applyPurchaseInvoice(tx, record);
      return;
    case 'PurchaseInvoiceItem':
      await applyPurchaseInvoiceItemRecord(tx, record);
      return;
    case OutboxEntityType.PURCHASE_RETURN:
      await applyPurchaseReturn(tx, record);
      return;
    case 'PurchaseReturnItem':
      await applyPurchaseReturnItemRecord(tx, record);
      return;
    default:
      throw new SyncApplyError(
        `Purchase apply does not handle ${record.entityType}`,
      );
  }
}

async function upsertPurchaseOrderItem(
  tx: TxClient,
  line: Record<string, unknown>,
): Promise<void> {
  const uuid = asString(line.uuid ?? line.entityUuid, 'uuid');
  const purchaseOrderId = await resolveIdField(
    txPurchaseOrderLookup(tx),
    line,
    'purchaseOrderId',
    'purchaseOrderUuid',
    'purchaseOrder',
    true,
  );
  const medicineId = await resolveIdField(
    txMedicineLookup(tx),
    line,
    'medicineId',
    'medicineUuid',
    'medicine',
    true,
  );
  const unitId = await resolveIdField(
    txUnitLookup(tx),
    line,
    'unitId',
    'unitUuid',
    'unit',
    true,
  );
  const serverVersion = line.version ? asBigInt(line.version, 'version') : 1n;
  const existing = await tx.purchaseOrderItem.findFirst({ where: { uuid } });
  const payload = {
    purchaseOrderId: purchaseOrderId!,
    medicineId: medicineId!,
    unitId: unitId!,
    lineNumber: asInt(line.lineNumber, 'lineNumber'),
    orderedQuantity: asDecimal(line.orderedQuantity),
    receivedQuantity: asDecimal(line.receivedQuantity ?? '0'),
    cancelledQuantity: asDecimal(line.cancelledQuantity ?? '0'),
    conversionFactor: asDecimal(line.conversionFactor ?? '1'),
    unitPrice: asDecimal(line.unitPrice),
    discountPercent: asOptionalDecimal(line.discountPercent),
    discountAmount: asDecimal(line.discountAmount ?? '0'),
    taxPercent: asOptionalDecimal(line.taxPercent),
    taxAmount: asDecimal(line.taxAmount ?? '0'),
    lineAmount: asDecimal(line.lineAmount),
    isClosed: asBool(line.isClosed, false),
    version: serverVersion,
    updatedAt: BigInt(Date.now()),
  };
  if (existing) {
    await tx.purchaseOrderItem.update({
      where: { id: existing.id },
      data: payload as never,
    });
    return;
  }
  await tx.purchaseOrderItem.create({
    data: { uuid, ...payload, createdAt: BigInt(Date.now()) } as never,
  });
}

async function applyPurchaseOrder(
  tx: TxClient,
  record: SyncCloudPullRecord,
): Promise<void> {
  await applyServerWin(
    tx,
    record,
    async (uuid) => {
      const row = await tx.purchaseOrder.findFirst({ where: { uuid } });
      return row ? { id: row.id, version: row.version } : null;
    },
    async (data, uuid, serverVersion) => {
      const base = stripIncomingSyncData(data);
      const supplierId = await resolveIdField(
        txSupplierLookup(tx),
        base,
        'supplierId',
        'supplierUuid',
        'supplier',
        true,
      );
      const branchId = await resolveIdField(
        txBranchLookup(tx),
        base,
        'branchId',
        'branchUuid',
        'branch',
        true,
      );
      const approvedByEmployeeId = await resolveOptionalIdField(
        txEmployeeLookup(tx),
        base,
        'approvedByEmployeeId',
        'approvedByEmployeeUuid',
        'employee',
      );
      return {
        uuid,
        purchaseOrderNumber: asString(
          base.purchaseOrderNumber,
          'purchaseOrderNumber',
        ),
        supplierId: supplierId!,
        branchId: branchId!,
        orderDate: asBigInt(base.orderDate, 'orderDate'),
        expectedDeliveryDate: base.expectedDeliveryDate
          ? asBigInt(base.expectedDeliveryDate, 'expectedDeliveryDate')
          : null,
        grossAmount: asDecimal(base.grossAmount),
        discountAmount: asDecimal(base.discountAmount ?? '0'),
        taxAmount: asDecimal(base.taxAmount ?? '0'),
        netAmount: asDecimal(base.netAmount),
        status: asString(base.status, 'status'),
        remarks: asOptionalString(base.remarks),
        approvedByEmployeeId,
        approvedAt: base.approvedAt
          ? asBigInt(base.approvedAt, 'approvedAt')
          : null,
        version: serverVersion,
        createdAt: BigInt(Date.now()),
        updatedAt: BigInt(Date.now()),
      };
    },
    (data, serverVersion) => {
      const base = stripIncomingSyncData(data);
      return {
        grossAmount: asDecimal(base.grossAmount),
        discountAmount: asDecimal(base.discountAmount ?? '0'),
        taxAmount: asDecimal(base.taxAmount ?? '0'),
        netAmount: asDecimal(base.netAmount),
        status: asString(base.status, 'status'),
        remarks: asOptionalString(base.remarks),
        version: serverVersion,
        updatedAt: BigInt(Date.now()),
      };
    },
    (row) => tx.purchaseOrder.create({ data: row as never }),
    (id, row) => tx.purchaseOrder.update({ where: { id }, data: row as never }),
    async (data) => {
      await applyEmbeddedLines(tx, data, '', async (ltx, line) => {
        await upsertPurchaseOrderItem(ltx, line);
      });
    },
  );
}

async function applyPurchaseOrderItemRecord(
  tx: TxClient,
  record: SyncCloudPullRecord,
): Promise<void> {
  const data = extractApplyData(record.payload);
  const uuid = recordEntityUuid(record, data);
  const serverVersion = serverVersionFromRecord(record);
  await upsertPurchaseOrderItem(tx, { ...data, uuid, version: serverVersion });
}

async function applyGoodsReceipt(
  tx: TxClient,
  record: SyncCloudPullRecord,
): Promise<void> {
  await applyServerWin(
    tx,
    record,
    async (uuid) => {
      const row = await tx.goodsReceipt.findFirst({ where: { uuid } });
      return row ? { id: row.id, version: row.version } : null;
    },
    async (data, uuid, serverVersion) => {
      const base = stripIncomingSyncData(data);
      const supplierId = await resolveIdField(
        txSupplierLookup(tx),
        base,
        'supplierId',
        'supplierUuid',
        'supplier',
        true,
      );
      const branchId = await resolveIdField(
        txBranchLookup(tx),
        base,
        'branchId',
        'branchUuid',
        'branch',
        true,
      );
      const purchaseOrderId = await resolveOptionalIdField(
        txPurchaseOrderLookup(tx),
        base,
        'purchaseOrderId',
        'purchaseOrderUuid',
        'purchaseOrder',
      );
      const receivedByEmployeeId = await resolveIdField(
        txEmployeeLookup(tx),
        base,
        'receivedByEmployeeId',
        'receivedByEmployeeUuid',
        'employee',
        true,
      );
      const inspectedByEmployeeId = await resolveOptionalIdField(
        txEmployeeLookup(tx),
        base,
        'inspectedByEmployeeId',
        'inspectedByEmployeeUuid',
        'employee',
      );
      return {
        uuid,
        goodsReceiptNumber: asString(
          base.goodsReceiptNumber,
          'goodsReceiptNumber',
        ),
        purchaseOrderId,
        supplierId: supplierId!,
        branchId: branchId!,
        receiptDate: asBigInt(base.receiptDate, 'receiptDate'),
        supplierChallanNo: asOptionalString(base.supplierChallanNo),
        supplierChallanDate: base.supplierChallanDate
          ? asBigInt(base.supplierChallanDate, 'supplierChallanDate')
          : null,
        supplierInvoiceNo: asOptionalString(base.supplierInvoiceNo),
        supplierInvoiceDate: base.supplierInvoiceDate
          ? asBigInt(base.supplierInvoiceDate, 'supplierInvoiceDate')
          : null,
        vehicleNumber: asOptionalString(base.vehicleNumber),
        temperatureRecorded: asOptionalDecimal(base.temperatureRecorded),
        isColdChainMaintained: asBool(base.isColdChainMaintained, true),
        status: asString(base.status, 'status'),
        isBilled: asBool(base.isBilled, false),
        remarks: asOptionalString(base.remarks),
        receivedByEmployeeId: receivedByEmployeeId!,
        inspectedByEmployeeId,
        inspectedAt: base.inspectedAt
          ? asBigInt(base.inspectedAt, 'inspectedAt')
          : null,
        version: serverVersion,
        createdAt: BigInt(Date.now()),
        updatedAt: BigInt(Date.now()),
      };
    },
    (data, serverVersion) => {
      const base = stripIncomingSyncData(data);
      return {
        status: asString(base.status, 'status'),
        isBilled: asBool(base.isBilled, false),
        remarks: asOptionalString(base.remarks),
        version: serverVersion,
        updatedAt: BigInt(Date.now()),
      };
    },
    (row) => tx.goodsReceipt.create({ data: row as never }),
    (id, row) => tx.goodsReceipt.update({ where: { id }, data: row as never }),
    async (data) => {
      await applyEmbeddedLines(tx, data, '', async (ltx, line) => {
        await upsertGoodsReceiptItem(ltx, line);
      });
    },
  );
}

async function upsertGoodsReceiptItem(
  tx: TxClient,
  line: Record<string, unknown>,
): Promise<void> {
  const uuid = asString(line.uuid ?? line.entityUuid, 'uuid');
  const goodsReceiptId = await resolveIdField(
    txGoodsReceiptLookup(tx),
    line,
    'goodsReceiptId',
    'goodsReceiptUuid',
    'goodsReceipt',
    true,
  );
  const medicineId = await resolveIdField(
    txMedicineLookup(tx),
    line,
    'medicineId',
    'medicineUuid',
    'medicine',
    true,
  );
  const batchId = await resolveOptionalIdField(
    txBatchLookup(tx),
    line,
    'batchId',
    'batchUuid',
    'batch',
  );
  const unitId = await resolveIdField(
    txUnitLookup(tx),
    line,
    'unitId',
    'unitUuid',
    'unit',
    true,
  );
  const serverVersion = line.version ? asBigInt(line.version, 'version') : 1n;
  const existing = await tx.goodsReceiptItem.findFirst({ where: { uuid } });
  const payload = {
    goodsReceiptId: goodsReceiptId!,
    medicineId: medicineId!,
    batchId,
    unitId: unitId!,
    lineNumber: asInt(line.lineNumber, 'lineNumber'),
    receivedQuantity: asDecimal(line.receivedQuantity),
    batchNumber: asString(line.batchNumber, 'batchNumber'),
    manufacturingDate: line.manufacturingDate
      ? asBigInt(line.manufacturingDate, 'manufacturingDate')
      : null,
    expiryDate: asBigInt(line.expiryDate, 'expiryDate'),
    acceptedQuantity: asDecimal(line.acceptedQuantity ?? line.receivedQuantity),
    rejectedQuantity: asDecimal(line.rejectedQuantity ?? '0'),
    freeQuantity: asDecimal(line.freeQuantity ?? '0'),
    inspectionStatus: asString(
      line.inspectionStatus ?? 'PASSED',
      'inspectionStatus',
    ),
    purchaseRate: asDecimal(line.purchaseRate ?? line.unitCost),
    mrp: asDecimal(line.mrp),
    saleRate: asDecimal(line.saleRate ?? line.mrp),
    lineAmount: asDecimal(line.lineAmount),
    version: serverVersion,
    updatedAt: BigInt(Date.now()),
  };
  if (existing) {
    await tx.goodsReceiptItem.update({
      where: { id: existing.id },
      data: payload as never,
    });
    return;
  }
  await tx.goodsReceiptItem.create({
    data: { uuid, ...payload, createdAt: BigInt(Date.now()) } as never,
  });
}

async function applyGoodsReceiptItemRecord(
  tx: TxClient,
  record: SyncCloudPullRecord,
): Promise<void> {
  const data = extractApplyData(record.payload);
  const uuid = recordEntityUuid(record, data);
  const serverVersion = serverVersionFromRecord(record);
  await upsertGoodsReceiptItem(tx, { ...data, uuid, version: serverVersion });
}

async function applyPurchaseInvoice(
  tx: TxClient,
  record: SyncCloudPullRecord,
): Promise<void> {
  await applyServerWin(
    tx,
    record,
    async (uuid) => {
      const row = await tx.purchaseInvoice.findFirst({ where: { uuid } });
      return row ? { id: row.id, version: row.version } : null;
    },
    async (data, uuid, serverVersion) => {
      const base = stripIncomingSyncData(data);
      const supplierId = await resolveIdField(
        txSupplierLookup(tx),
        base,
        'supplierId',
        'supplierUuid',
        'supplier',
        true,
      );
      const branchId = await resolveIdField(
        txBranchLookup(tx),
        base,
        'branchId',
        'branchUuid',
        'branch',
        true,
      );
      const goodsReceiptId = await resolveOptionalIdField(
        txGoodsReceiptLookup(tx),
        base,
        'goodsReceiptId',
        'goodsReceiptUuid',
        'goodsReceipt',
      );
      return {
        uuid,
        purchaseInvoiceNumber: asString(
          base.purchaseInvoiceNumber,
          'purchaseInvoiceNumber',
        ),
        supplierInvoiceNumber: asString(
          base.supplierInvoiceNumber,
          'supplierInvoiceNumber',
        ),
        supplierId: supplierId!,
        goodsReceiptId,
        branchId: branchId!,
        invoiceDate: asBigInt(base.invoiceDate, 'invoiceDate'),
        dueDate: base.dueDate ? asBigInt(base.dueDate, 'dueDate') : null,
        grossAmount: asDecimal(base.grossAmount),
        discountAmount: asDecimal(base.discountAmount ?? '0'),
        taxAmount: asDecimal(base.taxAmount ?? '0'),
        roundOffAmount: asDecimal(base.roundOffAmount ?? '0'),
        netAmount: asDecimal(base.netAmount),
        paidAmount: asDecimal(base.paidAmount ?? '0'),
        balanceAmount: asDecimal(base.balanceAmount ?? '0'),
        status: asString(base.status, 'status'),
        paymentStatus: asString(base.paymentStatus, 'paymentStatus'),
        remarks: asOptionalString(base.remarks),
        version: serverVersion,
        createdAt: BigInt(Date.now()),
        updatedAt: BigInt(Date.now()),
      };
    },
    (data, serverVersion) => {
      const base = stripIncomingSyncData(data);
      return {
        paidAmount: asDecimal(base.paidAmount ?? '0'),
        balanceAmount: asDecimal(base.balanceAmount ?? '0'),
        status: asString(base.status, 'status'),
        paymentStatus: asString(base.paymentStatus, 'paymentStatus'),
        version: serverVersion,
        updatedAt: BigInt(Date.now()),
      };
    },
    (row) => tx.purchaseInvoice.create({ data: row as never }),
    (id, row) =>
      tx.purchaseInvoice.update({ where: { id }, data: row as never }),
    async (data) => {
      await applyEmbeddedLines(tx, data, '', async (ltx, line) => {
        await upsertPurchaseInvoiceItem(ltx, line);
      });
    },
  );
}

async function upsertPurchaseInvoiceItem(
  tx: TxClient,
  line: Record<string, unknown>,
): Promise<void> {
  const uuid = asString(line.uuid ?? line.entityUuid, 'uuid');
  const purchaseInvoiceId = await resolveIdField(
    txPurchaseInvoiceLookup(tx),
    line,
    'purchaseInvoiceId',
    'purchaseInvoiceUuid',
    'purchaseInvoice',
    true,
  );
  const medicineId = await resolveIdField(
    txMedicineLookup(tx),
    line,
    'medicineId',
    'medicineUuid',
    'medicine',
    true,
  );
  const batchId = await resolveIdField(
    txBatchLookup(tx),
    line,
    'batchId',
    'batchUuid',
    'batch',
    true,
  );
  const unitId = await resolveIdField(
    txUnitLookup(tx),
    line,
    'unitId',
    'unitUuid',
    'unit',
    true,
  );
  const serverVersion = line.version ? asBigInt(line.version, 'version') : 1n;
  const existing = await tx.purchaseInvoiceItem.findFirst({ where: { uuid } });
  const payload = {
    purchaseInvoiceId: purchaseInvoiceId!,
    medicineId: medicineId!,
    batchId: batchId!,
    unitId: unitId!,
    lineNumber: asInt(line.lineNumber, 'lineNumber'),
    invoiceQuantity: asDecimal(
      line.invoiceQuantity ??
        line.invoicedQuantity ??
        line.quantity ??
        line.receivedQuantity,
    ),
    freeQuantity: asDecimal(line.freeQuantity ?? '0'),
    unitPrice: asDecimal(line.unitPrice ?? line.unitCost),
    mrp: asDecimal(line.mrp),
    discountPercent: asOptionalDecimal(line.discountPercent),
    discountAmount: asDecimal(line.discountAmount ?? '0'),
    taxPercent: asOptionalDecimal(line.taxPercent),
    taxAmount: asDecimal(line.taxAmount ?? '0'),
    lineAmount: asDecimal(line.lineAmount),
    version: serverVersion,
    updatedAt: BigInt(Date.now()),
  };
  if (existing) {
    await tx.purchaseInvoiceItem.update({
      where: { id: existing.id },
      data: payload as never,
    });
    return;
  }
  await tx.purchaseInvoiceItem.create({
    data: { uuid, ...payload, createdAt: BigInt(Date.now()) } as never,
  });
}

async function applyPurchaseInvoiceItemRecord(
  tx: TxClient,
  record: SyncCloudPullRecord,
): Promise<void> {
  const data = extractApplyData(record.payload);
  const uuid = recordEntityUuid(record, data);
  const serverVersion = serverVersionFromRecord(record);
  await upsertPurchaseInvoiceItem(tx, {
    ...data,
    uuid,
    version: serverVersion,
  });
}

async function applyPurchaseReturn(
  tx: TxClient,
  record: SyncCloudPullRecord,
): Promise<void> {
  await applyServerWin(
    tx,
    record,
    async (uuid) => {
      const row = await tx.purchaseReturn.findFirst({ where: { uuid } });
      return row ? { id: row.id, version: row.version } : null;
    },
    async (data, uuid, serverVersion) => {
      const base = stripIncomingSyncData(data);
      const supplierId = await resolveIdField(
        txSupplierLookup(tx),
        base,
        'supplierId',
        'supplierUuid',
        'supplier',
        true,
      );
      const branchId = await resolveIdField(
        txBranchLookup(tx),
        base,
        'branchId',
        'branchUuid',
        'branch',
        true,
      );
      const purchaseInvoiceId = await resolveOptionalIdField(
        txPurchaseInvoiceLookup(tx),
        base,
        'purchaseInvoiceId',
        'purchaseInvoiceUuid',
        'purchaseInvoice',
      );
      return {
        uuid,
        purchaseReturnNumber: asString(
          base.purchaseReturnNumber,
          'purchaseReturnNumber',
        ),
        supplierId: supplierId!,
        purchaseInvoiceId,
        branchId: branchId!,
        returnDate: asBigInt(base.returnDate, 'returnDate'),
        returnType: asString(base.returnType, 'returnType'),
        status: asString(base.status, 'status'),
        returnReason: asOptionalString(base.returnReason),
        grossAmount: asDecimal(base.grossAmount),
        discountAmount: asDecimal(base.discountAmount ?? '0'),
        taxAmount: asDecimal(base.taxAmount ?? '0'),
        netAmount: asDecimal(base.netAmount),
        supplierCreditNoteNo: asOptionalString(base.supplierCreditNoteNo),
        supplierCreditNoteDate: base.supplierCreditNoteDate
          ? asBigInt(base.supplierCreditNoteDate, 'supplierCreditNoteDate')
          : null,
        isSettled: asBool(base.isSettled, false),
        remarks: asOptionalString(base.remarks),
        version: serverVersion,
        createdAt: BigInt(Date.now()),
        updatedAt: BigInt(Date.now()),
      };
    },
    (data, serverVersion) => {
      const base = stripIncomingSyncData(data);
      return {
        status: asString(base.status, 'status'),
        isSettled: asBool(base.isSettled, false),
        version: serverVersion,
        updatedAt: BigInt(Date.now()),
      };
    },
    (row) => tx.purchaseReturn.create({ data: row as never }),
    (id, row) =>
      tx.purchaseReturn.update({ where: { id }, data: row as never }),
    async (data) => {
      await applyEmbeddedLines(tx, data, '', async (ltx, line) => {
        await upsertPurchaseReturnItem(ltx, line);
      });
    },
  );
}

async function upsertPurchaseReturnItem(
  tx: TxClient,
  line: Record<string, unknown>,
): Promise<void> {
  const uuid = asString(line.uuid ?? line.entityUuid, 'uuid');
  const purchaseReturnId = await resolveIdField(
    txPurchaseReturnLookup(tx),
    line,
    'purchaseReturnId',
    'purchaseReturnUuid',
    'purchaseReturn',
    true,
  );
  const batchId = await resolveIdField(
    txBatchLookup(tx),
    line,
    'batchId',
    'batchUuid',
    'batch',
    true,
  );
  const medicineId = await resolveIdField(
    txMedicineLookup(tx),
    line,
    'medicineId',
    'medicineUuid',
    'medicine',
    true,
  );
  const unitId = await resolveIdField(
    txUnitLookup(tx),
    line,
    'unitId',
    'unitUuid',
    'unit',
    true,
  );
  const serverVersion = line.version ? asBigInt(line.version, 'version') : 1n;
  const existing = await tx.purchaseReturnItem.findFirst({ where: { uuid } });
  const payload = {
    purchaseReturnId: purchaseReturnId!,
    medicineId: medicineId!,
    batchId: batchId!,
    unitId: unitId!,
    lineNumber: asInt(line.lineNumber, 'lineNumber'),
    returnQuantity: asDecimal(line.returnQuantity),
    unitPrice: asDecimal(line.unitPrice ?? line.unitCost),
    discountAmount: asDecimal(line.discountAmount ?? '0'),
    taxAmount: asDecimal(line.taxAmount ?? '0'),
    lineAmount: asDecimal(line.lineAmount),
    version: serverVersion,
    updatedAt: BigInt(Date.now()),
  };
  if (existing) {
    await tx.purchaseReturnItem.update({
      where: { id: existing.id },
      data: payload as never,
    });
    return;
  }
  await tx.purchaseReturnItem.create({
    data: { uuid, ...payload, createdAt: BigInt(Date.now()) } as never,
  });
}

async function applyPurchaseReturnItemRecord(
  tx: TxClient,
  record: SyncCloudPullRecord,
): Promise<void> {
  const data = extractApplyData(record.payload);
  const uuid = recordEntityUuid(record, data);
  const serverVersion = serverVersionFromRecord(record);
  await upsertPurchaseReturnItem(tx, { ...data, uuid, version: serverVersion });
}
