# Medicine — Pricing Integration

## Purpose

Document the cross-domain relationship between Medicine Master and the Pricing bounded context. **Sale pricing is branch-scoped in `PriceList` / `PriceListItem`**, not on `Medicine` or `Batch`.

## Responsibilities

- Clarify price ownership boundaries across Medicine, Batch, and PriceListItem.
- Explain Tax linkage on price list items.
- Describe how sales snapshots rates at transaction time.

## Scope

### In Scope

- `PriceList`, `PriceListItem`, and `Tax` references to `Medicine`.
- Branch scoping via `PriceList.branchId`.
- MRP semantics (statutory vs commercial).

### Out of Scope

- Discount rules engine — [50_discount_rule.md](../../database/tables/pricing/50_discount_rule.md).
- Purchase invoice cost — `Batch.purchaseRate`.
- Payment and receipt processing — Finance domain.

## Related Entities

```
Branch (optional on PriceList)
    │
    ▼
PriceList ──< PriceListItem ──► Medicine
                    │
                    └──► Tax

Batch (lot) ── purchaseRate, mrp (statutory pack MRP)
PriceListItem ── sellingPrice, mrp (commercial ceiling), taxId
```

| Entity | Table spec |
|--------|------------|
| PriceList | [47_price_list.md](../../database/tables/pricing/47_price_list.md) |
| PriceListItem | [48_price_list_item.md](../../database/tables/pricing/48_price_list_item.md) |
| Tax | [49_tax.md](../../database/tables/pricing/49_tax.md) |
| Medicine | [15_medicine.md](../../database/tables/medicine_master/15_medicine.md) |
| Batch | [23_batch.md](../../database/tables/inventory/23_batch.md) |

Pricing overview: [pricing.md](../../database/tables/pricing/pricing.md).

## Business Rules

### Ownership

1. **Medicine has no price columns** — identity and classification only.
2. **Batch stores cost and statutory MRP** — `purchaseRate` from receipt; `mrp` as printed on pack.
3. **PriceListItem stores branch sale price** — `sellingPrice` is the counter rate for billing.
4. **One item per medicine per price list** — unique `(priceListId, medicineId)`.
5. **Default price list per branch** — at most one `PriceList.isDefault = true` per branch.

### Validity

6. **Effective dates** — `PriceListItem.effectiveFrom` / `effectiveTo` must fall within parent `PriceList` validity.
7. **Inactive items** — `isActive = false` on item or list excludes from billing lookup.
8. **Positive price** — `sellingPrice > 0` (DB check constraint).

### Tax

9. **Tax on item** — `PriceListItem.taxId` references `Tax`; GST rate applied at invoice line calculation.
10. **Historical tax** — invoice lines snapshot tax rate; changing `Tax` does not alter posted invoices.
11. **HSN from medicine** — `Medicine.hsnCode` used for GST reporting; tax rate from `Tax` via price list item.

### Billing resolution (branch transaction)

12. Resolve active `PriceList` for transaction `branchId` (default list or customer-specific list type).
13. Find active `PriceListItem` for `medicineId` with valid effective dates.
14. Apply `sellingPrice`, optional `discountPercent`, and `taxId`.
15. Compare against `minimumSellingPrice` if set — block below-minimum sales.
16. Snapshot final rate, MRP, and tax on `SalesInvoiceItem` — do not re-read price list on reprint.

### MRP dual meaning

| Location | Field | Meaning |
|----------|-------|---------|
| Batch | `mrp` | Statutory MRP on physical pack |
| PriceListItem | `mrp` | Commercial MRP ceiling for pricing rules |

Sale line display may show batch statutory MRP while charging `sellingPrice` from price list.

## Domain Events

| Source | Event | Pricing impact |
|--------|-------|----------------|
| Medicine | `MedicineCreated` | Prompt to add `PriceListItem` on branch lists |
| Medicine | `MedicineDeactivated` | Existing items may be deactivated manually |
| Pricing | `PriceListItemUpdated` | POS cache invalidation for branch |
| Sales | Invoice posted | Price snapshotted — no retroactive change |

Medicine aggregate does not emit pricing events.

## State Model

Price list uses boolean `isActive` plus date range — not the same as medicine lifecycle:

| PriceListItem usable? | Conditions |
|-----------------------|------------|
| Yes | List active, item active, dates valid, medicine not deleted |
| No | Any failure above |

Medicine `discontinued` does not auto-deactivate price list items.

## Integrations

- **Sales billing** — primary consumer of `PriceListItem.sellingPrice`.
- **Purchasing** — uses `Batch.purchaseRate`, not price list.
- **Reporting** — margin = sale snapshot minus batch cost (cross-domain report).
- **Sync** — `PriceListItem` has UUID; sync separately from `Medicine`.

## Security Considerations

- Price maintenance permission not yet in seed (future `PRICING:PRICE_LIST:UPDATE`).
- Medicine editors without pricing permission can create catalog entries without setting sale rates.
- Minimum price enforcement prevents unauthorized discounting below floor.

## Performance Considerations

- Cache default branch price list keyed by `branchId`.
- Index `(priceListId, medicineId)` for O(1) billing lookup.
- Bulk price update jobs for GST rate changes across items.

## Future Enhancements

- Customer-segment price lists (wholesale vs retail) via `priceListType` string.
- Time-bound promotional prices without deactivating base item.
- Automatic price list row creation when medicine is created on a branch.
- Link [discount rules](../../database/tables/pricing/50_discount_rule.md) to category or medicine.

See [inventory.md](./inventory.md) for batch cost vs sale price distinction.
