# Inventory — Costing

## Purpose

Define how inventory **unit cost** is determined and recorded. The system uses **lot costing anchored on `Batch.purchaseRate`**, with **movement-level snapshots** (`StockMovement.unitCost`) as the audit trail for COGS and valuation. There is **no saleRate on Batch** — revenue price is branch PriceList; cost is independent of selling price.

**Schema reference:** [23_batch](../../database/tables/inventory/23_batch.md) · [25_stock_movement](../../database/tables/inventory/25_stock_movement.md) · [Inventory overview](../../database/tables/inventory/inventory.md)

---

## Responsibilities

- Set default unit cost at batch creation from purchase receipt.
- Snapshot unit cost on every StockMovement at transaction time.
- Propagate cost to StockAdjustmentItem and StockTakeItem for write-off valuation.
- Support COGS calculation on sales OUT using movement unitCost, not current PriceList.

---

## Scope

### In Scope

- Lot cost (`purchaseRate`) on Batch.
- Movement `unitCost` and quantity for ledger replay.
- Adjustment and stock-take line costing.
- Transfer cost carry-forward (same batch, same unit cost at IN).

### Out of Scope

- Weighted-average or FIFO layer tables (future — see future.md).
- Sale margin analysis — reporting joins cost from movements to invoice line revenue.
- Tax valuation — Finance domain.

---

## Related Entities

| Field / Entity | Cost role |
|----------------|-----------|
| Batch.purchaseRate | Lot cost at receipt; default for new movements |
| Batch.mrp | Statutory retail cap — **not** inventory cost |
| StockMovement.unitCost | Immutable cost snapshot per transaction |
| StockMovement.quantity | Units moved |
| StockAdjustmentItem.unitCost | Write-off / gain valuation |
| StockTakeItem.unitCost | Variance financial impact |
| StockTakeItem.varianceValue | varianceQuantity × unitCost |
| SalesInvoiceItem | Revenue side; COGS from linked OUT movement |

---

## Business Rules

1. **Primary cost source:** `Batch.purchaseRate` set when batch is created from GRN/purchase invoice line landed cost.
2. **Movement snapshot:** `StockMovement.unitCost` copied from batch purchaseRate (or line override at receipt) at IN time; OUT movements use same lot cost (specific identification per batch).
3. **No retroactive batch cost change** after movements exist without explicit correction adjustment and audit.
4. **Sales COGS** = sum of OUT movement `quantity × unitCost` for invoice lines (batch-specific).
5. **Transfer** does not re-cost: destination IN uses source OUT unitCost (same batchId).
6. **Adjustment loss/gain** uses item.unitCost (default purchaseRate) × |quantity| for P&L impact.
7. **Returns:** sales return IN restores at original OUT unitCost if linked; otherwise purchaseRate.
8. **Negative adjustment (loss)** financial value = quantity × unitCost (quantity negative on item, value positive in reports).

---

## Domain Events

| Event | Cost data |
|-------|-----------|
| `StockMovementRecorded` | unitCost, quantity, movementType |
| `BatchCreated` | purchaseRate initial |
| `StockAdjustmentApproved` | sum(item.quantity × item.unitCost) |
| `StockTakeReconciled` | sum(varianceValue) by varianceType |

---

## State Model

Costing has no workflow state. **Batch.purchaseRate** is quasi-static; **movement unitCost** is frozen at insert.

---

## Integrations

- **Purchasing:** GRN line sets Batch.purchaseRate and first IN movement unitCost.
- **InventoryLedgerService:** accepts `unitCost` on `ApplyMovementInput`.
- **Finance (future):** periodic inventory valuation report from Stock × purchaseRate or last movement cost.
- **Reporting:** movement ledger replay for COGS by period.

---

## Security

- View cost on movements may require `INVENTORY:STOCK:READ` plus finance role for margin reports.
- Changing purchaseRate on existing batch restricted to admin with audit.

---

## Performance

- Cost on OUT does not require weighted-average recompute — O(1) per line from batch or input.
- Period COGS reports scan StockMovement by `(branchId, movementDate, movementType)` index.

---

## Future Enhancements

- Optional **weighted average cost** per medicine per branch (separate cost layer table).
- Landed cost add-ons (freight, duty) allocated at GRN to purchaseRate.
- Standard cost vs actual variance reporting.
- Multi-currency purchaseRate with exchange rate snapshot.

See also [valuation.md](./valuation.md).
