export const OutboxEntityType = {
  SALES_INVOICE: 'SalesInvoice',
  PURCHASE_ORDER: 'PurchaseOrder',
  GOODS_RECEIPT: 'GoodsReceipt',
  PURCHASE_INVOICE: 'PurchaseInvoice',
  PURCHASE_RETURN: 'PurchaseReturn',
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
  STOCK: 'Stock',
  STOCK_TRANSFER: 'StockTransfer',
  STOCK_TAKE: 'StockTake',
} as const;

export type OutboxEntityType =
  (typeof OutboxEntityType)[keyof typeof OutboxEntityType];
