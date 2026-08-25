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
): string | null {
  return value != null ? value.toString() : null;
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
  notFoundCode: string,
  notFoundMessage: string,
  id: bigint,
): void {
  if (result.count === 0) {
    throw new ApplicationException(
      ErrorCode.ENTITY_VERSION_CONFLICT,
      notFoundMessage,
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
): never {
  throw new ApplicationException(
    ErrorCode.CONFLICT,
    message,
    HttpStatus.CONFLICT,
    details,
  );
}
