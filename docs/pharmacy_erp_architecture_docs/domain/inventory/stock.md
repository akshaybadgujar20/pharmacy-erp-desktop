# Inventory — Stock

## Purpose

**Stock** holds the current quantity buckets for a **Batch at a Branch**. It is the fast-read balance table; every change is explained by an immutable **StockMovement** row. Uniqueness is `(branchId, batchId)` — one balance record per lot per location.

**Schema reference:** [24_stock](../../database/tables/inventory/24_stock.md) · [Inventory overview](../../database/tables/inventory/inventory.md)

---

## Responsibilities

- Store **availableQuantity** — saleable units at the branch.
- Track **reservedQuantity** — held for pending sales or dispatch (see [reservation.md](./reservation.md)).
- Track **damagedQuantity**, **expiredQuantity**, **inTransitQuantity** — non-saleable or pipeline buckets.
- Record **lastMovementAt** for staleness and audit.
- Enforce optimistic concurrency via **version** on every update.

---

## Scope

### In Scope

- Balance read APIs per branch, medicine (via Batch join), batch.
- Availability check: `availableQuantity - reservedQuantity` (effective free stock).
- Ledger-driven updates only through `InventoryLedgerService.applyMovement`.
- Reserved / in-transit bucket updates (transfer and reservation workflows).

### Out of Scope

- Direct SQL or service updates to quantity columns outside ledger/reservation paths.
- Historical transaction detail — use StockMovement.
- Org-wide quantity rollup — aggregate Stock rows across branches in reporting layer.

---

## Related Entities

| Entity | Relationship |
|--------|--------------|
| Batch | Stock.batchId → Batch (org-global lot) |
| Branch | Stock.branchId → Branch |
| StockMovement | Movements update Stock for same `(branchId, batchId)` |
| StockTransfer | Increments source inTransit / decrements on receive |
| Sales | OUT reduces availableQuantity |

---

## Business Rules

1. **Unique (branchId, batchId).** At most one Stock row per lot per branch.
2. **availableQuantity** must not go negative on OUT unless branch policy allows negative inventory (default: reject with `STOCK_INSUFFICIENT`).
3. **All quantity changes** require a StockMovement except reserved-bucket-only updates (reservation service must still audit).
4. **reservedQuantity ≤ availableQuantity** when reservation model is strict (recommended default).
5. **inTransitQuantity** increases when transfer dispatched from source; decreases when destination receives IN movement.
6. **damagedQuantity / expiredQuantity** updated via adjustment workflows, not sale OUT.
7. **First IN at branch** creates Stock row if missing (ledger create path).
8. **version** increment on every balance mutation; concurrent update throws `SEQUENCE_CONFLICT` and retries once at UoW level.
9. **Soft delete** only when all quantities zero and no open documents reference the balance.

---

## Domain Events

| Event | When |
|-------|------|
| `StockBalanceChanged` | After successful movement or bucket transfer |
| `StockDepleted` | availableQuantity reaches zero |
| `StockBelowReorderPoint` | policy threshold (future integration with reorder settings) |
| `StockInsufficient` | rejected OUT attempt (error event for monitoring) |

---

## State Model

Stock uses **isActive** flag, not a workflow enum:

| Condition | Meaning |
|-----------|---------|
| Active row | Normal operations |
| isActive false | Hidden from pick lists; history retained |
| deletedAt set | Soft removed; no new movements |

Quantity buckets (orthogonal to status):

```
availableQuantity     ── saleable
reservedQuantity      ── held
damagedQuantity       ── write-off candidate
expiredQuantity       ── expired on shelf
inTransitQuantity     ── dispatched not yet received at dest
```

---

## Integrations

- **InventoryLedgerService.applyMovement** — primary writer for availableQuantity + StockMovement.
- **Sales posting** — OUT with reference `SalesInvoiceItem`.
- **Purchasing GRN** — IN with reference `GoodsReceiptItem` / `PurchaseInvoiceItem`.
- **StockAdjustment approval** — ADJUSTMENT_GAIN / ADJUSTMENT_LOSS.
- **StockTransfer** — TRANSFER_OUT / TRANSFER_IN pair.
- **Reporting** — branch stock valuation joins Stock × Batch.purchaseRate or movement unitCost.

---

## Security

- List and detail require **`INVENTORY:STOCK:READ`** scoped to user's branch(es).
- Cross-branch stock visibility requires multi-branch role or HQ read permission.
- No permission grants direct quantity mutation API — only document workflows.

---

## Performance

- Unique index on `(branchId, batchId)` — single-row fetch before movement.
- Index `(branchId, availableQuantity)` for low-stock scans.
- Index `(branchId, isActive)` for active stock lists.
- Denormalize medicineId on movements to avoid Batch join on ledger reports.
- Hot path: one SELECT + one conditional UPDATE per movement line.

---

## Future Enhancements

- Materialized view: stock by medicine (sum across batches) per branch.
- Bin / shelf location dimension (sub-location within branch).
- Batch-level min/max reorder linked to Stock alerts.
- Real-time WebSocket push on balance change for POS displays.
