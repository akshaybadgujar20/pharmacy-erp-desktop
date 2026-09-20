export interface LedgerEntry {
  id: string;
  uuid: string;
  ledgerId: string;
  voucherType: string;
  voucherId: string;
  voucherNumber: string;
  transactionDate: string;
  debitAmount: number | null;
  creditAmount: number | null;
  runningBalance: number | null;
  narration: string | null;
  isPosted: boolean;
  createdBy: string | null;
  version: string;
}
