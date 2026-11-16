import type { SyncCloudPullRecord } from '../cloud/sync-cloud.contract';

const PRIORITY: Record<string, number> = {
  Company: 10,
  Branch: 20,
  Party: 30,
  Customer: 40,
  Supplier: 40,
  Medicine: 50,
  Batch: 60,
  PurchaseOrder: 70,
  GoodsReceipt: 71,
  PurchaseInvoice: 72,
  SalesInvoice: 73,
  Prescription: 74,
  PurchaseOrderItem: 80,
  GoodsReceiptItem: 81,
  PurchaseInvoiceItem: 82,
  SalesInvoiceItem: 83,
  PrescriptionItem: 84,
  StockMovement: 90,
  Stock: 91,
};

export function sortPullRecords(
  records: SyncCloudPullRecord[],
): SyncCloudPullRecord[] {
  return [...records].sort((a, b) => {
    const pa = PRIORITY[a.entityType] ?? 100;
    const pb = PRIORITY[b.entityType] ?? 100;
    if (pa !== pb) {
      return pa - pb;
    }
    return a.entityUuid.localeCompare(b.entityUuid);
  });
}
