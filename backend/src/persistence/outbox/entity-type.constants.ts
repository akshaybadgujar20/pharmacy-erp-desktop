export const OutboxEntityType = {
  SALES_INVOICE: 'SalesInvoice',
  PURCHASE_INVOICE: 'PurchaseInvoice',
  STOCK_MOVEMENT: 'StockMovement',
  STOCK_ADJUSTMENT: 'StockAdjustment',
  CUSTOMER: 'Customer',
  MEDICINE: 'Medicine',
  BATCH: 'Batch',
} as const;

export type OutboxEntityType =
  (typeof OutboxEntityType)[keyof typeof OutboxEntityType];
