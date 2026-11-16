import { OutboxEntityType } from '../../../persistence/outbox/entity-type.constants';
import type { TxClient } from '../../../persistence/prisma/prisma-tx.type';
import type { SyncCloudPullRecord } from '../../cloud/sync-cloud.contract';
import {
  asBigInt,
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
  txCustomerLookup,
  txMedicineLookup,
  txPrescriptionLookup,
  txSalesInvoiceLookup,
  txSalesReturnLookup,
  txUnitLookup,
} from '../sync-fk-resolve.util';
import {
  applyEmbeddedLines,
  applyServerWin,
  asDecimal,
  asInt,
  asOptionalDecimal,
} from './transactional-apply-shared';

export async function applySalesTransactional(
  tx: TxClient,
  record: SyncCloudPullRecord,
): Promise<void> {
  switch (record.entityType) {
    case OutboxEntityType.SALES_INVOICE:
      await applySalesInvoice(tx, record);
      return;
    case 'SalesInvoiceItem':
      await applySalesInvoiceItemRecord(tx, record);
      return;
    case OutboxEntityType.SALES_PAYMENT:
      await applySalesPayment(tx, record);
      return;
    case OutboxEntityType.SALES_RETURN:
      await applySalesReturn(tx, record);
      return;
    case 'SalesReturnItem':
      await applySalesReturnItemRecord(tx, record);
      return;
    default:
      throw new SyncApplyError(
        `Sales apply does not handle ${record.entityType}`,
      );
  }
}

