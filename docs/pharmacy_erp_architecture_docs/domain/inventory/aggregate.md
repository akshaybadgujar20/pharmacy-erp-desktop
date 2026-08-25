# Inventory — Aggregate Design

## Purpose

Define domain-driven aggregate boundaries for inventory: which entities mutate together, which invariants hold within a transaction, and where cross-aggregate coordination occurs. Aligns with Prisma models under `backend/prisma/inventory/`.

**Schema reference:** [Inventory tables](../../database/tables/inventory/inventory.md)

---

## Responsibilities

- Identify aggregate roots and their consistency boundaries.
- Specify transactional invariants enforced inside `UnitOfWorkService.run`.
- Clarify that StockMovement is a ledger fact, not a mutable aggregate child.
- Document reference-by-id patterns across purchasing, sales, and inventory documents.

---

## Scope

### In Scope

- Batch, Stock, StockMovement roles.
- Document aggregates: StockAdjustment, StockTransfer, StockTake (header + line items).
- Ledger application pattern via `InventoryLedgerService`.

### Out of Scope

- Medicine master aggregate (Product domain).
- Sales invoice and purchase GRN aggregates (their domains call inventory services).

---

## Related Entities

```
┌─────────────────────────────────────────────────────────────┐
│  Batch (org-global)                                         │
│  - medicineId, batchNumber, expiryDate, purchaseRate, mrp   │
└──────────────────────────┬──────────────────────────────────┘
                           │ 1 : many
┌──────────────────────────▼──────────────────────────────────┐
│  Stock (branch-scoped balance)                              │
│  - unique (branchId, batchId)                               │
└──────────────────────────┬──────────────────────────────────┘
                           │ updated via
┌──────────────────────────▼──────────────────────────────────┐
│  StockMovement (immutable ledger)                           │
│  - IN/OUT, balanceAfter, referenceTable/referenceId         │
└─────────────────────────────────────────────────────────────┘

Document aggregates (each: header + items → movements):
  StockAdjustment    StockTransfer    StockTake
```

---

## Business Rules

### Batch aggregate (soft boundary)

- **Identity:** `(medicineId, batchNumber)` unique org-wide.
- **Creation:** Typically on first GRN receipt; may be referenced by multiple branches via Stock rows.
- **Mutability:** `purchaseRate` and `mrp` are lot snapshots at receipt; changes after movements exist require explicit policy (normally immutable).
- **No branch fields.** Batch never stores quantity.

### Stock aggregate (balance root per branch + batch)

- **Identity:** `(branchId, batchId)`.
- **Invariant:** `availableQuantity >= 0` on OUT unless policy override.
- **Invariant:** `reservedQuantity <= availableQuantity` (when reservation active).
- **Concurrency:** `version` optimistic lock on every balance update.
- **Mutation path:** Only `InventoryLedgerService.applyMovement` (or dedicated reservation service updating reserved buckets).

### StockMovement (ledger entry — not an aggregate root)

- Created in the same transaction as Stock update.
- Immutable after insert; no `updatedAt` business edits.
- **Invariant:** `quantity > 0`; direction determines add vs subtract.
- **Invariant:** `balanceAfter` equals Stock.availableQuantity after apply (for available bucket movements).

### StockAdjustment aggregate

- **Root:** StockAdjustment.
- **Children:** StockAdjustmentItem (unique per `batchId` per document).
- **Commit:** On approval, each item with non-zero quantity produces `ADJUSTMENT_GAIN` (IN) or `ADJUSTMENT_LOSS` (OUT) movement at item `unitCost`.
- **Branch scope:** Single `branchId` on header.

### StockTransfer aggregate

- **Root:** StockTransfer.
- **Children:** StockTransferItem.
- **Cross-branch:** Coordinates two Stock aggregates (source OUT, destination IN) in one transaction at dispatch/receive milestones.
- **Status machine:** DRAFT → … → COMPLETED (see workflows.md).

### StockTake aggregate

- **Root:** StockTake.
- **Children:** StockTakeItem with `systemQuantity`, `physicalQuantity`, `varianceQuantity`.
- **Reconciliation:** Generates linked StockAdjustment (`stockAdjustmentId` on item); inventory moves only when adjustment approves.

---

## Domain Events

Events emit from aggregate roots on state transitions:

| Aggregate | Events |
|-----------|--------|
| Batch | `BatchCreated`, `BatchDeactivated` |
| Stock (via ledger) | `StockBalanceChanged` |
| StockMovement | `StockMovementRecorded` |
| StockAdjustment | `StockAdjustmentCreated`, `StockAdjustmentApproved`, `StockAdjustmentCancelled` |
| StockTransfer | `StockTransferSubmitted`, `StockTransferDispatched`, `StockTransferReceived`, `StockTransferCompleted`, `StockTransferCancelled` |
| StockTake | `StockTakeStarted`, `StockTakeCounted`, `StockTakeReconciled` |

---

## State Model

| Aggregate | Stateful? | States |
|-----------|-----------|--------|
| Batch | isActive flag | active / inactive (soft delete) |
| Stock | isActive flag | active balance row |
| StockMovement | No | N/A (immutable) |
| StockAdjustment | Yes | DRAFT, PENDING_APPROVAL, APPROVED, CANCELLED |
| StockTransfer | Yes | DRAFT, PENDING_APPROVAL, DISPATCHED, IN_TRANSIT, PARTIALLY_RECEIVED, COMPLETED, REJECTED, CANCELLED |
| StockTake | Yes | DRAFT, IN_PROGRESS, COUNTED, RECONCILED, CANCELLED |

---

## Integrations

- **InventoryLedgerService** is the sole writer to Stock + StockMovement for quantity changes.
- **SequenceGeneratorService** allocates document numbers inside the same transaction.
- **OutboxService** enqueues sync events from document roots after commit.
- Purchasing/Sales modules invoke ledger with `referenceTable` / `referenceId` pointing to their line items.

---

## Security

- Aggregate commands validate branch membership from JWT context before load.
- Stock read aggregate queries require `INVENTORY:STOCK:READ`.
- StockAdjustment create requires `INVENTORY:STOCK_ADJUSTMENT:CREATE`; approve requires separate permission (role-dependent).

---

## Performance

- Keep aggregates small: one transaction per document approval, not whole-branch replay.
- Line items processed sequentially inside tx; batch insert for movements where SQLite allows.
- Avoid loading full movement history when applying a single document — only current Stock row + version.

---

## Future Enhancements

- Explicit `InventoryAggregateRepository` facade per root instead of raw Prisma in feature modules.
- Saga/outbox pattern for long-running transfers with offline branch sync.
- Event sourcing replay from StockMovement for disaster recovery (Stock as projection).
