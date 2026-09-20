import { Ledger } from '@prisma/client';
import { serializeBigInt } from '../utils/finance.util';

export interface LedgerResponse {
  id: string;
  uuid: string;
  ledgerCode: string;
  ledgerName: string;
  ledgerType: string;
  parentLedgerId: string | null;
  normalBalance: string;
  isSystem: boolean;
  isActive: boolean;
  description: string | null;
  createdAt: bigint;
  updatedAt: bigint;
  deletedAt: bigint | null;
  version: string;
}

export function toLedgerResponse(ledger: Ledger): LedgerResponse {
  return {
    id: ledger.id.toString(),
    uuid: ledger.uuid,
    ledgerCode: ledger.ledgerCode,
    ledgerName: ledger.ledgerName,
    ledgerType: ledger.ledgerType,
    parentLedgerId: serializeBigInt(ledger.parentLedgerId),
    normalBalance: ledger.normalBalance,
    isSystem: ledger.isSystem,
    isActive: ledger.isActive,
    description: ledger.description,
    createdAt: ledger.createdAt,
    updatedAt: ledger.updatedAt,
    deletedAt: ledger.deletedAt,
    version: ledger.version.toString(),
  };
}
