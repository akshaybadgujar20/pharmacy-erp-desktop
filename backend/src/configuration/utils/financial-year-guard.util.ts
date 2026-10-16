import { HttpStatus } from '@nestjs/common';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import { assertTransactionDateInOpenYear } from '../../persistence/ledger/ledger-posting.util';
import type { TxClient } from '../../persistence/prisma/prisma-tx.type';

/** Canonical FY guard for document business dates (draft save, post, workflow). */
export async function assertDocumentDateInOpenFinancialYear(
  tx: TxClient,
  companyId: bigint,
  documentDate: bigint,
): Promise<void> {
  await assertTransactionDateInOpenYear(tx, companyId, documentDate);
}

/** Resolves company from branch and asserts the document date falls in an OPEN financial year. */
export async function assertOpenFinancialYearForBranchDocument(
  tx: TxClient,
  branchId: bigint,
  documentDate: bigint,
): Promise<void> {
  const branch = await tx.branch.findFirst({
    where: { id: branchId, deletedAt: null },
    select: { companyId: true },
  });

  if (!branch) {
    throw new ApplicationException(
      ErrorCode.BRANCH_NOT_FOUND,
      `Branch not found: ${branchId}`,
      HttpStatus.NOT_FOUND,
      { branchId: branchId.toString() },
    );
  }

  await assertDocumentDateInOpenFinancialYear(
    tx,
    branch.companyId,
    documentDate,
  );
}
