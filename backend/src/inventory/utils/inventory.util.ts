import { HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import type { TxClient } from '../../persistence/prisma/prisma-tx.type';
import { StockAdjustmentStatus } from '../constants/inventory.constants';

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

export function assertDraftStatus(status: string, entityLabel: string): void {
  if (status !== StockAdjustmentStatus.DRAFT) {
    throw new ApplicationException(
      ErrorCode.INVALID_DOCUMENT_STATUS,
      `${entityLabel} can only be modified while in DRAFT status`,
      HttpStatus.CONFLICT,
      { status },
    );
  }
}

export async function assertBatchExists(
  tx: TxClient,
  batchId: bigint,
): Promise<{ id: bigint; medicineId: bigint; purchaseRate: Prisma.Decimal }> {
  const batch = await tx.batch.findFirst({
    where: { id: batchId, deletedAt: null },
    select: { id: true, medicineId: true, purchaseRate: true },
  });

  if (!batch) {
    throw new ApplicationException(
      ErrorCode.BATCH_NOT_FOUND,
      `Batch not found: ${batchId}`,
      HttpStatus.NOT_FOUND,
      { batchId: batchId.toString() },
    );
  }

  return batch;
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

export function computeVarianceType(varianceQuantity: Prisma.Decimal): string {
  if (varianceQuantity.gt(0)) {
    return 'SURPLUS';
  }
  if (varianceQuantity.lt(0)) {
    return 'DEFICIT';
  }
  return 'MATCHED';
}
