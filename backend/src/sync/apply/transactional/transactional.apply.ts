import { OutboxEntityType } from '../../../persistence/outbox/entity-type.constants';
import type { TxClient } from '../../../persistence/prisma/prisma-tx.type';
import type { SyncCloudPullRecord } from '../../cloud/sync-cloud.contract';
import { SyncApplyError } from '../sync-apply.util';
import { applyFinanceTransactional } from './transactional-finance.apply';
import { applyInventoryTransactional } from './transactional-inventory.apply';
import { applyLoyaltyTransactional } from './transactional-loyalty.apply';
import { applyPrescriptionTransactional } from './transactional-prescription.apply';
import { applyPricingTransactional } from './transactional-pricing.apply';
import { applyPurchaseTransactional } from './transactional-purchase.apply';
import { applySalesTransactional } from './transactional-sales.apply';

const PRICING = new Set<string>([
  OutboxEntityType.TAX,
  OutboxEntityType.PRICE_LIST,
  OutboxEntityType.PRICE_LIST_ITEM,
  OutboxEntityType.DISCOUNT_RULE,
]);

const PRESCRIPTION = new Set<string>([
  OutboxEntityType.PRESCRIPTION,
  OutboxEntityType.PRESCRIPTION_ITEM,
]);

const PURCHASE = new Set<string>([
  OutboxEntityType.PURCHASE_ORDER,
  'PurchaseOrderItem',
  OutboxEntityType.GOODS_RECEIPT,
  'GoodsReceiptItem',
  OutboxEntityType.PURCHASE_INVOICE,
  'PurchaseInvoiceItem',
  OutboxEntityType.PURCHASE_RETURN,
  'PurchaseReturnItem',
]);

const SALES = new Set<string>([
  OutboxEntityType.SALES_INVOICE,
  'SalesInvoiceItem',
  OutboxEntityType.SALES_PAYMENT,
  OutboxEntityType.SALES_RETURN,
  'SalesReturnItem',
]);

const INVENTORY = new Set<string>([
  OutboxEntityType.BATCH,
  OutboxEntityType.STOCK,
  OutboxEntityType.STOCK_MOVEMENT,
  OutboxEntityType.STOCK_ADJUSTMENT,
  OutboxEntityType.STOCK_TRANSFER,
  OutboxEntityType.STOCK_TAKE,
]);

const FINANCE = new Set<string>([
  OutboxEntityType.LEDGER,
  OutboxEntityType.LEDGER_ENTRY,
  OutboxEntityType.PAYMENT,
  OutboxEntityType.RECEIPT,
]);

const LOYALTY = new Set<string>([
  OutboxEntityType.LOYALTY_PROGRAM,
  OutboxEntityType.LOYALTY_TRANSACTION,
  OutboxEntityType.CUSTOMER_LOYALTY_MEMBERSHIP,
]);

export async function applyTransactionalRecord(
  tx: TxClient,
  record: SyncCloudPullRecord,
): Promise<void> {
  if (PRICING.has(record.entityType)) {
    await applyPricingTransactional(tx, record);
    return;
  }
  if (PRESCRIPTION.has(record.entityType)) {
    await applyPrescriptionTransactional(tx, record);
    return;
  }
  if (PURCHASE.has(record.entityType)) {
    await applyPurchaseTransactional(tx, record);
    return;
  }
  if (SALES.has(record.entityType)) {
    await applySalesTransactional(tx, record);
    return;
  }
  if (INVENTORY.has(record.entityType)) {
    await applyInventoryTransactional(tx, record);
    return;
  }
  if (FINANCE.has(record.entityType)) {
    await applyFinanceTransactional(tx, record);
    return;
  }
  if (LOYALTY.has(record.entityType)) {
    await applyLoyaltyTransactional(tx, record);
    return;
  }
  throw new SyncApplyError(
    `Transactional apply not implemented for ${record.entityType}`,
  );
}
