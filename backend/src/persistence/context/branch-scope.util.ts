import { HttpStatus } from '@nestjs/common';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import type { TxClient } from '../prisma/prisma-tx.type';

export function buildCompanyBranchFilter(branchId: bigint): {
  OR: Array<{ branchId: bigint | null }>;
} {
  return {
    OR: [{ branchId }, { branchId: null }],
  };
}

export async function assertBranchInCompany(
  tx: TxClient,
  companyId: bigint,
  branchId: bigint,
): Promise<{ id: bigint; uuid: string }> {
  const branch = await tx.branch.findFirst({
    where: { id: branchId, companyId, deletedAt: null },
    select: { id: true, uuid: true },
  });

  if (!branch) {
    throw new ApplicationException(
      ErrorCode.BRANCH_NOT_FOUND,
      `Branch not found: ${branchId}`,
      HttpStatus.NOT_FOUND,
      { id: branchId.toString() },
    );
  }

  return branch;
}

export function assertJwtBranchOrCompanyWide(
  branchId: bigint | undefined | null,
  jwtBranchId: bigint,
  resourceLabel: string,
): void {
  if (branchId != null && branchId !== jwtBranchId) {
    throw new ApplicationException(
      ErrorCode.FORBIDDEN,
      `${resourceLabel} branch must match JWT branch or be company-wide`,
      HttpStatus.FORBIDDEN,
      { branchId: branchId.toString() },
    );
  }
}
