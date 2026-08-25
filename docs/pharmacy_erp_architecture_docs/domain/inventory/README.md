# Inventory Domain

## Purpose

The Inventory domain tracks medicine lots, branch-level balances, and every quantity change through an immutable ledger. It answers three operational questions for a pharmacy chain: **what lot** is on hand (Batch), **where and how much** is available (Stock per branch), and **why quantities changed** (StockMovement and originating documents).

Inventory is org-global at the lot level and branch-scoped at the balance level. Costing derives from `Batch.purchaseRate` plus movement history; selling price is **not** stored on Batch.

**Schema reference:** [Inventory tables](../../database/tables/inventory/inventory.md)

---

## Responsibilities

- Maintain org-global **Batch** identity (batch number, expiry, purchase rate, statutory MRP).
- Maintain branch **Stock** balances keyed by `(branchId, batchId)` with available, reserved, damaged, expired, and in-transit buckets.
- Record every quantity change as an immutable **StockMovement** with `balanceAfter`, `unitCost`, and polymorphic reference.
- Orchestrate **StockAdjustment**, **StockTransfer**, and **StockTake** workflows that produce ledger entries — never direct balance edits.
- Enforce **FEFO** (First Expiry First Out) for dispensing and allocation.
- Guard negative available stock on OUT movements unless explicitly overridden by policy.
- Publish domain events and outbox payloads for sync, audit, and downstream reporting.

---

## Scope

### In Scope

- Batch lifecycle (create on GRN/purchase receipt, deactivate, soft delete).
- Stock balance queries and availability checks per branch.
- Ledger application via `InventoryLedgerService.applyMovement`.
- Manual corrections: StockAdjustment (+ StockAdjustmentItem).
- Inter-branch moves: StockTransfer (+ StockTransferItem) with full status lifecycle.
- Physical counts: StockTake (+ StockTakeItem) and variance reconciliation to adjustments.
- Reservation semantics on `Stock.reservedQuantity` (sales hold, pending transfer dispatch).
- Expiry-driven eligibility (no sale of expired batches).
- Unit cost snapshots on movements and adjustment/stock-take lines.

### Out of Scope

- **Sale pricing** — branch-scoped `PriceList` / `PriceListItem`; sale lines snapshot price at invoice time.
- **Purchase order / GRN creation** — Purchasing domain; inventory consumes GRN outcomes.
- **Sales invoice posting** — Sales domain; inventory receives OUT movement requests.
- **General ledger / accounting journals** — Finance domain consumes movement cost data.
- **Medicine master data** — Product/Medicine domain owns SKU identity.

---

## Related Entities

| Entity | Role | Table doc |
|--------|------|-----------|
| **Batch** | Org-global lot identity | [23_batch](../../database/tables/inventory/23_batch.md) |
| **Stock** | Balance per `(branchId, batchId)` | [24_stock](../../database/tables/inventory/24_stock.md) |
| **StockMovement** | Immutable ledger entry | [25_stock_movement](../../database/tables/inventory/25_stock_movement.md) |
| **StockAdjustment** | Manual correction header | [26_stock_adjustment](../../database/tables/inventory/26_stock_adjustment.md) |
| **StockAdjustmentItem** | Adjustment line | [71_stock-adjustment-item](../../database/tables/inventory/71_stock-adjustment-item.md) |
| **StockTransfer** | Inter-branch transfer header | [27_stock_transfer](../../database/tables/inventory/27_stock_transfer.md) |
| **StockTransferItem** | Transfer line | [72_stock-transfer-item](../../database/tables/inventory/72_stock-transfer-item.md) |
| **StockTake** | Physical count session | [28_stock_take](../../database/tables/inventory/28_stock_take.md) |
| **StockTakeItem** | Counted line with variance | [29_stock_take_item](../../database/tables/inventory/29_stock_take_item.md) |
| **Medicine** | Product master | Medicine master tables |
| **Branch** | Tenant location | Configuration tables |
| **Employee** | Approver / counter | Party management |

---

## Business Rules

1. **Batch is org-global; Stock is branch-scoped.** One Batch may have many Stock rows (one per branch holding that lot).
2. **No silent balance edits.** `Stock.availableQuantity` changes only through `InventoryLedgerService.applyMovement` inside a transaction.
3. **Movements are append-only.** StockMovement rows are never updated or deleted; corrections are new movements or reversing documents.
4. **Positive movement quantity.** Ledger always stores `quantity > 0`; direction is `IN` or `OUT`.
5. **Document numbers are branch-scoped.** `movementNumber`, `adjustmentNumber`, `transferNumber`, `stockTakeNumber` are unique per branch (or source branch for transfers).
6. **No saleRate on Batch.** Cost uses `purchaseRate`; revenue price comes from PriceList at sale time.
7. **FEFO.** When multiple batches satisfy a sale, prefer earliest `expiryDate` with sufficient available quantity.
8. **Expired batches cannot be sold.** OUT movements for sales must reject expired lots unless adjustment workflow explicitly writes off expired stock first.
9. **Transfer source ≠ destination.** StockTransfer must reference two distinct branches.
10. **Stock take does not move inventory directly.** Variances post through StockAdjustment after reconciliation approval.

