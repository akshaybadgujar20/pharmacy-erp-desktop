export const OutboxEntityType = {
  SALES_INVOICE: 'SalesInvoice',
  PURCHASE_INVOICE: 'PurchaseInvoice',
  STOCK_MOVEMENT: 'StockMovement',
  STOCK_ADJUSTMENT: 'StockAdjustment',
  PARTY: 'Party',
  PARTY_ROLE: 'PartyRole',
  PARTY_ADDRESS: 'PartyAddress',
  PARTY_CONTACT: 'PartyContact',
  CUSTOMER: 'Customer',
  SUPPLIER: 'Supplier',
  DOCTOR: 'Doctor',
  EMPLOYEE: 'Employee',
  MEDICINE: 'Medicine',
  BATCH: 'Batch',
} as const;

export type OutboxEntityType =
  (typeof OutboxEntityType)[keyof typeof OutboxEntityType];
