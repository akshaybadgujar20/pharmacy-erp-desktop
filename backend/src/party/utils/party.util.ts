import { HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import type { TxClient } from '../../persistence/prisma/prisma-tx.type';

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

export function serializeDate(value: Date | null | undefined): string | null {
  return value != null ? value.toISOString() : null;
}

export async function assertPartyExists(
  tx: TxClient,
  partyId: bigint,
): Promise<{ id: bigint; uuid: string }> {
  const party = await tx.party.findFirst({
    where: { id: partyId, deletedAt: null },
    select: { id: true, uuid: true },
  });

  if (!party) {
    throw new ApplicationException(
      ErrorCode.PARTY_NOT_FOUND,
      `Party not found: ${partyId}`,
      HttpStatus.NOT_FOUND,
      { partyId: partyId.toString() },
    );
  }

  return party;
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
  message: string,
  details?: Record<string, string>,
  code = ErrorCode.CONFLICT,
): never {
  throw new ApplicationException(code, message, HttpStatus.CONFLICT, details);
}

export async function ensurePartyRole(
  tx: TxClient,
  partyId: bigint,
  roleType: string,
): Promise<void> {
  const existing = await tx.partyRole.findFirst({
    where: { partyId, roleType, deletedAt: null },
  });

  if (existing) {
    return;
  }

  await tx.partyRole.create({
    data: {
      partyId,
      roleType,
      isActive: true,
      createdAt: BigInt(Date.now()),
      updatedAt: BigInt(Date.now()),
    },
  });
}

export function assertNonNegativeDecimal(
  value: string | undefined,
  fieldName: string,
): void {
  if (value === undefined) {
    return;
  }

  if (!/^\d+(\.\d{1,2})?$/.test(value)) {
    throw new ApplicationException(
      ErrorCode.VALIDATION_ERROR,
      `${fieldName} must be a valid decimal`,
      HttpStatus.BAD_REQUEST,
      { field: fieldName, value },
    );
  }

  if (Number(value) < 0) {
    throw new ApplicationException(
      ErrorCode.VALIDATION_ERROR,
      `${fieldName} cannot be negative`,
      HttpStatus.BAD_REQUEST,
      { field: fieldName, value },
    );
  }
}

export async function assertUniqueBusinessCode(
  tx: TxClient,
  model: 'customer' | 'supplier' | 'doctor' | 'employee',
  field: string,
  value: string,
  label: string,
): Promise<void> {
  const delegate = tx[model] as unknown as {
    findFirst: (args: {
      where: Record<string, unknown>;
    }) => Promise<{ id: bigint; deletedAt: Date | null } | null>;
  };

  const existing = await delegate.findFirst({
    where: { [field]: value },
  });

  if (existing && !existing.deletedAt) {
    throwConflict(`${label} already exists: ${value}`, {
      [field]: value,
    });
  }
}

export const activePartyFilter = { party: { deletedAt: null } };