See [business-rules.md](./business-rules.md) for the consolidated rule catalog.

---

## Domain Events

| Event | Trigger | Consumers |
|-------|---------|-----------|
| `BatchCreated` | New lot on GRN or manual batch entry | Sync, audit |
| `StockBalanceChanged` | After movement applied | Dashboards, low-stock alerts |
| `StockMovementRecorded` | Ledger insert | Audit trail, costing replay |
| `StockAdjustmentApproved` | Adjustment status → approved | Movements, audit |
| `StockTransferDispatched` | Status → DISPATCHED / IN_TRANSIT | Source branch OUT, in-transit bucket |
| `StockTransferReceived` | Status → COMPLETED / PARTIALLY_RECEIVED | Destination IN, in-transit clear |
| `StockTakeReconciled` | Status → RECONCILED | Auto adjustment generation |

Full catalog: [events.md](./events.md)

---

## State Model

### StockTransfer (primary workflow states)

```
DRAFT → PENDING_APPROVAL → DISPATCHED → IN_TRANSIT → COMPLETED
                              ↓              ↓
                         REJECTED      PARTIALLY_RECEIVED → COMPLETED
DRAFT / PENDING_APPROVAL → CANCELLED
```

### StockAdjustment

Typical: `DRAFT → PENDING_APPROVAL → APPROVED` (or `CANCELLED`). Approved adjustments are immutable; reversal uses a new adjustment document.

### StockTake

`DRAFT → IN_PROGRESS → COUNTED → RECONCILED` (or `CANCELLED` from draft/in-progress).

Stock and StockMovement have no business status enum — they are active balances and immutable facts.

Detail: [workflows.md](./workflows.md), [aggregate.md](./aggregate.md)

---

## Integrations

| Boundary | Direction | Mechanism |
|----------|-----------|-----------|
| **Purchasing / GRN** | Inbound | GRN creates Batch (if new) + IN movement (`PURCHASE_GRN`) |
| **Sales** | Outbound | Invoice posts OUT (`SALES_INVOICE`); returns IN (`SALES_RETURN`) |
| **Purchase returns** | Outbound | OUT (`PURCHASE_RETURN`) |
| **Persistence** | Internal | `UnitOfWorkService`, `InventoryLedgerService`, `SequenceGeneratorService` |
| **Outbox / sync** | Outbound | Entity UUID + operation on Batch, documents, movements |
| **Audit** | Outbound | `AuditService` on approve/dispatch/reconcile actions |
| **Reporting** | Read | StockMovement ledger + Stock snapshot for valuation reports |

---

## Security

| Permission | Code | Use |
|------------|------|-----|
| View stock balances and movements | `INVENTORY:STOCK:READ` | List/detail Stock, StockMovement, Batch lookup |
| Create stock adjustments | `INVENTORY:STOCK_ADJUSTMENT:CREATE` | Draft and submit adjustment documents |

- All queries scoped by `RequestContext` (`companyId`, `branchId`); never trust client-supplied branch headers alone.
- Approve/dispatch/receive actions require elevated permissions (to be added per role matrix).
- Movements record `createdBy`; adjustment/transfer/stock-take headers record approver employee IDs.
- Immutable ledger supports forensic audit; approved documents must not be soft-deleted.

Detail: [validation.md](./validation.md) (authorization gates)

---

## Performance

- **Hot path:** `(branchId, batchId)` Stock lookup — unique index supports O(1) fetch before movement.
- **Optimistic locking:** `Stock.version` + `updateMany` prevents lost updates on concurrent sales.
- **Ledger indexes:** `(branchId, batchId, movementDate)`, `(referenceTable, referenceId)` for reconciliation queries.
- **FEFO queries:** `(medicineId, expiryDate)` on Batch for batch selection during dispensing.
- **Transactions:** Multi-line adjustments/transfers run in single `UnitOfWorkService.run` with one retry on conflict.
- **Read models:** Branch stock summaries may be cached briefly; authoritative balance always from Stock row post-movement.

---

## Future Enhancements

- Barcode-driven cycle counting and blind count mode.
- Automated near-expiry alerts and markdown workflows.
- Negative-stock policy flag per branch.
- Full reservation service with TTL and sales-order linkage.
- Weighted-average costing option (today: lot cost from `purchaseRate` + movement snapshots).

Roadmap: [future.md](./future.md)

---

## Domain module index

| Document | Topic |
|----------|-------|
| [aggregate.md](./aggregate.md) | Aggregate roots and boundaries |
| [batch.md](./batch.md) | Batch entity |
| [stock.md](./stock.md) | Stock balance entity |
| [adjustments.md](./adjustments.md) | StockAdjustment workflow |
| [workflows.md](./workflows.md) | Transfer and stock-take flows |
| [costing.md](./costing.md) | Unit cost and COGS |
| [valuation.md](./valuation.md) | Inventory valuation |
| [expiry.md](./expiry.md) | FEFO and expiry rules |
| [reservation.md](./reservation.md) | Reserved quantity |
| [events.md](./events.md) | Domain event catalog |
| [business-rules.md](./business-rules.md) | Rule index |
| [validation.md](./validation.md) | Input and invariant validation |
| [future.md](./future.md) | Planned capabilities |
