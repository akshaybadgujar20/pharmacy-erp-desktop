import { HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import type { TxClient } from '../../persistence/prisma/prisma-tx.type';
import { buildCompanyBranchFilter } from '../../persistence/context/branch-scope.util';
import { AppliesTo } from '../constants/pricing.constants';

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

export type PriceListListFilters = {
  priceListType?: string;
  isActive?: boolean;
  isDefault?: boolean;
  search?: string;
};

export function buildPriceListListWhere(
  branchId: bigint,
  query: PriceListListFilters,
): Prisma.PriceListWhereInput {
  const search = query.search?.trim();

  return {
    deletedAt: null,
    ...(query.priceListType ? { priceListType: query.priceListType } : {}),
    ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
    ...(query.isDefault !== undefined ? { isDefault: query.isDefault } : {}),
    AND: [
      buildCompanyBranchFilter(branchId),
      ...(search
        ? [
            {
              OR: [
                { priceListCode: { contains: search } },
                { priceListName: { contains: search } },
              ],
            },
          ]
        : []),
    ],
  };
}

export interface ResolvedDiscountRuleFks {
  medicineId: bigint | null;
  categoryId: bigint | null;
  customerId: bigint | null;
  priceListId: bigint | null;
}

export function resolveDiscountRuleAppliesTo(
  appliesTo: string,
  fks: {
    medicineId?: bigint | null;
    categoryId?: bigint | null;
    customerId?: bigint | null;
    priceListId?: bigint | null;
  },
): ResolvedDiscountRuleFks {
  switch (appliesTo) {
    case AppliesTo.MEDICINE: {
      if (fks.medicineId == null) {
        throw new ApplicationException(
          ErrorCode.VALIDATION_ERROR,
          'medicineId is required when appliesTo is MEDICINE',
          HttpStatus.BAD_REQUEST,
          { field: 'medicineId', appliesTo },
        );
      }
      return {
        medicineId: fks.medicineId,
        categoryId: null,
        customerId: null,
        priceListId: null,
      };
    }
    case AppliesTo.CATEGORY: {
      if (fks.categoryId == null) {
        throw new ApplicationException(
          ErrorCode.VALIDATION_ERROR,
          'categoryId is required when appliesTo is CATEGORY',
          HttpStatus.BAD_REQUEST,
          { field: 'categoryId', appliesTo },
        );
      }
      return {
        medicineId: null,
        categoryId: fks.categoryId,
        customerId: null,
        priceListId: null,
      };
    }
    case AppliesTo.CUSTOMER: {
      if (fks.customerId == null) {
        throw new ApplicationException(
          ErrorCode.VALIDATION_ERROR,
          'customerId is required when appliesTo is CUSTOMER',
          HttpStatus.BAD_REQUEST,
          { field: 'customerId', appliesTo },
        );
      }
      return {
        medicineId: null,
        categoryId: null,
        customerId: fks.customerId,
        priceListId: null,
      };
    }
    case AppliesTo.PRICE_LIST: {
      if (fks.priceListId == null) {
        throw new ApplicationException(
          ErrorCode.VALIDATION_ERROR,
          'priceListId is required when appliesTo is PRICE_LIST',
          HttpStatus.BAD_REQUEST,
          { field: 'priceListId', appliesTo },
        );
      }
      return {
        medicineId: null,
        categoryId: null,
        customerId: null,
        priceListId: fks.priceListId,
      };
    }
    case AppliesTo.GLOBAL:
      return {
        medicineId: null,
        categoryId: null,
        customerId: null,
        priceListId: null,
      };
    default:
      throw new ApplicationException(
        ErrorCode.VALIDATION_ERROR,
        `Invalid appliesTo value: ${appliesTo}`,
        HttpStatus.BAD_REQUEST,
        { field: 'appliesTo', value: appliesTo },
      );
  }
}

export async function hardDeletePriceListItemSlot(
  tx: TxClient,
  priceListId: bigint,
  medicineId: bigint,
): Promise<void> {
  const ghost = await tx.priceListItem.findFirst({
    where: { priceListId, medicineId },
  });

  if (ghost) {
    await tx.priceListItem.delete({ where: { id: ghost.id } });
  }
}

export async function hardDeleteAllPriceListItems(
  tx: TxClient,
  priceListId: bigint,
): Promise<Array<{ id: bigint; uuid: string }>> {
  const rows = await tx.priceListItem.findMany({
    where: { priceListId },
    select: { id: true, uuid: true },
  });

  for (const row of rows) {
    await tx.priceListItem.delete({ where: { id: row.id } });
  }

  return rows;
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
      ...buildCompanyBranchFilter(branchId),
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
      ErrorCode.PRICE_LIST_IN_USE,
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
