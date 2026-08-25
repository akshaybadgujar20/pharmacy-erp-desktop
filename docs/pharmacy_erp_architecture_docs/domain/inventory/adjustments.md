# Inventory — Stock Adjustments

## Purpose

**StockAdjustment** documents manual inventory corrections at a single branch: damage, expiry write-off, theft, opening balance, count variance, samples, or system correction. Each header carries a **reason**, **adjustmentType**, approval metadata, and one or more **StockAdjustmentItem** lines. Approved adjustments produce immutable **StockMovement** rows — never silent Stock edits.

**Schema reference:** [26_stock_adjustment](../../database/tables/inventory/26_stock_adjustment.md) · [71_stock-adjustment-item](../../database/tables/inventory/71_stock-adjustment-item.md) · [Inventory overview](../../database/tables/inventory/inventory.md)

---

## Responsibilities

- Capture intentional quantity deltas per batch with audit trail (reason, approver, timestamps).
- Snapshot **unitCost** on each line (typically `Batch.purchaseRate`) for financial write-off value.
- Route positive quantity to `ADJUSTMENT_GAIN` (IN) and negative to `ADJUSTMENT_LOSS` (OUT).
- Link from **StockTakeItem** when physical count variance is reconciled.
- Prevent duplicate batch lines within one document (`unique(stockAdjustmentId, batchId)`).

---

## Scope

### In Scope

- Draft → approve workflow for branch-scoped adjustments.
- Line-level quantity (signed) and remarks.
- Movement generation on approval.
- Cancellation before approval (no movements).

### Out of Scope

- Inter-branch moves — StockTransfer domain.
- Sales or purchase corrections — respective domains with their movement types.
- GL journal posting — Finance consumes movement cost totals.

---

## Related Entities

| Entity | Role |
|--------|------|
| StockAdjustment | Header: branchId, adjustmentNumber, reason, status |
| StockAdjustmentItem | batchId, quantity, unitCost |
| Batch | Lot identity and default cost |
| Stock | Balance updated at branch |
| StockMovement | ADJUSTMENT_GAIN / ADJUSTMENT_LOSS |
| StockTakeItem | Optional link via stockAdjustmentId |
| Employee | approvedByEmployeeId |
| Branch | Scope boundary |

---

## Business Rules

1. **Single branch** per document (`branchId` on header).
2. **At least one item** before submit for approval.
3. **reason** required on header — free text or coded reason per adjustmentType policy.
4. **quantity on item** may be positive (surplus found) or negative (loss); absolute value used for movement with direction derived from sign.
5. **unitCost** required on each line; defaults from Batch.purchaseRate at line save.
6. **Approved adjustments are immutable.** Corrections require a reversing adjustment document, not delete.
7. **OUT movements** validate sufficient availableQuantity (loss adjustments).
8. **adjustmentNumber** unique per branch.
9. **Soft delete** disallowed for approved documents.
10. **Stock take linkage:** reconciled StockTakeItem sets stockAdjustmentId when auto-generated adjustment is created.

Typical **adjustmentType** values (string, not DB enum): `DAMAGE`, `EXPIRY`, `THEFT`, `OPENING_STOCK`, `COUNT_VARIANCE`, `SYSTEM_CORRECTION`, `SAMPLE`, `INTERNAL_USE`.

Typical **status** values: `DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `CANCELLED`.

---

## Domain Events

| Event | When |
|-------|------|
| `StockAdjustmentCreated` | Header saved in DRAFT |
| `StockAdjustmentSubmitted` | Status → PENDING_APPROVAL |
| `StockAdjustmentApproved` | Status → APPROVED; movements posted |
| `StockAdjustmentCancelled` | Before approval |
| `StockMovementRecorded` | Per line on approve (reference StockAdjustmentItem) |

---

## State Model

```
DRAFT ──submit──► PENDING_APPROVAL ──approve──► APPROVED (terminal, immutable)
    │                    │
    └──cancel──► CANCELLED ◄──reject──┘
```

| State | Inventory effect |
|-------|------------------|
| DRAFT / PENDING_APPROVAL | None |
| APPROVED | StockMovement + Stock update per item |
| CANCELLED | None |

---

## Integrations

- **InventoryLedgerService** — called once per item on approval inside UoW transaction.
- **SequenceGeneratorService** — `adjustmentNumber` and movement numbers.
- **StockTake reconciliation** — service creates adjustment header/items from variance lines, then approval posts movements.
- **AuditService** — log approve with employee id and variance value totals.
- **Outbox** — enqueue StockAdjustment UUID on APPROVED.

---

## Security

| Action | Permission |
|--------|------------|
| View adjustments | `INVENTORY:STOCK:READ` |
| Create / edit draft | `INVENTORY:STOCK_ADJUSTMENT:CREATE` |
| Approve | Elevated role (e.g. branch manager) — separate permission TBD |
| Cancel own draft | Creator or supervisor |

Branch scope enforced via RequestContext; users cannot approve adjustments for branches outside assignment.

---

## Performance

- Approve in single transaction: all items + all movements + version checks on Stock rows.
- Lock ordering: sort items by batchId before updates to reduce deadlock risk on concurrent approvals.
- Index `(branchId, status)` for approval queue UI.

---

## Future Enhancements

- Reason code master with mandatory attachment for high-value write-offs.
- Dual approval threshold when total variance value exceeds limit.
- Automatic expiry adjustment job from expiredQuantity bucket.
- Bulk CSV import for opening stock with validation preview.
