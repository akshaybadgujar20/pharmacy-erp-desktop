import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import { PrismaService } from '../../prisma.service';
import { rethrowAsApplicationException } from '../prisma/prisma-error.mapper';
import type { TxClient } from '../prisma/prisma-tx.type';

function isRetryableTransactionError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
    return true;
  }
  return (
    error instanceof ApplicationException &&
    error.code === ErrorCode.SEQUENCE_CONFLICT &&
    error.message.includes('concurrently')
  );
}

@Injectable()
export class UnitOfWorkService {
  constructor(private readonly prisma: PrismaService) {}

  async run<T>(fn: (tx: TxClient) => Promise<T>): Promise<T> {
    return this.runOnce(fn);
  }

  private async runOnce<T>(fn: (tx: TxClient) => Promise<T>, attempt = 0): Promise<T> {
    try {
      return await this.prisma.$transaction(fn);
    } catch (error) {
      if (attempt === 0 && isRetryableTransactionError(error)) {
        return this.runOnce(fn, attempt + 1);
      }
      rethrowAsApplicationException(error);
    }
  }
}
