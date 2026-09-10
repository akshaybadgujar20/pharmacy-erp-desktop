import { HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import type { TxClient } from '../../persistence/prisma/prisma-tx.type';
import { FinancialYearStatus } from '../constants/configuration.constants';

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

export function validateFinancialYearDates(
  startDate: bigint,
  endDate: bigint,
): void {
  if (endDate <= startDate) {
    throw new ApplicationException(
      ErrorCode.FINANCIAL_YEAR_CONFLICT,
      'Financial year end date must be after start date',
      HttpStatus.BAD_REQUEST,
      {
        startDate: startDate.toString(),
        endDate: endDate.toString(),
      },
    );
  }
}

export function assertFinancialYearMutable(status: string): void {
  if (
    status === FinancialYearStatus.CLOSED ||
    status === FinancialYearStatus.ARCHIVED
  ) {
    throw new ApplicationException(
      ErrorCode.FINANCIAL_YEAR_CLOSED,
      `Financial year is ${status} and cannot be modified`,
      HttpStatus.CONFLICT,
      { status },
    );
  }
}

export async function assertCompanyExists(
  tx: TxClient,
  companyId: bigint,
): Promise<{ id: bigint; uuid: string }> {
  const company = await tx.company.findFirst({
    where: { id: companyId, deletedAt: null },
    select: { id: true, uuid: true },
  });

  if (!company) {
    throwNotFound(
      ErrorCode.COMPANY_NOT_FOUND,
      `Company not found: ${companyId}`,
      {
        id: companyId.toString(),
      },
    );
  }

  return company;
}

export async function clearOtherCompanyDefaults(
  tx: TxClient,
  excludeId?: bigint,
): Promise<void> {
  const now = BigInt(Date.now());
  await tx.company.updateMany({
    where: {
      deletedAt: null,
      isDefault: true,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    data: {
      isDefault: false,
      updatedAt: now,
      version: { increment: 1 },
    },
  });
}

export async function clearOtherHeadOffices(
  tx: TxClient,
  companyId: bigint,
  excludeId?: bigint,
): Promise<void> {
  const now = BigInt(Date.now());
  await tx.branch.updateMany({
    where: {
      companyId,
      deletedAt: null,
      isHeadOffice: true,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    data: {
      isHeadOffice: false,
      updatedAt: now,
      version: { increment: 1 },
    },
  });
}

export async function clearOtherCurrentFinancialYears(
  tx: TxClient,
  companyId: bigint,
  branchId: bigint | null,
  excludeId?: bigint,
): Promise<void> {
  const now = BigInt(Date.now());
  await tx.financialYear.updateMany({
    where: {
      companyId,
      branchId,
      deletedAt: null,
      isCurrent: true,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    data: {
      isCurrent: false,
      updatedAt: now,
      version: { increment: 1 },
    },
  });
}

export async function clearOtherPrinterDefaults(
  tx: TxClient,
  companyId: bigint,
  branchId: bigint | null,
  documentType: string,
  excludeId?: bigint,
): Promise<void> {
  const now = BigInt(Date.now());
  await tx.printerConfiguration.updateMany({
    where: {
      companyId,
      branchId,
      documentType,
      deletedAt: null,
      isDefault: true,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    data: {
      isDefault: false,
      updatedAt: now,
      version: { increment: 1 },
    },
  });
}

export async function clearOtherBarcodeDefaults(
  tx: TxClient,
  companyId: bigint,
  branchId: bigint | null,
  configurationName: string,
  excludeId?: bigint,
): Promise<void> {
  const now = BigInt(Date.now());
  await tx.barcodeConfiguration.updateMany({
    where: {
      companyId,
      branchId,
      configurationName,
      deletedAt: null,
      isDefault: true,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    data: {
      isDefault: false,
      updatedAt: now,
      version: { increment: 1 },
    },
  });
}

export async function assertFinancialYearNoOverlap(
  tx: TxClient,
  companyId: bigint,
  branchId: bigint | null,
  startDate: bigint,
  endDate: bigint,
  excludeId?: bigint,
): Promise<void> {
  const overlapping = await tx.financialYear.findFirst({
    where: {
      companyId,
      branchId,
      deletedAt: null,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    },
    select: { id: true, financialYearCode: true },
  });

  if (overlapping) {
    throwConflict(
      ErrorCode.FINANCIAL_YEAR_CONFLICT,
      `Financial year dates overlap with ${overlapping.financialYearCode}`,
      {
        overlappingId: overlapping.id.toString(),
        financialYearCode: overlapping.financialYearCode,
      },
    );
  }
}

export async function assertCompanyNotInUse(
  tx: TxClient,
  companyId: bigint,
): Promise<void> {
  const [
    branchCount,
    financialYearCount,
    appSettingCount,
    sequenceCount,
    printerCount,
    barcodeCount,
  ] = await Promise.all([
    tx.branch.count({ where: { companyId, deletedAt: null } }),
    tx.financialYear.count({ where: { companyId, deletedAt: null } }),
    tx.appSetting.count({ where: { companyId, deletedAt: null } }),
    tx.sequenceGenerator.count({ where: { companyId } }),
    tx.printerConfiguration.count({ where: { companyId, deletedAt: null } }),
    tx.barcodeConfiguration.count({ where: { companyId, deletedAt: null } }),
  ]);

  const total =
    branchCount +
    financialYearCount +
    appSettingCount +
    sequenceCount +
    printerCount +
    barcodeCount;

  if (total > 0) {
    throwConflict(
      ErrorCode.COMPANY_IN_USE,
      `Company is referenced by downstream records: ${companyId}`,
      { id: companyId.toString(), referenceCount: total.toString() },
    );
  }
}

export async function assertBranchNotInUse(
  tx: TxClient,
  branchId: bigint,
): Promise<void> {
  const counts = await Promise.all([
    tx.stock.count({ where: { branchId } }),
    tx.stockAdjustment.count({ where: { branchId, deletedAt: null } }),
    tx.stockMovement.count({ where: { branchId } }),
    tx.stockTake.count({ where: { branchId, deletedAt: null } }),
    tx.salesInvoice.count({ where: { branchId, deletedAt: null } }),
    tx.salesPayment.count({ where: { branchId, deletedAt: null } }),
    tx.salesReturn.count({ where: { branchId, deletedAt: null } }),
    tx.purchaseInvoice.count({ where: { branchId, deletedAt: null } }),
    tx.purchaseOrder.count({ where: { branchId, deletedAt: null } }),
    tx.purchaseReturn.count({ where: { branchId, deletedAt: null } }),
    tx.goodsReceipt.count({ where: { branchId, deletedAt: null } }),
    tx.userBranch.count({ where: { branchId, deletedAt: null } }),
    tx.prescription.count({ where: { branchId, deletedAt: null } }),
    tx.priceList.count({ where: { branchId, deletedAt: null } }),
    tx.expense.count({ where: { branchId, deletedAt: null } }),
    tx.outbox.count({ where: { branchId } }),
    tx.financialYear.count({ where: { branchId, deletedAt: null } }),
    tx.appSetting.count({ where: { branchId, deletedAt: null } }),
    tx.sequenceGenerator.count({ where: { branchId } }),
    tx.printerConfiguration.count({ where: { branchId, deletedAt: null } }),
    tx.barcodeConfiguration.count({ where: { branchId, deletedAt: null } }),
    tx.stockTransfer.count({
      where: {
        OR: [{ sourceBranchId: branchId }, { destinationBranchId: branchId }],
        deletedAt: null,
      },
    }),
  ]);

  const total = counts.reduce((sum, count) => sum + count, 0);

  if (total > 0) {
    throwConflict(
      ErrorCode.BRANCH_IN_USE,
      `Branch is referenced by downstream records: ${branchId}`,
      { id: branchId.toString(), referenceCount: total.toString() },
    );
  }
}
