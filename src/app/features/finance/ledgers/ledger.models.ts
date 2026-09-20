export interface Ledger {
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
  version: string;
}

export interface CreateLedgerRequest {
  ledgerCode: string;
  ledgerName: string;
  ledgerType: string;
  normalBalance: string;
  parentLedgerId?: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateLedgerRequest {
  version: string;
  ledgerCode?: string;
  ledgerName?: string;
  ledgerType?: string;
  normalBalance?: string;
  parentLedgerId?: string;
  description?: string;
  isActive?: boolean;
}
