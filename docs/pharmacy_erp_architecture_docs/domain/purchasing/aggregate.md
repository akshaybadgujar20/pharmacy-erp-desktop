# Purchasing — Aggregate Model

## Purpose

Define aggregate boundaries for procurement documents. **PurchaseOrder** is the fulfillment anchor; **GoodsReceipt** is the inventory mutation boundary (creates `Batch` + `Stock`). **PurchaseInvoice** and **PurchaseReturn** are financially significant aggregates linked to receipts and stock.

**Database reference:** [Purchase overview](../../database/tables/purchase/purchase.md)

## Responsibilities

- Identify aggregate roots and consistency boundaries
- Specify which operations must be atomic with inventory
- Map tables to sync identity (`uuid`)

## Scope

### In Scope

- Roots: `PurchaseOrder`, `GoodsReceipt`, `PurchaseInvoice`, `PurchaseReturn`
- Child item tables for each header
- PO ↔ GRN linkage for received quantity rollups

### Out of Scope

- `Batch` / `Stock` aggregates (Inventory domain) — updated via domain services
- Supplier master (Supplier domain)

## Related Entities

```
PurchaseOrder (root)
 ├── PurchaseOrderItem[*]
 └── GoodsReceipt[*] (separate root, FK optional/required)
      └── GoodsReceiptItem[*] → creates Batch + Stock

PurchaseInvoice (root)
 └── PurchaseInvoiceItem[*]

PurchaseReturn (root)
 └── PurchaseReturnItem[*]
```

| Aggregate | Inventory impact |
|-----------|------------------|
| `PurchaseOrder` | None |
| `GoodsReceipt` | **IN** — creates/updates Batch, Stock |
| `PurchaseInvoice` | None (cost accounting only) |
| `PurchaseReturn` | **OUT** from branch stock |

## Business Rules

- PO lines track `orderedQuantity` and cumulative `receivedQuantity` updated only from posted GRNs.
- GRN post is the **only** purchasing path that creates new `Batch` rows at receipt (org-global batch key: medicine + batch number).
- Stock balance is always `(branchId, batchId)` — GRN specifies receiving branch.
- Invoice lines may reference GRN lines for matching but posting invoice does not double-count stock.
- Terminal PO states (`COMPLETED`, `FORCE_CLOSED`, `CANCELLED`) block new GRNs.

## Domain Events

- Raised from roots: `PurchaseOrderApproved`, `GoodsReceiptPosted`, `PurchaseInvoicePosted`, `PurchaseReturnApproved`.
- PO status rollup events derived after GRN post.

## State Model

- PO: `DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `SENT_TO_SUPPLIER`, `PARTIALLY_RECEIVED`, `COMPLETED`, `FORCE_CLOSED`, `CANCELLED`
- GRN: `DRAFT`, `POSTED`, `CANCELLED`
- Purchase invoice / return: document-specific statuses per table specs

## Integrations

- **UnitOfWork:** GRN post and purchase return approve include inventory writes.
- **SequenceGenerator:** Per-branch numbers for PO, GRN, PI, PR.

## Security

- Aggregates scoped to `branchId`; supplier must be active and authorized for branch purchases.

## Performance

- When posting multi-line GRN, batch-create Batch/Stock/Movement rows in one transaction.
- PO detail loads items + sum(receivedQty) via grouped query.

## Future

- Single aggregate spanning PO+GRN for simplified mobile UX (still two tables)
- Consignment stock without PO (policy exception aggregate)
