# Purchasing — Goods Receipt (GRN)

## Purpose

`GoodsReceipt` (GRN — Goods Receipt Note) records physical arrival of stock from a supplier. **Posting a GRN creates or updates `Batch` and increases branch `Stock`** — this is the inventory inbound event for purchasing.

**Database reference:** [GoodsReceipt](../../database/tables/purchase/32_goods_receipt.md) · [GoodsReceiptItem](../../database/tables/purchase/33_goods_receipt_item.md) · [Purchase overview](../../database/tables/purchase/purchase.md)

## Responsibilities

- Capture receipt date, supplier challan, receiver employee
- Link to `PurchaseOrder` when receipt fulfills an order
- On post: create batch metadata (batch number, expiry, MRP, purchase rate) and stock IN
- Update PO line received quantities and PO status

## Scope

### In Scope

- Full and partial receipts against PO lines
- Ad-hoc receipt without PO if policy allows
- Multi-line batch capture on `GoodsReceiptItem`
- Cancellation with reversal movements

### Out of Scope

- Supplier invoice recording (see [purchase-invoice.md](./purchase-invoice.md))
- Sale pricing (`PriceListItem`) — set separately in pricing admin

## Related Entities

- `GoodsReceiptItem` — medicine, received qty, batch number, expiry, rates
- `PurchaseOrder`, `PurchaseOrderItem`
- `Batch` (org-global lot), `Stock` (branch balance), `StockMovement` (IN)
- `Supplier`, `Branch`

## Business Rules

- At least one `GoodsReceiptItem`.
- `goodsReceiptNumber` unique per branch.
- `supplierId` and `branchId` required; `receivedByEmployeeId` required.
- `purchaseOrderId` optional — when present, PO must be in receivable state (`APPROVED` or later, not `CANCELLED`).
- Per line on **post**:
  - Resolve or **create** `Batch` for `(medicineId, batchNumber)` with `purchaseRate`, `mrp`, expiry, manufacture date.
  - Upsert `Stock` for `(branchId, batchId)` — increase `availableQuantity`.
  - Create IN `StockMovement` referencing GRN line.
  - Increment `PurchaseOrderItem.receivedQuantity` when PO-linked.
- Posted GRN is read-only; cancel via reversal IN/OUT pair policy.
- GRN `status`: `DRAFT`, `POSTED`, `CANCELLED`.
- Expiry date required for pharmaceutical batches; reject post if missing.

## Domain Events

- `GoodsReceiptPosted` — primary inventory event
- `BatchCreated` / `BatchUpdated` (internal)
- `PurchaseOrderPartiallyReceived` / `PurchaseOrderCompleted` — PO rollup

## State Model

| status | Stock |
|--------|-------|
| `DRAFT` | No impact |
| `POSTED` | Batch + Stock IN applied |
| `CANCELLED` | Reversal if was posted |

## Integrations

- **Inventory ledger:** Same patterns as sales OUT but direction IN
- **PO fulfillment:** Recompute PO status after post
- **Purchase invoice:** GRN lines available for qty/cost match
- **Outbox:** `GoodsReceiptPosted` with line batch UUIDs

## Security

- GRN post typically restricted beyond PO create — future `PURCHASE:GOODS_RECEIPT:POST`.
- Receiver must belong to receiving branch.

## Performance

- Bulk post: insert all batches/stock/movements in one transaction.
- Index GRN items by `goodsReceiptId` and PO items by `purchaseOrderId`.

## Future

- Barcode scan intake with duplicate batch detection
- Cold chain temperature capture on receipt
- QC hold status before stock available for sale
