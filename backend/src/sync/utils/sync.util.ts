import { HttpStatus } from '@nestjs/common';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import { OutboxSyncStatus } from '../../persistence/outbox/outbox-operation.constants';

export function serializeEpochMs(
  value: bigint | null | undefined,
): string | null {
  return value != null ? new Date(Number(value)).toISOString() : null;
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

export function buildEpochDateRangeFilter(
  dateFrom?: string,
  dateTo?: string,
): { gte?: bigint; lte?: bigint } | undefined {
  const from = dateFrom ? BigInt(dateFrom) : undefined;
  const to = dateTo ? BigInt(dateTo) : undefined;

  if (from == null && to == null) {
    return undefined;
  }

  return {
    ...(from != null ? { gte: from } : {}),
    ...(to != null ? { lte: to } : {}),
  };
}

export function assertOutboxRetryAllowed(syncStatus: string): void {
  if (
    syncStatus !== OutboxSyncStatus.FAILED &&
    syncStatus !== OutboxSyncStatus.PROCESSING
  ) {
    throwConflict(
      ErrorCode.OUTBOX_RETRY_NOT_ALLOWED,
      `Outbox retry is only allowed for FAILED or PROCESSING records (current: ${syncStatus})`,
      { syncStatus },
    );
  }
}
