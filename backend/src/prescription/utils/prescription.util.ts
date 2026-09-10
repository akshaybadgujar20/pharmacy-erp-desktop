import { HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import type { TxClient } from '../../persistence/prisma/prisma-tx.type';
import {
  PRESCRIPTION_ACTIVATABLE_STATUSES,
  PRESCRIPTION_CANCELLABLE_STATUSES,
  PRESCRIPTION_EXPIRABLE_STATUSES,
  PrescriptionStatus,
} from '../constants/prescription.constants';

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

export function assertPrescriptionDraft(status: string): void {
  if (status !== PrescriptionStatus.DRAFT) {
    throw new ApplicationException(
      ErrorCode.PRESCRIPTION_NOT_DRAFT,
      'Prescription must be in DRAFT status for this operation',
      HttpStatus.CONFLICT,
      { status },
    );
  }
}

export function assertPrescriptionActivatable(status: string): void {
  if (
    !PRESCRIPTION_ACTIVATABLE_STATUSES.includes(
      status as (typeof PRESCRIPTION_ACTIVATABLE_STATUSES)[number],
    )
  ) {
    throw new ApplicationException(
      ErrorCode.INVALID_DOCUMENT_STATUS,
      `Prescription cannot be activated from status: ${status}`,
      HttpStatus.CONFLICT,
      { status },
    );
  }
}

export function assertPrescriptionCancellable(status: string): void {
  if (
    !PRESCRIPTION_CANCELLABLE_STATUSES.includes(
      status as (typeof PRESCRIPTION_CANCELLABLE_STATUSES)[number],
    )
  ) {
    throw new ApplicationException(
      ErrorCode.INVALID_DOCUMENT_STATUS,
      `Prescription cannot be cancelled from status: ${status}`,
      HttpStatus.CONFLICT,
      { status },
    );
  }
}

export function assertPrescriptionExpirable(status: string): void {
  if (
    !PRESCRIPTION_EXPIRABLE_STATUSES.includes(
      status as (typeof PRESCRIPTION_EXPIRABLE_STATUSES)[number],
    )
  ) {
    throw new ApplicationException(
      ErrorCode.INVALID_DOCUMENT_STATUS,
      `Prescription cannot be expired from status: ${status}`,
      HttpStatus.CONFLICT,
      { status },
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

export async function assertDoctorExists(
  tx: TxClient,
  doctorId: bigint,
): Promise<void> {
  const doctor = await tx.doctor.findFirst({
    where: { id: doctorId, deletedAt: null },
    select: { id: true },
  });

  if (!doctor) {
    throwNotFound(ErrorCode.DOCTOR_NOT_FOUND, `Doctor not found: ${doctorId}`, {
      id: doctorId.toString(),
    });
  }
}

export async function assertMedicineExists(
  tx: TxClient,
  medicineId: bigint,
): Promise<void> {
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
}

export async function assertUnitExists(
  tx: TxClient,
  unitId: bigint,
): Promise<void> {
  const unit = await tx.unitOfMeasure.findFirst({
    where: { id: unitId, deletedAt: null },
    select: { id: true },
  });

  if (!unit) {
    throwNotFound(
      ErrorCode.UNIT_OF_MEASURE_NOT_FOUND,
      `Unit of measure not found: ${unitId}`,
      { id: unitId.toString() },
    );
  }
}

export async function assertPrescriptionExists(
  tx: TxClient,
  prescriptionId: bigint,
  branchId: bigint,
): Promise<{ id: bigint; uuid: string; status: string }> {
  const prescription = await tx.prescription.findFirst({
    where: { id: prescriptionId, branchId, deletedAt: null },
    select: { id: true, uuid: true, status: true },
  });

  if (!prescription) {
    throwNotFound(
      ErrorCode.PRESCRIPTION_NOT_FOUND,
      `Prescription not found: ${prescriptionId}`,
      { id: prescriptionId.toString() },
    );
  }

  return prescription;
}

export async function assertPrescriptionNumberUnique(
  tx: TxClient,
  prescriptionNumber: string,
  excludeId?: bigint,
): Promise<void> {
  const existing = await tx.prescription.findFirst({
    where: {
      prescriptionNumber,
      deletedAt: null,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throwConflict(
      ErrorCode.PRESCRIPTION_NUMBER_ALREADY_EXISTS,
      `Prescription number already exists: ${prescriptionNumber}`,
      { prescriptionNumber },
    );
  }
}

export async function assertPrescriptionNotInUse(
  tx: TxClient,
  prescriptionId: bigint,
): Promise<void> {
  const count = await tx.salesInvoice.count({
    where: { prescriptionId, deletedAt: null },
  });

  if (count > 0) {
    throwConflict(
      ErrorCode.PRESCRIPTION_CONFLICT,
      `Prescription is referenced by sales invoices: ${prescriptionId}`,
      { id: prescriptionId.toString(), salesInvoiceCount: count.toString() },
    );
  }
}
