import type { Prisma } from '@prisma/client';

export interface JournalLineInput {
  ledgerId: bigint;
  debitAmount: Prisma.Decimal | number | string;
  creditAmount: Prisma.Decimal | number | string;
  narration?: string;
}

export interface PostVoucherInput {
  companyId: bigint;
  voucherType: string;
  voucherId: bigint;
  voucherNumber: string;
  transactionDate: bigint;
  lines: JournalLineInput[];
  createdBy?: bigint;
}

export interface ReverseVoucherInput {
  companyId: bigint;
  originalVoucherType: string;
  originalVoucherId: bigint;
  reversalVoucherType: string;
  reversalVoucherId: bigint;
  reversalVoucherNumber: string;
  transactionDate: bigint;
  createdBy?: bigint;
  narration?: string;
}
