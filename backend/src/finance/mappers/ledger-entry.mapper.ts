import { LedgerEntry } from '@prisma/client';
import { serializeBigInt, serializeDecimal } from '../utils/finance.util';

export interface LedgerEntryResponse {
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
  createdAt: bigint;
  updatedAt: bigint;
  deletedAt: bigint | null;
  version: number;
}

export function toLedgerEntryResponse(entry: LedgerEntry): LedgerEntryResponse {
  return {
    id: entry.id.toString(),
    uuid: entry.uuid,
    ledgerId: entry.ledgerId.toString(),
    voucherType: entry.voucherType,
    voucherId: entry.voucherId.toString(),
    voucherNumber: entry.voucherNumber,
    transactionDate: entry.transactionDate.toString(),
    debitAmount: serializeDecimal(entry.debitAmount),
    creditAmount: serializeDecimal(entry.creditAmount),
    runningBalance: serializeDecimal(entry.runningBalance),
    narration: entry.narration,
    isPosted: entry.isPosted,
    createdBy: serializeBigInt(entry.createdBy),
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    deletedAt: entry.deletedAt,
    version: entry.version,
  };
}
