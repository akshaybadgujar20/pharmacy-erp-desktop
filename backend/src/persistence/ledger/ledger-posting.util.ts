import { HttpStatus } from '@nestjs/common';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import type { TxClient } from '../prisma/prisma-tx.type';

export async function assertTransactionDateInOpenYear(
  tx: TxClient,
  companyId: bigint,
  transactionDate: bigint,
): Promise<void> {
  const financialYear = await tx.financialYear.findFirst({
    where: {
      companyId,
      isCurrent: true,
      status: 'OPEN',
      deletedAt: null,
    },
  });

  if (!financialYear) {
    throw new ApplicationException(
      ErrorCode.FINANCIAL_YEAR_CLOSED,
      'No open financial year configured for company',
      HttpStatus.CONFLICT,
      { companyId: companyId.toString() },
    );
  }

  if (
    transactionDate < financialYear.startDate ||
    transactionDate > financialYear.endDate
  ) {
    throw new ApplicationException(
      ErrorCode.FINANCIAL_YEAR_CLOSED,
      'Transaction date is outside the open financial year',
      HttpStatus.CONFLICT,
      {
        transactionDate: transactionDate.toString(),
        financialYearCode: financialYear.financialYearCode,
      },
    );
  }
}
