# Medicine — Inventory Integration

## Purpose

Explain how the Medicine Master bounded context connects to Inventory without owning stock. Medicine defines **what** can be stocked; Inventory defines **how much** exists **where** (per branch) in which **batch**.

## Responsibilities

- Clarify the Medicine → Batch → Stock relationship.
- Document what data lives on each layer (master vs lot vs branch balance).
- Define rules when medicine lifecycle changes affect inventory operations.

## Scope

### In Scope

- Reference from `Medicine` to `Batch` and `Stock`.
- Branch scoping via `Stock.branchId` and transaction `branchId`.
- Cost vs sale price separation (`Batch.purchaseRate` vs `PriceListItem.sellingPrice`).

### Out of Scope

- Stock movement ledger implementation — [Inventory domain](../inventory/README.md).
- FEFO picking algorithm details — [batch](../../database/tables/inventory/23_batch.md) table spec.
- Stock adjustments and physical counts.

## Related Entities

```
Medicine (org-global)
    │
    └──< Batch (org-global lot identity)
              │
              └──< Stock (branch-scoped quantity)
                        │
                        └──< StockMovement (immutable ledger)
```

| Entity | Scope | Table spec |
|--------|-------|------------|
| Medicine | Organization | [15_medicine.md](../../database/tables/medicine_master/15_medicine.md) |
| Batch | Organization (per medicine lot) | [23_batch.md](../../database/tables/inventory/23_batch.md) |
| Stock | Branch + Batch | Inventory stock table spec |
| PriceListItem | Branch sale price | [48_price_list_item.md](../../database/tables/pricing/48_price_list_item.md) |

## Business Rules

1. **One medicine, many batches** — each physical lot is a `Batch` with unique `(medicineId, batchNumber)`.
2. **Batch belongs to medicine** — `batch.medicineId` required; cannot reassign batch to another medicine.
3. **Stock is branch-scoped** — quantity is stored per `(branchId, batchId)`, not on `Medicine`.
4. **Medicine has no quantity field** — never store on-hand qty on the medicine row.
5. **Lot pricing on batch** — `purchaseRate` (cost) and statutory `mrp` on `Batch`; **not** branch sale rate.
6. **Sale rate from pricing** — billing uses `PriceListItem.sellingPrice` for the branch's active price list.
7. **Expired batches** — cannot be sold; medicine may remain active while batches expire independently.
8. **Discontinued medicine** — existing batches remain in stock and may be sold; new batches discouraged at application layer.
9. **Inactive medicine** — block new batch creation and new purchase lines; existing stock may still deplete per policy.
10. **Soft-deleted medicine** — must not appear in GRN or sales selectors; historical movements retain `medicineId` reference.
11. **Refrigerated flag** — storage validation on batch receipt (cold chain) references `Medicine.refrigerated`.
12. **UOM consistency** — stock movements use the medicine's primary `unitId` unless conversion rules exist (future).

## Domain Events

| Event | Inventory impact |
|-------|-------------------|
| `MedicineCreated` | Enables batch creation after first receipt |
| `MedicineDiscontinued` | No new batches; warn on purchase |
| `MedicineDeactivated` | Block new stock-in for medicine |
| `BatchCreated` | Outbox `Batch` entity; stock row created on first movement |
| `StockMovementApplied` | Ledger update; not emitted by Medicine aggregate |

## State Model

Medicine lifecycle flags interact with batch `isActive` and expiry:

| Medicine state | New batch? | Sell existing stock? |
|----------------|------------|----------------------|
| Active | Yes | Yes |
| Discontinued | No (policy) | Yes |
| Inactive | No | Policy-dependent |
| Deleted | No | No (historical only) |

Batch expiry is date-driven (`expiryDate`), independent of medicine flags.

## Integrations

- **Goods receipt (Purchasing)** — creates or matches `Batch`, then `InventoryLedgerService.applyMovement` for `IN`.
- **Sales dispensing** — selects batch (FEFO), decrements `Stock` via ledger `OUT`.
- **Pricing at sale** — resolve `PriceListItem` by branch + medicine; snapshot rate on `SalesInvoiceItem`.
- **Barcode** — scan may match `Medicine.barcode` or `Batch.barcode` depending on configuration.

## Security Considerations

- Stock adjustments require `INVENTORY:STOCK_ADJUSTMENT:CREATE` (seed: `INVENTORY_ADJUST`), separate from medicine master permission.
- Viewing stock requires `INVENTORY:STOCK:READ` (seed: `INVENTORY_VIEW`).
- Branch context mandatory for stock queries — use `withBranchScope` from request context.

## Performance Considerations

- POS batch selection: index `(medicineId, expiryDate)` on `Batch`.
- Stock lookup: composite key `(branchId, batchId)`.
- Medicine search should not join stock by default; optional "in stock" filter is a separate query per branch.

## Future Enhancements

- Reserved quantity per branch (Sales reservation domain).
- Multi-warehouse within branch.
- Medicine-level reorder level hints (actual reorder logic in Inventory/Purchasing).
