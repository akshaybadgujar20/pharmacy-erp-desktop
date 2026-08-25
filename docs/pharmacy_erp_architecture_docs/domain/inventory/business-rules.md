# Inventory — Business Rules

## Purpose

Consolidated catalog of inventory domain invariants aligned with the Prisma schema and `InventoryLedgerService`. Use as the authoritative checklist for implementation, QA, and code review.

**Schema reference:** [Inventory tables](../../database/tables/inventory/inventory.md)

---

## Responsibilities

- Enumerate structural rules (identity, scoping, immutability).
- Enumerate operational rules (FEFO, expiry, transfer, adjustment).
- Cross-reference specialized docs for workflow and costing detail.

---

## Scope

### In Scope

- Batch, Stock, StockMovement, StockAdjustment, StockTransfer, StockTake rules.

### Out of Scope

- Sales pricing rules (PriceList domain).
- Tax and invoice totals (Sales/Finance).

---

## Related Entities

All inventory tables listed in [inventory.md](../../database/tables/inventory/inventory.md).

---

## Business Rules

### Structural

| ID | Rule |
|----|------|
| BR-01 | Batch is **org-global**; unique `(medicineId, batchNumber)`. |
| BR-02 | Stock is **branch-scoped**; unique `(branchId, batchId)`. |
| BR-03 | StockMovement is **append-only**; never update or delete. |
| BR-04 | Quantity on movement is always **> 0**; direction is IN or OUT. |
| BR-05 | Document numbers (`movementNumber`, `adjustmentNumber`, `transferNumber`, `stockTakeNumber`) are unique **per branch** (transfer: per source branch). |
| BR-06 | Stock quantity columns change **only** via ledger or approved reservation/in-transit services. |
| BR-07 | UUID is sync identifier; BIGINT `id` is local-only. |

### Batch and expiry

| ID | Rule |
|----|------|
| BR-10 | Batch stores **purchaseRate** and **mrp**; **no saleRate**. |
| BR-11 | **FEFO:** allocate earliest `expiryDate` among batches with available stock. |
| BR-12 | **Expired batches cannot be sold** — block sales OUT unless explicit override (not default). |
| BR-13 | Expiry write-off uses adjustment workflow, not delete batch. |

### Stock balances

| ID | Rule |
|----|------|
| BR-20 | `availableQuantity >= 0` on OUT (default). |
| BR-21 | `reservedQuantity <= availableQuantity` (strict reservation mode). |
| BR-22 | Optimistic lock: Stock update must match `version` or conflict. |
| BR-23 | First IN at branch creates Stock row if absent. |

### Ledger and costing

| ID | Rule |
|----|------|
| BR-30 | Every inventory change produces exactly one StockMovement per quantity application. |
| BR-31 | `unitCost` on movement snapshots cost at transaction time (usually Batch.purchaseRate). |
| BR-32 | `balanceAfter` reflects availableQuantity after movement (for standard IN/OUT on available bucket). |
| BR-33 | `referenceTable` + `referenceId` must identify originating line item or document. |
| BR-34 | Movement types include: PURCHASE_GRN, SALES_INVOICE, PURCHASE_RETURN, SALES_RETURN, TRANSFER_IN, TRANSFER_OUT, ADJUSTMENT_GAIN, ADJUSTMENT_LOSS. |

### Stock adjustment

| ID | Rule |
|----|------|
| BR-40 | Adjustment belongs to one branch; requires reason. |
| BR-41 | At least one StockAdjustmentItem before approval. |
| BR-42 | Unique batch per adjustment document. |
| BR-43 | Approved adjustment is immutable; reversal = new adjustment. |
| BR-44 | Positive item qty → ADJUSTMENT_GAIN; negative → ADJUSTMENT_LOSS. |

### Stock transfer

| ID | Rule |
|----|------|
| BR-50 | `sourceBranchId ≠ destinationBranchId`. |
| BR-51 | At least one StockTransferItem. |
| BR-52 | Sent qty ≤ source available (at dispatch). |
| BR-53 | Status lifecycle: DRAFT, PENDING_APPROVAL, DISPATCHED, IN_TRANSIT, PARTIALLY_RECEIVED, COMPLETED, REJECTED, CANCELLED. |
| BR-54 | Dispatch creates TRANSFER_OUT at source; receive creates TRANSFER_IN at destination (same batchId). |
| BR-55 | Cancelled / rejected transfers post **no** net inventory change. |
| BR-56 | Partial receive: receivedQuantity + damagedQuantity ≤ sentQuantity; status PARTIALLY_RECEIVED until closed. |

### Stock take

| ID | Rule |
|----|------|
| BR-60 | StockTake does **not** update Stock directly. |
| BR-61 | varianceQuantity = physicalQuantity - systemQuantity. |
| BR-62 | varianceType: MATCHED, SURPLUS, DEFICIT. |
| BR-63 | Reconciliation generates StockAdjustment; movements on adjustment approval. |
| BR-64 | One active stock take per branch (policy — IN_PROGRESS). |

---

## Domain Events

Rules trigger events listed in [events.md](./events.md) — e.g. BR-43 → `StockAdjustmentApproved`, BR-54 → `StockTransferDispatched`.

---

## State Model

See [workflows.md](./workflows.md) for StockTransfer, StockAdjustment, and StockTake state machines.

---

## Integrations

Rules enforced in:

- `InventoryLedgerService.applyMovement`
- Future StockAdjustment / StockTransfer / StockTake application services
- Sales/Purchasing modules before calling ledger

---

## Security

- BR-06 implies no admin API to patch Stock quantities.
- Document approval rules require role separation (creator ≠ approver for high-value adjustments).

---

## Performance

- BR-22 conflicts retried once at UoW — design idempotent approve commands where possible.
- Batch FEFO (BR-11) uses indexed expiry ordering, not in-memory sort of full catalog.

---

## Future Enhancements

- Machine-readable rule export for compliance documentation.
- Configurable rule overrides per branch (negative stock, reservation strictness).
- Rule violation dashboard from audit log.
