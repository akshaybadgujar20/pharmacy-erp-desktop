import { HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';

export function mapPrismaError(error: unknown): ApplicationException | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return null;
  }

  switch (error.code) {
    case 'P2002':
      if (error.meta?.target && String(error.meta.target).includes('operation_id')) {
        return new ApplicationException(
          ErrorCode.OUTBOX_DUPLICATE_OPERATION,
          'Duplicate outbox operationId',
          HttpStatus.CONFLICT,
        );
      }
      return new ApplicationException(
        ErrorCode.CONFLICT,
        'Unique constraint violation',
        HttpStatus.CONFLICT,
        error.meta,
      );
    case 'P2003':
      return new ApplicationException(
        ErrorCode.TRANSACTION_FAILED,
        'Foreign key constraint violation',
        HttpStatus.BAD_REQUEST,
        error.meta,
      );
    case 'P2034':
      return new ApplicationException(
        ErrorCode.SEQUENCE_CONFLICT,
        'Write conflict — retry transaction',
        HttpStatus.CONFLICT,
      );
    default:
      return null;
  }
}

export function rethrowAsApplicationException(error: unknown): never {
  const mapped = mapPrismaError(error);
  if (mapped) throw mapped;
  throw error;
}
