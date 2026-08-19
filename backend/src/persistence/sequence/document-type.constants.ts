export const DocumentType = {
  SALES_INVOICE: 'SALES_INVOICE',
  GOODS_RECEIPT: 'GOODS_RECEIPT',
  PURCHASE_ORDER: 'PURCHASE_ORDER',
  STOCK_MOVEMENT: 'STOCK_MOVEMENT',
  STOCK_ADJUSTMENT: 'STOCK_ADJUSTMENT',
  STOCK_TRANSFER: 'STOCK_TRANSFER',
} as const;

export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];

export const ResetPolicy = {
  NEVER: 'NEVER',
  YEARLY: 'YEARLY',
  MONTHLY: 'MONTHLY',
  DAILY: 'DAILY',
} as const;
