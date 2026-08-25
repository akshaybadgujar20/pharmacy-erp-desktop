# Inventory — Valuation

## Purpose

Explain how inventory **financial value** is computed for reporting, stock take variance, and management dashboards. Valuation uses **quantity × unit cost**, where unit cost derives from **`Batch.purchaseRate`** and **movement snapshots** — not from sale price or MRP.

**Schema reference:** [24_stock](../../database/tables/inventory/24_stock.md) · [25_stock_movement](../../database/tables/inventory/25_stock_movement.md) · [Inventory overview](../../database/tables/inventory/inventory.md)

---

## Responsibilities

- Define branch inventory value at a point in time.
- Value stock take variances (StockTakeItem.varianceValue).
- Value adjustment write-offs (item quantity × unitCost).
- Distinguish statutory MRP from inventory asset cost.

---

## Scope

### In Scope

- On-hand valuation: sum of stock quantities × lot cost.
- Movement-based COGS for period P&L.
- Variance valuation on physical counts.

### Out of Scope

- Retail shelf value at MRP (marketing metric, not asset).
- Tax assessment methodology — Finance policy.
- Depreciation — N/A for consumable medicine inventory.

---

## Related Entities

| Source | Valuation formula |
|--------|-------------------|
| Stock + Batch | `availableQuantity × purchaseRate` (snapshot method) |
| StockMovement OUT | `quantity × unitCost` → COGS |
| StockTakeItem | `varianceValue = varianceQuantity × unitCost` |
| StockAdjustmentItem | `quantity × unitCost` → gain/loss |
| Batch.mrp | **Not** used for inventory asset value |

---

## Business Rules

1. **Default on-hand value (branch):** Σ over Stock rows of `(availableQuantity + damagedQuantity + expiredQuantity + inTransitQuantity?) × Batch.purchaseRate` — policy defines which buckets count as asset (typically available + inTransit; damaged/expired pending write-off).
2. **Lot-specific identification:** each batch valued at its purchaseRate unless movement unitCost differs (use movement for historical COGS).
3. **Stock take surplus (SURPLUS):** positive varianceValue increases asset after adjustment approval.
4. **Stock take deficit (DEFICIT):** negative varianceValue reduces asset.
5. **Transfer in transit:** source OUT already reduced source value; inTransitQuantity at source may still carry cost until destination IN (policy: value in transit on books at source until receive).
6. **No saleRate on Batch** — retail revenue potential is separate KPI (PriceList × qty).
7. **Currency:** single currency per company in current schema; purchaseRate in company base currency.

---

## Domain Events

| Event | Valuation impact |
|-------|------------------|
| `StockMovementRecorded` | Realized COGS on OUT |
| `StockAdjustmentApproved` | Write-off or gain amount |
| `StockTakeReconciled` | Sum of varianceValue by type |
| `StockTransferCompleted` | No net company value change (inter-branch) |

---

## State Model

Valuation is **derived** — no dedicated state. Reports choose as-of timestamp:

- **Snapshot:** current Stock × Batch.purchaseRate
- **Historical:** replay movements to reconstruct balance and cost

---

## Integrations

- **Finance GL (future):** periodic journal from movement types and adjustment totals.
- **Management reporting:** branch comparison, slow-moving stock (qty × cost).
- **StockTake:** displays varianceValue on COUNTED for approver review.
- **Audit:** large varianceValue thresholds trigger additional approval.

---

## Security

- Valuation reports may be restricted to finance/manager roles beyond stock read.
- unitCost visible with `INVENTORY:STOCK:READ`; margin reports may need sales read.

---

## Performance

- Snapshot valuation: single SQL aggregating Stock JOIN Batch filtered by branchId.
- Avoid N+1: batch purchaseRate joined in one query.
- Large chains: nightly materialized valuation table by branch/medicine (future).

---

## Future Enhancements

- Weighted average valuation option per branch.
- Landed cost components on Batch (freight allocation).
- Mark-to-market near-expiry provision (accounting policy).
- Export to Excel with batch-level drill-down.

See [costing.md](./costing.md).
