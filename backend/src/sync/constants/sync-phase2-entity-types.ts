import { OutboxEntityType } from '../../persistence/outbox/entity-type.constants';

export const SYNC_PHASE2_ENTITY_TYPES: readonly string[] = [
  OutboxEntityType.PRICE_LIST,
  OutboxEntityType.PRICE_LIST_ITEM,
  OutboxEntityType.TAX,
  OutboxEntityType.DISCOUNT_RULE,
  OutboxEntityType.PRESCRIPTION,
  OutboxEntityType.PRESCRIPTION_ITEM,
  OutboxEntityType.PURCHASE_ORDER,
  OutboxEntityType.GOODS_RECEIPT,
  OutboxEntityType.PURCHASE_INVOICE,
  OutboxEntityType.PURCHASE_RETURN,
  OutboxEntityType.SALES_INVOICE,
  OutboxEntityType.SALES_PAYMENT,
  OutboxEntityType.SALES_RETURN,
  OutboxEntityType.BATCH,
  OutboxEntityType.STOCK,
  OutboxEntityType.STOCK_MOVEMENT,
  OutboxEntityType.STOCK_ADJUSTMENT,
  OutboxEntityType.STOCK_TRANSFER,
  OutboxEntityType.STOCK_TAKE,
  OutboxEntityType.LEDGER,
  OutboxEntityType.LEDGER_ENTRY,
  OutboxEntityType.PAYMENT,
  OutboxEntityType.RECEIPT,
  OutboxEntityType.LOYALTY_PROGRAM,
  OutboxEntityType.LOYALTY_TRANSACTION,
  OutboxEntityType.CUSTOMER_LOYALTY_MEMBERSHIP,
  // Pull-only line rows (cloud may send separately from headers)
  'PurchaseOrderItem',
  'GoodsReceiptItem',
  'PurchaseInvoiceItem',
  'PurchaseReturnItem',
  'SalesInvoiceItem',
  'SalesReturnItem',
  'StockAdjustmentItem',
  'StockTransferItem',
  'StockTakeItem',
] as const;

export function isSyncPhase2Enabled(): boolean {
  return process.env.SYNC_PHASE2_ENABLED === 'true';
}