async function upsertSalesInvoiceItem(
  tx: TxClient,
  line: Record<string, unknown>,
): Promise<void> {
  const uuid = asString(line.uuid ?? line.entityUuid, 'uuid');
  const salesInvoiceId = await resolveIdField(
    txSalesInvoiceLookup(tx),
    line,
    'salesInvoiceId',
    'salesInvoiceUuid',
    'salesInvoice',
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
  const existing = await tx.salesInvoiceItem.findFirst({ where: { uuid } });
  const payload = {
    salesInvoiceId: salesInvoiceId!,
    medicineId: medicineId!,
    batchId: batchId!,
    unitId: unitId!,
    lineNumber: asInt(line.lineNumber, 'lineNumber'),
    soldQuantity: asDecimal(line.soldQuantity),
    mrp: asDecimal(line.mrp),
    unitPrice: asDecimal(line.unitPrice),
    purchaseRate: asOptionalDecimal(line.purchaseRate),
    conversionFactor: asDecimal(line.conversionFactor ?? '1'),
    discountPercent: asOptionalDecimal(line.discountPercent),
    discountAmount: asDecimal(line.discountAmount ?? '0'),
    taxPercent: asOptionalDecimal(line.taxPercent),
    taxAmount: asDecimal(line.taxAmount ?? '0'),
    lineAmount: asDecimal(line.lineAmount),
    remarks: asOptionalString(line.remarks),
    version: serverVersion,
    updatedAt: BigInt(Date.now()),
  };
  if (existing) {
    await tx.salesInvoiceItem.update({
      where: { id: existing.id },
      data: payload as never,
    });
    return;
  }
  await tx.salesInvoiceItem.create({
    data: { uuid, ...payload, createdAt: BigInt(Date.now()) } as never,
  });
}

async function applySalesInvoice(
  tx: TxClient,
  record: SyncCloudPullRecord,
): Promise<void> {
  await applyServerWin(
    tx,
    record,
    async (uuid) => {
      const row = await tx.salesInvoice.findFirst({ where: { uuid } });
      return row ? { id: row.id, version: row.version } : null;
    },
    async (data, uuid, serverVersion) => {
      const base = stripIncomingSyncData(data);
      const branchId = await resolveIdField(
        txBranchLookup(tx),
        base,
        'branchId',
        'branchUuid',
        'branch',
        true,
      );
      const customerId = await resolveOptionalIdField(
        txCustomerLookup(tx),
        base,
        'customerId',
        'customerUuid',
        'customer',
      );
      const prescriptionId = await resolveOptionalIdField(
        txPrescriptionLookup(tx),
        base,
        'prescriptionId',
        'prescriptionUuid',
        'prescription',
      );
      return {
        uuid,
        invoiceNumber: asString(base.invoiceNumber, 'invoiceNumber'),
        customerId,
        prescriptionId,
        branchId: branchId!,
        invoiceDate: asBigInt(base.invoiceDate, 'invoiceDate'),
        patientName: asOptionalString(base.patientName),
        doctorName: asOptionalString(base.doctorName),
        grossAmount: asDecimal(base.grossAmount),
        discountAmount: asDecimal(base.discountAmount ?? '0'),
        taxAmount: asDecimal(base.taxAmount ?? '0'),
        roundOffAmount: asDecimal(base.roundOffAmount ?? '0'),
        netAmount: asDecimal(base.netAmount),
        paidAmount: asDecimal(base.paidAmount ?? '0'),
        balanceAmount: asDecimal(base.balanceAmount ?? '0'),
        paymentMode: asOptionalString(base.paymentMode),
        paymentStatus: asString(base.paymentStatus ?? 'PAID', 'paymentStatus'),
        status: asString(base.status ?? 'POSTED', 'status'),
        salesType: asString(base.salesType ?? 'RETAIL_OTC', 'salesType'),
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
        paymentStatus: asString(base.paymentStatus, 'paymentStatus'),
        status: asString(base.status, 'status'),
        version: serverVersion,
        updatedAt: BigInt(Date.now()),
      };
    },
    (row) => tx.salesInvoice.create({ data: row as never }),
    (id, row) => tx.salesInvoice.update({ where: { id }, data: row as never }),
    async (data) => {
      await applyEmbeddedLines(tx, data, '', async (ltx, line) => {
        await upsertSalesInvoiceItem(ltx, line);
      });
    },
  );
}

async function applySalesInvoiceItemRecord(
  tx: TxClient,
  record: SyncCloudPullRecord,
): Promise<void> {
  const data = extractApplyData(record.payload);
  const uuid = recordEntityUuid(record, data);
  const serverVersion = serverVersionFromRecord(record);
  await upsertSalesInvoiceItem(tx, { ...data, uuid, version: serverVersion });
}

async function applySalesPayment(
  tx: TxClient,
  record: SyncCloudPullRecord,
): Promise<void> {
  await applyServerWin(
    tx,
    record,
    async (uuid) => {
      const row = await tx.salesPayment.findFirst({ where: { uuid } });
      return row ? { id: row.id, version: row.version } : null;
    },
    async (data, uuid, serverVersion) => {
      const base = stripIncomingSyncData(data);
      const salesInvoiceId = await resolveIdField(
        txSalesInvoiceLookup(tx),
        base,
        'salesInvoiceId',
        'salesInvoiceUuid',
        'salesInvoice',
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
      return {
        uuid,
        paymentNumber: asString(base.paymentNumber, 'paymentNumber'),
        salesInvoiceId: salesInvoiceId!,
        branchId: branchId!,
        paymentDate: asBigInt(base.paymentDate, 'paymentDate'),
        paymentMethod: asString(base.paymentMethod, 'paymentMethod'),
        paymentAmount: asDecimal(base.paymentAmount),
        tenderedAmount: asOptionalDecimal(base.tenderedAmount),
        changeReturned: asOptionalDecimal(base.changeReturned),
        transactionReference: asOptionalString(base.transactionReference),
        status: asString(base.status ?? 'COMPLETED', 'status'),
        remarks: asOptionalString(base.remarks),
        version: serverVersion,
        createdAt: BigInt(Date.now()),
        updatedAt: BigInt(Date.now()),
      };
    },
    (data, serverVersion) => {
      const base = stripIncomingSyncData(data);
      return {
        paymentAmount: asDecimal(base.paymentAmount),
        status: asString(base.status, 'status'),
        version: serverVersion,
        updatedAt: BigInt(Date.now()),
      };
    },
    (row) => tx.salesPayment.create({ data: row as never }),
    (id, row) => tx.salesPayment.update({ where: { id }, data: row as never }),
  );
}

async function applySalesReturn(
  tx: TxClient,
  record: SyncCloudPullRecord,
): Promise<void> {
  await applyServerWin(
    tx,
    record,
    async (uuid) => {
      const row = await tx.salesReturn.findFirst({ where: { uuid } });
      return row ? { id: row.id, version: row.version } : null;
    },
    async (data, uuid, serverVersion) => {
      const base = stripIncomingSyncData(data);
      const salesInvoiceId = await resolveIdField(
        txSalesInvoiceLookup(tx),
        base,
        'salesInvoiceId',
        'salesInvoiceUuid',
        'salesInvoice',
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
      const customerId = await resolveOptionalIdField(
        txCustomerLookup(tx),
        base,
        'customerId',
        'customerUuid',
        'customer',
      );
      return {
        uuid,
        salesReturnNumber: asString(
          base.salesReturnNumber,
          'salesReturnNumber',
        ),
        salesInvoiceId: salesInvoiceId!,
        customerId,
        branchId: branchId!,
        returnDate: asBigInt(base.returnDate, 'returnDate'),
        returnReason: asString(base.returnReason, 'returnReason'),
        grossAmount: asDecimal(base.grossAmount),
        discountAmount: asDecimal(base.discountAmount ?? '0'),
        taxAmount: asDecimal(base.taxAmount ?? '0'),
        roundOffAmount: asDecimal(base.roundOffAmount ?? '0'),
        netAmount: asDecimal(base.netAmount),
        refundAmount: asDecimal(base.refundAmount ?? '0'),
        refundMode: asOptionalString(base.refundMode),
        creditNoteNumber: asOptionalString(base.creditNoteNumber),
        status: asString(base.status ?? 'COMPLETED', 'status'),
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
        refundAmount: asDecimal(base.refundAmount ?? '0'),
        version: serverVersion,
        updatedAt: BigInt(Date.now()),
      };
    },
    (row) => tx.salesReturn.create({ data: row as never }),
    (id, row) => tx.salesReturn.update({ where: { id }, data: row as never }),
    async (data) => {
      await applyEmbeddedLines(tx, data, '', async (ltx, line) => {
        await upsertSalesReturnItem(ltx, line);
      });
    },
  );
}

async function upsertSalesReturnItem(
  tx: TxClient,
  line: Record<string, unknown>,
): Promise<void> {
  const uuid = asString(line.uuid ?? line.entityUuid, 'uuid');
  const salesReturnId = await resolveIdField(
    txSalesReturnLookup(tx),
    line,
    'salesReturnId',
    'salesReturnUuid',
    'salesReturn',
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
  const existing = await tx.salesReturnItem.findFirst({ where: { uuid } });
  const payload = {
    salesReturnId: salesReturnId!,
    medicineId: medicineId!,
    batchId: batchId!,
    unitId: unitId!,
    lineNumber: asInt(line.lineNumber, 'lineNumber'),
    salesInvoiceItemId: asBigInt(line.salesInvoiceItemId, 'salesInvoiceItemId'),
    returnQuantity: asDecimal(line.returnQuantity ?? line.returnedQuantity),
    unitPrice: asDecimal(line.unitPrice),
    discountAmount: asDecimal(line.discountAmount ?? '0'),
    taxAmount: asDecimal(line.taxAmount ?? '0'),
    lineAmount: asDecimal(line.lineAmount),
    returnReason: asString(line.returnReason, 'returnReason'),
    disposition: asString(line.disposition ?? 'RESTOCK', 'disposition'),
    version: serverVersion,
    updatedAt: BigInt(Date.now()),
  };
  if (existing) {
    await tx.salesReturnItem.update({
      where: { id: existing.id },
      data: payload as never,
    });
    return;
  }
  await tx.salesReturnItem.create({
    data: { uuid, ...payload, createdAt: BigInt(Date.now()) } as never,
  });
}

async function applySalesReturnItemRecord(
  tx: TxClient,
  record: SyncCloudPullRecord,
): Promise<void> {
  const data = extractApplyData(record.payload);
  const uuid = recordEntityUuid(record, data);
  const serverVersion = serverVersionFromRecord(record);
  await upsertSalesReturnItem(tx, { ...data, uuid, version: serverVersion });
}
