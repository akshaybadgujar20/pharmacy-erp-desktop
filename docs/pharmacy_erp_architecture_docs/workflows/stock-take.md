# Stock Take

**Diagram:** [stock-take-flow.drawio](./stock-take-flow.drawio) · [SVG](./stock-take-flow.svg)

## Business Objective

Reconcile physical branch inventory against system stock by counting batches and posting variance adjustments.

## Data Model

- **StockTake** — header with `branchId`; `stockTakeNumber` unique per branch
- **StockTakeItem** — batchId, system quantity, counted quantity, variance
- On reconcile: auto-creates an **approved StockAdjustment** for non-zero variances

## Business Owner

- Pharmacy Manager
- Store Manager
- Inventory Team

## Main Flow

1. Create StockTake for branch (`DRAFT`).
2. Add StockTakeItems (batchId, system quantity snapshot).
3. `start` → `IN_PROGRESS`; enter counted quantities.
4. `complete` → `COUNTED` when counting is finished.
5. `reconcile` → creates approved adjustment for variances, marks items reconciled, status `RECONCILED`.

## Business Rules

- Stock takes are branch-scoped.
- Reconcile requires `IN_PROGRESS` or `COUNTED` status.
- Variance adjustments use `StockAdjustmentType.GAIN` with signed line quantities.
- FY date guard runs at reconcile (posting date).
- Incomplete stock takes surface in month-end pre-close checklist.

## Database Tables

- StockTake, StockTakeItem
- StockAdjustment, StockAdjustmentItem (on reconcile)
- Stock, StockMovement, Batch, Branch
- Outbox

## Related

- [Inventory flow](./inventory-flow.md)
- [Stock adjustment](./stock-adjustment.md)
- [Month end closing](./month-end-closing.md)
