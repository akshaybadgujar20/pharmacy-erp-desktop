
# Stock Adjustment

## Business Objective

Correct branch inventory when physical count differs from system stock.

## Data Model

- **StockAdjustment** — header with `branchId`; `adjustmentNumber` unique per branch
- **StockAdjustmentItem** — batchId + signed quantity + unitCost
- Updates **Stock** at `(branchId, batchId)` via **StockMovement**

## Business Owner

- Pharmacy Manager
- Store Manager
- Inventory Team

## Main Flow

1. Create StockAdjustment for branch.
2. Add StockAdjustmentItems (batchId, quantity ±, unitCost).
3. Submit for approval.
4. On approval: create StockMovement(s) at `branchId`; update branch Stock.
5. Write Outbox with `entityUuid` in same transaction.

## Business Rules

- Adjustments are branch-scoped (header.branchId).
- Batch is org-global; branch context from header.
- Approved adjustments are immutable — reversals use new movements.
- Never update Stock directly.

## Database Tables

- StockAdjustment, StockAdjustmentItem
- Stock, StockMovement, Batch, Branch
- Outbox

## Adjustment Types (String)

DAMAGE, EXPIRED, LOST, FOUND, OPENING, CORRECTION, etc.

## Example

```text
Branch 1 — Batch 101: system 100, physical 97
StockAdjustmentItem quantity = -3
→ StockMovement OUT 3 at branch 1
→ Stock.availableQuantity: 100 → 97
```
