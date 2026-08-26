import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import { PrismaService } from '../../prisma.service';
import { rethrowAsApplicationException } from '../prisma/prisma-error.mapper';
import type { TxClient } from '../prisma/prisma-tx.type';

const MAX_TRANSACTION_ATTEMPTS = 3;

function isRetryableTransactionError(error: unknown): boolean {
  if (error instanceof ApplicationException && error.retryable) {
    return true;
  }

  if (
    error instanceof ApplicationException &&
    error.code === ErrorCode.ENTITY_VERSION_CONFLICT
  ) {
    return true;
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2034'
  ) {
    return true;
  }

  return (
    error instanceof ApplicationException &&
    error.code === ErrorCode.SEQUENCE_CONFLICT
  );
}

function retryBackoffMs(attempt: number): number {
  return 25 + Math.floor(Math.random() * 50) * attempt;
}

@Injectable()
export class UnitOfWorkService {
  constructor(private readonly prisma: PrismaService) {}

  async run<T>(fn: (tx: TxClient) => Promise<T>): Promise<T> {
    return this.runWithRetry(fn, 0);
  }

  private async runWithRetry<T>(
    fn: (tx: TxClient) => Promise<T>,
    attempt: number,
  ): Promise<T> {
    try {
      return await this.prisma.$transaction(fn);
    } catch (error) {
      if (
        attempt < MAX_TRANSACTION_ATTEMPTS - 1 &&
        isRetryableTransactionError(error)
      ) {
        await new Promise((resolve) =>
          setTimeout(resolve, retryBackoffMs(attempt)),
        );
        return this.runWithRetry(fn, attempt + 1);
      }
      rethrowAsApplicationException(error);
    }
  }
}
