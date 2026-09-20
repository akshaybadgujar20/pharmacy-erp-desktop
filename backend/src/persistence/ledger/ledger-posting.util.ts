import { HttpStatus } from '@nestjs/common';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import type { TxClient } from '../prisma/prisma-tx.type';

export async function assertTransactionDateInOpenYear(
  tx: TxClient,
  companyId: bigint,
  transactionDate: bigint,
): Promise<void> {
  await assertFinancialYearOpenForPosting(tx, companyId, transactionDate);
}

export async function assertFinancialYearOpenForPosting(
  tx: TxClient,
  companyId: bigint,
  transactionDate: bigint,
): Promise<void> {
  const financialYear = await tx.financialYear.findFirst({
    where: {
      companyId,
      deletedAt: null,
      startDate: { lte: transactionDate },
      endDate: { gte: transactionDate },
    },
  });

  if (!financialYear) {
    throw new ApplicationException(
      ErrorCode.FINANCIAL_YEAR_CLOSED,
      'No financial year covers the transaction date',
      HttpStatus.CONFLICT,
      {
        companyId: companyId.toString(),
        transactionDate: transactionDate.toString(),
      },
    );
  }

  if (financialYear.status !== 'OPEN') {
    throw new ApplicationException(
      ErrorCode.FINANCIAL_YEAR_CLOSED,
      'Financial year is closed for posting',
      HttpStatus.CONFLICT,
      {
        transactionDate: transactionDate.toString(),
        financialYearCode: financialYear.financialYearCode,
        status: financialYear.status,
      },
    );
  }
}
