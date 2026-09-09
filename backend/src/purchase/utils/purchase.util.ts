import { randomUUID } from 'crypto';
import { HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import type { TxClient } from '../../persistence/prisma/prisma-tx.type';
import {
  GoodsReceiptStatus,
  PURCHASE_ORDER_RECEIVABLE_STATUSES,
  PurchaseOrderStatus,
} from '../constants/purchase.constants';

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

  if (
    purchaseOrder.status !== PurchaseOrderStatus.SENT_TO_SUPPLIER &&
    purchaseOrder.status !== PurchaseOrderStatus.PARTIALLY_RECEIVED
  ) {
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
  return (
    status === GoodsReceiptStatus.ACCEPTED ||
    status === GoodsReceiptStatus.PARTIALLY_ACCEPTED
  );
}
