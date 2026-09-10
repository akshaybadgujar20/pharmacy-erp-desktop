import { randomUUID } from 'crypto';
import { HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import type { TxClient } from '../../persistence/prisma/prisma-tx.type';
import { withBranchScope } from '../../persistence/context/tenant-scope.util';
import {
  GOODS_RECEIPT_STOCK_POSTED_STATUSES,
  GoodsReceiptStatus,
  PURCHASE_ORDER_EDITABLE_STATUSES,
  PURCHASE_ORDER_RECEIVABLE_STATUSES,
  PurchaseOrderStatus,
} from '../constants/purchase.constants';
import { SettingKey } from '../../settings/setting-keys.constants';

export function serializeBigInt(
  value: bigint | null | undefined,
): string | null {
  return value != null ? value.toString() : null;
}

export function serializeDecimal(
  value: Prisma.Decimal | null | undefined,
): number | null {
  return value != null ? value.toNumber() : null;
}

export const activeDocumentFilter = { deletedAt: null };

export function optimisticUpdate<T extends { count: number }>(
  result: T,
  id: bigint,
  message = 'Entity version conflict or not found',
): void {
  if (result.count === 0) {
    throw new ApplicationException(
      ErrorCode.ENTITY_VERSION_CONFLICT,
      message,
      HttpStatus.CONFLICT,
      { id: id.toString() },
    );
  }
}

export function throwNotFound(
  code: string,
  message: string,
  details?: Record<string, string>,
): never {
  throw new ApplicationException(code, message, HttpStatus.NOT_FOUND, details);
}

export function throwConflict(
  message: string,
  details?: Record<string, string>,
  code: string = ErrorCode.CONFLICT,
): never {
  throw new ApplicationException(code, message, HttpStatus.CONFLICT, details);
}

export function assertDraftStatus(
  status: string,
  entityLabel: string,
  draftStatus = PurchaseOrderStatus.DRAFT,
): void {
  if (status !== draftStatus) {
    throw new ApplicationException(
      ErrorCode.INVALID_DOCUMENT_STATUS,
      `${entityLabel} can only be modified while in ${draftStatus} status`,
      HttpStatus.CONFLICT,
      { status },
    );
  }
}

export function assertPoEditableStatus(status: string): void {
  if (
    !(PURCHASE_ORDER_EDITABLE_STATUSES as readonly string[]).includes(status)
  ) {
    throw new ApplicationException(
      ErrorCode.INVALID_DOCUMENT_STATUS,
      'Purchase order can only be modified while in DRAFT or PENDING_APPROVAL status',
      HttpStatus.CONFLICT,
      { status },
    );
  }
}

export async function assertBatchBelongsToMedicine(
  tx: TxClient,
  batchId: bigint,
  medicineId: bigint,
): Promise<void> {
  const batch = await tx.batch.findFirst({
    where: { id: batchId, deletedAt: null },
    select: { medicineId: true },
  });

  if (!batch) {
    throw new ApplicationException(
      ErrorCode.BATCH_NOT_FOUND,
      `Batch not found: ${batchId}`,
      HttpStatus.NOT_FOUND,
      { batchId: batchId.toString() },
    );
  }

  if (batch.medicineId !== medicineId) {
    throw new ApplicationException(
      ErrorCode.BAD_REQUEST,
      'medicineId does not match batch',
      HttpStatus.BAD_REQUEST,
      {
        medicineId: medicineId.toString(),
        batchMedicineId: batch.medicineId.toString(),
      },
    );
  }
}

export async function assertReturnQuantityAvailable(
  tx: TxClient,
  branchId: bigint,
  batchId: bigint,
  quantity: Prisma.Decimal | number | string,
): Promise<void> {
  const returnQty = new Prisma.Decimal(quantity);
  const stock = await tx.stock.findFirst({
    where: { branchId, batchId, deletedAt: null },
  });

  const available = new Prisma.Decimal(stock?.availableQuantity ?? 0);
  const reserved = new Prisma.Decimal(stock?.reservedQuantity ?? 0);
  const sellable = available.sub(reserved);

  if (returnQty.gt(sellable)) {
    throw new ApplicationException(
      ErrorCode.RETURN_QUANTITY_EXCEEDED,
      'Return quantity exceeds available stock',
      HttpStatus.CONFLICT,
      {
        batchId: batchId.toString(),
        requested: returnQty.toString(),
        available: sellable.toString(),
      },
    );
  }
}

export async function assertBranchExists(
  tx: TxClient,
  branchId: bigint,
): Promise<{ id: bigint; branchCode: string; companyId: bigint }> {
  const branch = await tx.branch.findFirst({
    where: { id: branchId, deletedAt: null },
    select: { id: true, branchCode: true, companyId: true },
  });

  if (!branch) {
    throw new ApplicationException(
      ErrorCode.NOT_FOUND,
      `Branch not found: ${branchId}`,
      HttpStatus.NOT_FOUND,
      { branchId: branchId.toString() },
    );
  }

  return branch;
}

export async function assertSupplierActive(
  tx: TxClient,
  supplierId: bigint,
): Promise<{ id: bigint }> {
  const supplier = await tx.supplier.findFirst({
    where: { id: supplierId, deletedAt: null, isActive: true },
    select: { id: true },
  });

  if (!supplier) {
    throw new ApplicationException(
      ErrorCode.SUPPLIER_INACTIVE,
      `Supplier not found or inactive: ${supplierId}`,
      HttpStatus.CONFLICT,
      { supplierId: supplierId.toString() },
    );
  }

  return supplier;
}

export async function assertMedicineExists(
  tx: TxClient,
  medicineId: bigint,
): Promise<{ id: bigint }> {
  const medicine = await tx.medicine.findFirst({
    where: { id: medicineId, deletedAt: null },
    select: { id: true },
  });

  if (!medicine) {
    throw new ApplicationException(
      ErrorCode.MEDICINE_NOT_FOUND,
      `Medicine not found: ${medicineId}`,
      HttpStatus.NOT_FOUND,
      { medicineId: medicineId.toString() },
    );
  }

  return medicine;
}

export async function assertEmployeeExists(
  tx: TxClient,
  employeeId: bigint,
): Promise<{ id: bigint }> {
  const employee = await tx.employee.findFirst({
    where: { id: employeeId, deletedAt: null },
    select: { id: true },
  });

  if (!employee) {
    throw new ApplicationException(
      ErrorCode.EMPLOYEE_NOT_FOUND,
      `Employee not found: ${employeeId}`,
      HttpStatus.NOT_FOUND,
      { employeeId: employeeId.toString() },
    );
  }

  return employee;
}

export function computeLineAmounts(
  quantity: Prisma.Decimal | number | string,
  unitPrice: Prisma.Decimal | number | string,
  discountPercent?: Prisma.Decimal | number | string | null,
  discountAmount?: Prisma.Decimal | number | string | null,
  taxPercent?: Prisma.Decimal | number | string | null,
  taxAmount?: Prisma.Decimal | number | string | null,
): {
  discountAmount: Prisma.Decimal;
  taxAmount: Prisma.Decimal;
  lineAmount: Prisma.Decimal;
} {
  const qty = new Prisma.Decimal(quantity);
  const price = new Prisma.Decimal(unitPrice);
  const gross = qty.mul(price);

  let discount =
    discountAmount != null
      ? new Prisma.Decimal(discountAmount)
      : new Prisma.Decimal(0);
  if (discountPercent != null && discount.eq(0)) {
    discount = gross.mul(new Prisma.Decimal(discountPercent)).div(100);
  }

  const taxable = gross.sub(discount);
  let tax =
    taxAmount != null ? new Prisma.Decimal(taxAmount) : new Prisma.Decimal(0);
  if (taxPercent != null && tax.eq(0)) {
    tax = taxable.mul(new Prisma.Decimal(taxPercent)).div(100);
  }

  return {
    discountAmount: discount,
    taxAmount: tax,
    lineAmount: taxable.add(tax),
  };
}

export interface ResolveBatchInput {
  medicineId: bigint;
  batchNumber: string;
  manufacturingDate?: bigint | null;
  expiryDate: bigint;
  purchaseRate: Prisma.Decimal | number | string;
  mrp: Prisma.Decimal | number | string;
  updatedBy?: bigint;
}

export async function resolveOrCreateBatch(
  tx: TxClient,
  input: ResolveBatchInput,
): Promise<{ id: bigint }> {
  const existing = await tx.batch.findFirst({
    where: {
      medicineId: input.medicineId,
      batchNumber: input.batchNumber,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (existing) {
    return existing;
  }

  const now = BigInt(Date.now());
  const batch = await tx.batch.create({
    data: {
      uuid: randomUUID(),
      medicineId: input.medicineId,
      batchNumber: input.batchNumber,
      manufacturingDate: input.manufacturingDate,
      expiryDate: input.expiryDate,
      purchaseRate: input.purchaseRate,
      mrp: input.mrp,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      updatedBy: input.updatedBy,
    },
  });

  return { id: batch.id };
}

export async function rollupPurchaseOrderTotals(
  tx: TxClient,
  purchaseOrderId: bigint,
): Promise<void> {
  const items = await tx.purchaseOrderItem.findMany({
    where: { purchaseOrderId, deletedAt: null },
  });

  let grossAmount = new Prisma.Decimal(0);
  let discountAmount = new Prisma.Decimal(0);
  let taxAmount = new Prisma.Decimal(0);

  for (const item of items) {
    const lineGross = new Prisma.Decimal(item.orderedQuantity).mul(
      item.unitPrice,
    );
    grossAmount = grossAmount.add(lineGross);
    discountAmount = discountAmount.add(item.discountAmount);
    taxAmount = taxAmount.add(item.taxAmount);
  }

  const netAmount = grossAmount.sub(discountAmount).add(taxAmount);

  await tx.purchaseOrder.update({
    where: { id: purchaseOrderId },
    data: {
      grossAmount,
      discountAmount,
      taxAmount,
      netAmount,
      updatedAt: BigInt(Date.now()),
    },
  });
}

export async function rollupPurchaseOrderStatus(
  tx: TxClient,
  purchaseOrderId: bigint,
): Promise<void> {
  const purchaseOrder = await tx.purchaseOrder.findFirst({
    where: { id: purchaseOrderId, deletedAt: null },
  });

  if (!purchaseOrder) {
    return;
  }

  const rollupStatuses: string[] = [
    PurchaseOrderStatus.APPROVED,
    PurchaseOrderStatus.SENT_TO_SUPPLIER,
    PurchaseOrderStatus.PARTIALLY_RECEIVED,
  ];

  if (!rollupStatuses.includes(purchaseOrder.status)) {
    return;
  }

  const items = await tx.purchaseOrderItem.findMany({
    where: { purchaseOrderId, deletedAt: null },
  });

  if (items.length === 0) {
    return;
  }

  let allComplete = true;
  let anyReceived = false;

  for (const item of items) {
    const ordered = new Prisma.Decimal(item.orderedQuantity);
    const received = new Prisma.Decimal(item.receivedQuantity);
    const cancelled = new Prisma.Decimal(item.cancelledQuantity);
    const pending = ordered.sub(received).sub(cancelled);

    if (received.gt(0)) {
      anyReceived = true;
    }
    if (pending.gt(0)) {
      allComplete = false;
    }
  }

  let nextStatus: string = purchaseOrder.status;
  if (allComplete && anyReceived) {
    nextStatus = PurchaseOrderStatus.COMPLETED;
  } else if (anyReceived) {
    nextStatus = PurchaseOrderStatus.PARTIALLY_RECEIVED;
  }

  if (nextStatus !== purchaseOrder.status) {
    await tx.purchaseOrder.update({
      where: { id: purchaseOrderId },
      data: { status: nextStatus, updatedAt: BigInt(Date.now()) },
    });
  }
}

export function assertPurchaseOrderReceivable(status: string): void {
  if (
    !(PURCHASE_ORDER_RECEIVABLE_STATUSES as readonly string[]).includes(status)
  ) {
    throw new ApplicationException(
      ErrorCode.PURCHASE_ORDER_NOT_RECEIVABLE,
      'Purchase order is not in a receivable status',
      HttpStatus.CONFLICT,
      { status },
    );
  }
}

export async function getNextLineNumber(
  tx: TxClient,
  model:
    | 'purchaseOrderItem'
    | 'goodsReceiptItem'
    | 'purchaseInvoiceItem'
    | 'purchaseReturnItem',
  parentField: string,
  parentId: bigint,
): Promise<number> {
  const where = { [parentField]: parentId, deletedAt: null };

  switch (model) {
    case 'purchaseOrderItem': {
      const aggregate = await tx.purchaseOrderItem.aggregate({
        where,
        _max: { lineNumber: true },
      });
      return (aggregate._max.lineNumber ?? 0) + 1;
    }
    case 'goodsReceiptItem': {
      const aggregate = await tx.goodsReceiptItem.aggregate({
        where,
        _max: { lineNumber: true },
      });
      return (aggregate._max.lineNumber ?? 0) + 1;
    }
    case 'purchaseInvoiceItem': {
      const aggregate = await tx.purchaseInvoiceItem.aggregate({
        where,
        _max: { lineNumber: true },
      });
      return (aggregate._max.lineNumber ?? 0) + 1;
    }
    case 'purchaseReturnItem': {
      const aggregate = await tx.purchaseReturnItem.aggregate({
        where,
        _max: { lineNumber: true },
      });
      return (aggregate._max.lineNumber ?? 0) + 1;
    }
  }
}

export function grnStockQuantity(item: {
  acceptedQuantity: Prisma.Decimal;
  freeQuantity: Prisma.Decimal;
}): Prisma.Decimal {
  return new Prisma.Decimal(item.acceptedQuantity).add(item.freeQuantity);
}

export function isGrnStockPosted(status: string): boolean {
  return (GOODS_RECEIPT_STOCK_POSTED_STATUSES as readonly string[]).includes(
    status,
  );
}

export async function rollupPurchaseInvoiceTotals(
  tx: TxClient,
  purchaseInvoiceId: bigint,
): Promise<void> {
  const items = await tx.purchaseInvoiceItem.findMany({
    where: { purchaseInvoiceId, deletedAt: null },
  });

  let grossAmount = new Prisma.Decimal(0);
  let discountAmount = new Prisma.Decimal(0);
  let taxAmount = new Prisma.Decimal(0);

  for (const item of items) {
    const lineGross = new Prisma.Decimal(item.invoiceQuantity).mul(
      item.unitPrice,
    );
    grossAmount = grossAmount.add(lineGross);
    discountAmount = discountAmount.add(item.discountAmount);
    taxAmount = taxAmount.add(item.taxAmount);
  }

  const netAmount = grossAmount.sub(discountAmount).add(taxAmount);

  await tx.purchaseInvoice.update({
    where: { id: purchaseInvoiceId },
    data: {
      grossAmount,
      discountAmount,
      taxAmount,
      netAmount,
      balanceAmount: netAmount,
      updatedAt: BigInt(Date.now()),
    },
  });
}

export async function rollupPurchaseReturnTotals(
  tx: TxClient,
  purchaseReturnId: bigint,
): Promise<void> {
  const items = await tx.purchaseReturnItem.findMany({
    where: { purchaseReturnId, deletedAt: null },
  });

  let grossAmount = new Prisma.Decimal(0);
  let discountAmount = new Prisma.Decimal(0);
  let taxAmount = new Prisma.Decimal(0);

  for (const item of items) {
    grossAmount = grossAmount.add(
      new Prisma.Decimal(item.returnQuantity).mul(item.unitPrice),
    );
    discountAmount = discountAmount.add(item.discountAmount);
    taxAmount = taxAmount.add(item.taxAmount);
  }

  const netAmount = grossAmount.sub(discountAmount).add(taxAmount);

  await tx.purchaseReturn.update({
    where: { id: purchaseReturnId },
    data: {
      grossAmount,
      discountAmount,
      taxAmount,
      netAmount,
      updatedAt: BigInt(Date.now()),
    },
  });
}

export function buildPurchaseDocumentListFilters(
  query: {
    status?: string;
    supplierId?: bigint;
    fromDate?: bigint;
    toDate?: bigint;
    purchaseOrderId?: bigint;
  },
  dateField: 'orderDate' | 'receiptDate' | 'invoiceDate' | 'returnDate',
): Record<string, unknown> {
  const filters: Record<string, unknown> = {};

  if (query.status) {
    filters.status = query.status;
  }
  if (query.supplierId) {
    filters.supplierId = query.supplierId;
  }
  if (query.purchaseOrderId) {
    filters.purchaseOrderId = query.purchaseOrderId;
  }
  if (query.fromDate || query.toDate) {
    filters[dateField] = {
      ...(query.fromDate ? { gte: query.fromDate } : {}),
      ...(query.toDate ? { lte: query.toDate } : {}),
    };
  }

  return filters;
}

type GrnSettingsReader = {
  getBoolean(key: string, defaultValue: boolean): Promise<boolean>;
};

export async function assertGrnPurchaseOrderLink(
  tx: TxClient,
  scope: { companyId: bigint; branchId: bigint },
  supplierId: bigint,
  purchaseOrderId: bigint | null | undefined,
  settings: GrnSettingsReader,
): Promise<void> {
  if (!purchaseOrderId) {
    const allowed = await settings.getBoolean(
      SettingKey.PURCHASE_ALLOW_GRN_WITHOUT_PO,
      false,
    );
    if (!allowed) {
      throw new ApplicationException(
        ErrorCode.GRN_PO_REQUIRED,
        'Purchase order is required for goods receipt',
        HttpStatus.BAD_REQUEST,
      );
    }
    return;
  }

  await validateGrnPurchaseOrderLink(tx, scope, supplierId, purchaseOrderId);
}

export async function validateGrnPurchaseOrderLink(
  tx: TxClient,
  scope: { companyId: bigint; branchId: bigint },
  supplierId: bigint,
  purchaseOrderId?: bigint | null,
): Promise<void> {
  if (!purchaseOrderId) {
    return;
  }

  const purchaseOrder = await tx.purchaseOrder.findFirst({
    where: withBranchScope(scope, {
      id: purchaseOrderId,
      deletedAt: null,
    }),
  });

  if (!purchaseOrder) {
    throwNotFound(
      ErrorCode.PURCHASE_ORDER_NOT_FOUND,
      `Purchase order not found: ${purchaseOrderId}`,
      { purchaseOrderId: purchaseOrderId.toString() },
    );
  }

  assertPurchaseOrderReceivable(purchaseOrder.status);

  if (purchaseOrder.supplierId !== supplierId) {
    throw new ApplicationException(
      ErrorCode.BAD_REQUEST,
      'Goods receipt supplier must match purchase order supplier',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export async function assertPurchaseOrderHasNoReceipts(
  tx: TxClient,
  purchaseOrderId: bigint,
): Promise<void> {
  const items = await tx.purchaseOrderItem.findMany({
    where: { purchaseOrderId, deletedAt: null },
    select: { receivedQuantity: true },
  });

  const hasReceivedQty = items.some((item) =>
    new Prisma.Decimal(item.receivedQuantity).gt(0),
  );

  if (hasReceivedQty) {
    throwConflict(
      'Purchase order cannot be cancelled after goods have been received',
      { purchaseOrderId: purchaseOrderId.toString() },
    );
  }

  const postedGrn = await tx.goodsReceipt.findFirst({
    where: {
      purchaseOrderId,
      deletedAt: null,
      status: {
        in: [
          GoodsReceiptStatus.ACCEPTED,
          GoodsReceiptStatus.PARTIALLY_ACCEPTED,
          GoodsReceiptStatus.UNDER_INSPECTION,
        ],
      },
    },
    select: { id: true },
  });

  if (postedGrn) {
    throwConflict(
      'Purchase order cannot be cancelled while goods receipts exist',
      { purchaseOrderId: purchaseOrderId.toString() },
    );
  }
}

export async function assertGrnQuantityWithinPoPending(
  tx: TxClient,
  purchaseOrderItemId: bigint,
  quantity: Prisma.Decimal | number | string,
  excludeGoodsReceiptItemId?: bigint,
): Promise<void> {
  const poItem = await tx.purchaseOrderItem.findFirst({
    where: { id: purchaseOrderItemId, deletedAt: null },
  });

  if (!poItem) {
    throw new ApplicationException(
      ErrorCode.PURCHASE_ORDER_ITEM_NOT_FOUND,
      `Purchase order item not found: ${purchaseOrderItemId}`,
      HttpStatus.NOT_FOUND,
      { purchaseOrderItemId: purchaseOrderItemId.toString() },
    );
  }

  const ordered = new Prisma.Decimal(poItem.orderedQuantity);
  const received = new Prisma.Decimal(poItem.receivedQuantity);
  const cancelled = new Prisma.Decimal(poItem.cancelledQuantity);
  const pending = ordered.sub(received).sub(cancelled);

  let additionalQty = new Prisma.Decimal(quantity);

  if (excludeGoodsReceiptItemId) {
    const existingItem = await tx.goodsReceiptItem.findFirst({
      where: { id: excludeGoodsReceiptItemId, deletedAt: null },
    });

    if (existingItem) {
      additionalQty = additionalQty.sub(grnStockQuantity(existingItem));
    }
  }

  if (additionalQty.gt(pending)) {
    throw new ApplicationException(
      ErrorCode.GRN_OVER_RECEIPT,
      'Received quantity exceeds pending purchase order quantity',
      HttpStatus.CONFLICT,
      {
        purchaseOrderItemId: purchaseOrderItemId.toString(),
        pending: pending.toString(),
        requested: additionalQty.toString(),
      },
    );
  }
}
