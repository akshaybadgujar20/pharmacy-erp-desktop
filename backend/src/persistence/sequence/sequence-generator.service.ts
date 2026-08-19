import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import type { TxClient } from '../prisma/prisma-tx.type';
import { formatDocumentNumber } from './document-number.formatter';
import { DocumentType, ResetPolicy } from './document-type.constants';

export interface SequenceNextInput {
  companyId: bigint;
  branchId: bigint;
  documentType: DocumentType | string;
  branchCode?: string;
}

export interface SequenceNextResult {
  sequenceValue: bigint;
  documentNumber: string;
}

function shouldResetSequence(resetPolicy: string, lastUpdatedAt: Date, now: Date): boolean {
  switch (resetPolicy) {
    case ResetPolicy.NEVER:
      return false;
    case ResetPolicy.YEARLY:
      return lastUpdatedAt.getFullYear() !== now.getFullYear();
    case ResetPolicy.MONTHLY:
      return (
        lastUpdatedAt.getFullYear() !== now.getFullYear() ||
        lastUpdatedAt.getMonth() !== now.getMonth()
      );
    default:
      return false;
  }
}

@Injectable()
export class SequenceGeneratorService {
  async next(tx: TxClient, input: SequenceNextInput): Promise<SequenceNextResult> {
    const row = await tx.sequenceGenerator.findFirst({
      where: {
        companyId: input.companyId,
        branchId: input.branchId,
        documentType: input.documentType,
        isActive: true,
      },
    });

    if (!row) {
      throw new ApplicationException(
        ErrorCode.SEQUENCE_NOT_FOUND,
        `No active sequence for ${input.documentType}`,
        HttpStatus.NOT_FOUND,
        input,
      );
    }

    const now = new Date();
    const reset = shouldResetSequence(row.resetPolicy, row.updatedAt, now);
    const increment = BigInt(row.incrementBy);
    const nextValue = reset ? increment : row.currentNumber + increment;

    const updated = await tx.sequenceGenerator.updateMany({
      where: { id: row.id, version: row.version },
      data: {
        currentNumber: nextValue,
        version: { increment: 1 },
        updatedAt: now,
      },
    });

    if (updated.count !== 1) {
      throw new ApplicationException(
        ErrorCode.SEQUENCE_CONFLICT,
        'Sequence row was modified concurrently',
        HttpStatus.CONFLICT,
        { sequenceId: row.id },
      );
    }

    const branchCode = input.branchCode ?? '';
    const documentNumber = formatDocumentNumber({
      prefix: row.prefix,
      suffix: row.suffix,
      paddingLength: row.paddingLength,
      format: row.format,
      sequenceValue: nextValue,
      branchCode,
    });

    return { sequenceValue: nextValue, documentNumber };
  }
}
