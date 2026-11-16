export const DOCUMENT_TYPE_OPTIONS = [
  { label: 'Sales Invoice', value: 'SALES_INVOICE' },
  { label: 'Sales Payment', value: 'SALES_PAYMENT' },
  { label: 'Sales Return', value: 'SALES_RETURN' },
  { label: 'Goods Receipt', value: 'GOODS_RECEIPT' },
  { label: 'Purchase Order', value: 'PURCHASE_ORDER' },
  { label: 'Stock Movement', value: 'STOCK_MOVEMENT' },
  { label: 'Stock Adjustment', value: 'STOCK_ADJUSTMENT' },
  { label: 'Stock Transfer', value: 'STOCK_TRANSFER' },
  { label: 'Stock Take', value: 'STOCK_TAKE' },
  { label: 'Purchase Invoice', value: 'PURCHASE_INVOICE' },
  { label: 'Purchase Return', value: 'PURCHASE_RETURN' },
  { label: 'Payment', value: 'PAYMENT' },
  { label: 'Receipt', value: 'RECEIPT' },
];

export const RESET_POLICY_OPTIONS = [
  { label: 'Never', value: 'NEVER' },
  { label: 'Yearly', value: 'YEARLY' },
  { label: 'Monthly', value: 'MONTHLY' },
  { label: 'Daily', value: 'DAILY' },
];

export interface SequenceGenerator {
  id: string;
  uuid: string;
  companyId: string;
  branchId: string | null;
  documentType: string;
  prefix: string | null;
  suffix: string | null;
  currentNumber: string;
  incrementBy: number;
  paddingLength: number;
  resetPolicy: string;
  format: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface CreateSequenceGeneratorRequest {
  branchId?: string;
  documentType: string;
  prefix?: string;
  suffix?: string;
  currentNumber: string;
  incrementBy?: number;
  paddingLength?: number;
  resetPolicy: string;
  format?: string;
  isActive?: boolean;
}

export interface UpdateSequenceGeneratorRequest {
  version: number;
  branchId?: string;
  documentType?: string;
  prefix?: string;
  suffix?: string;
  currentNumber?: string;
  incrementBy?: number;
  paddingLength?: number;
  resetPolicy?: string;
  format?: string;
  isActive?: boolean;
}
