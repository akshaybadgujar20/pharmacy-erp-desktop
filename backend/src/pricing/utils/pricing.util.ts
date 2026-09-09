import { HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import type { TxClient } from '../../persistence/prisma/prisma-tx.type';

export function serializeEpochMs(
  value: bigint | null | undefined,
): string | null {
  return value != null ? new Date(Number(value)).toISOString() : null;
}

export function serializeDecimal(
  value: Prisma.Decimal | null | undefined,
): string | null {
  return value != null ? value.toString() : null;
}

export function serializeOptionalBigInt(
  value: bigint | null | undefined,
): string | null {
  return value != null ? value.toString() : null;
}

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
  code: string,
  message: string,
  details?: Record<string, string>,
): never {
  throw new ApplicationException(code, message, HttpStatus.CONFLICT, details);
}

export function buildPriceListBranchFilter(
  branchId: bigint,
): Prisma.PriceListWhereInput {
  return {
    OR: [{ branchId }, { branchId: null }],
  };
}

export async function clearOtherDefaults(
  tx: TxClient,
  branchId: bigint | null,
  excludeId?: bigint,
): Promise<void> {
  await tx.priceList.updateMany({
    where: {
      deletedAt: null,
      isDefault: true,
      branchId: branchId ?? null,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    data: {
      isDefault: false,
      updatedAt: BigInt(Date.now()),
      version: { increment: 1 },
    },
  });
}

export async function assertTaxExists(
  tx: TxClient,
  taxId: bigint,
  requireActive = true,
): Promise<{ id: bigint; uuid: string }> {
  const tax = await tx.tax.findFirst({
    where: {
      id: taxId,
      deletedAt: null,
      ...(requireActive ? { isActive: true } : {}),
    },
    select: { id: true, uuid: true },
  });

  if (!tax) {
    throwNotFound(ErrorCode.TAX_NOT_FOUND, `Tax not found: ${taxId}`, {
      id: taxId.toString(),
    });
  }

  return tax;
}

export async function assertPriceListExists(
  tx: TxClient,
  priceListId: bigint,
  branchId: bigint,
  requireActive = true,
): Promise<{ id: bigint; uuid: string; branchId: bigint | null }> {
  const priceList = await tx.priceList.findFirst({
    where: {
      id: priceListId,
      deletedAt: null,
      ...(requireActive ? { isActive: true } : {}),
      ...buildPriceListBranchFilter(branchId),
    },
    select: { id: true, uuid: true, branchId: true },
  });

  if (!priceList) {
    throwNotFound(
      ErrorCode.PRICE_LIST_NOT_FOUND,
      `Price list not found: ${priceListId}`,
      { id: priceListId.toString() },
    );
  }

  return priceList;
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
    throwNotFound(
      ErrorCode.MEDICINE_NOT_FOUND,
      `Medicine not found: ${medicineId}`,
      { id: medicineId.toString() },
    );
  }

  return medicine;
}

export async function assertTaxNotInUse(
  tx: TxClient,
  taxId: bigint,
): Promise<void> {
  const [priceListItems, purchaseInvoiceItems, salesInvoiceItems] =
    await Promise.all([
      tx.priceListItem.count({ where: { taxId, deletedAt: null } }),
      tx.purchaseInvoiceItem.count({ where: { taxId } }),
      tx.salesInvoiceItem.count({ where: { taxId } }),
    ]);

  const total = priceListItems + purchaseInvoiceItems + salesInvoiceItems;

  if (total > 0) {
    throwConflict(
      ErrorCode.TAX_IN_USE,
      `Tax is referenced by downstream records: ${taxId}`,
      { id: taxId.toString(), referenceCount: total.toString() },
    );
  }
}

export async function assertPriceListNotInUse(
  tx: TxClient,
  priceListId: bigint,
): Promise<void> {
  const [itemCount, discountRuleCount] = await Promise.all([
    tx.priceListItem.count({ where: { priceListId, deletedAt: null } }),
    tx.discountRule.count({ where: { priceListId, deletedAt: null } }),
  ]);

  const total = itemCount + discountRuleCount;

  if (total > 0) {
    throwConflict(
      ErrorCode.CONFLICT,
      `Price list is referenced by items or discount rules: ${priceListId}`,
      { id: priceListId.toString(), referenceCount: total.toString() },
    );
  }
}

export async function assertCustomerExists(
  tx: TxClient,
  customerId: bigint,
): Promise<void> {
  const customer = await tx.customer.findFirst({
    where: { id: customerId, deletedAt: null },
    select: { id: true },
  });

  if (!customer) {
    throwNotFound(
      ErrorCode.CUSTOMER_NOT_FOUND,
      `Customer not found: ${customerId}`,
      { id: customerId.toString() },
    );
  }
}

export async function assertCategoryExists(
  tx: TxClient,
  categoryId: bigint,
): Promise<void> {
  const category = await tx.medicineCategory.findFirst({
    where: { id: categoryId, deletedAt: null },
    select: { id: true },
  });

  if (!category) {
    throwNotFound(
      ErrorCode.MEDICINE_CATEGORY_NOT_FOUND,
      `Medicine category not found: ${categoryId}`,
      { id: categoryId.toString() },
    );
  }
}
