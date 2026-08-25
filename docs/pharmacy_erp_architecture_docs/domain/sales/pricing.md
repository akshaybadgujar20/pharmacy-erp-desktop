# Sales — Pricing

## Purpose

Sales pricing determines what the customer pays at the counter. **Branch-scoped `PriceListItem`** is the authoritative sale price source. `Batch` carries lot cost (`purchaseRate`) and statutory MRP only — not `saleRate`. Line items on `SalesInvoiceItem` snapshot resolved prices at post time for audit and historical accuracy.

**Database reference:** [PriceListItem](../../database/tables/pricing/48_price_list_item.md) · [Sales overview](../../database/tables/sales/sales.md)

## Responsibilities

- Resolve active branch `PriceList` and `PriceListItem` for each medicine on the invoice
- Apply tax from linked `Tax` record (percent snapshotted on line)
- Apply line/header discounts per policy
- Enforce MRP ceiling where regulations require selling price ≤ batch MRP
- Snapshot all commercial fields on post — never re-read master price for posted lines

## Scope

### In Scope

- Price resolution at invoice build and post
- Discount percent/amount on lines
- Tax calculation and line totals
- Effective date validation on price list items

### Out of Scope

- Maintaining price lists (Product/Pricing admin)
- Purchase valuation (Batch.purchaseRate)
- Promotional campaigns / dynamic pricing engines (future)

## Related Entities

- `PriceList`, `PriceListItem` — branch sale price
- `Tax` — GST/VAT percent
- `Medicine` — product identity
- `Batch` — statutory `mrp` for cap checks
- `SalesInvoiceItem` — stores `unitPrice`, `taxPercent`, `taxAmount`, `lineAmount`

## Business Rules

- Resolution order: branch `PriceList` → active `PriceListItem` for `(priceListId, medicineId)` → fallback company default list if configured.
- Inactive or expired `PriceListItem` cannot be used; block post with clear error.
- `unitPrice` on line = resolved `sellingPrice` minus line discount.
- Tax computed on taxable base per local GST rules; snapshotted on line.
- If `unitPrice > batch.mrp` and `ENFORCE_MRP_CAP` setting true → validation error.
- After POSTED, changing `PriceListItem` does not alter historical invoice lines.
- Header `discountAmount` may distribute to lines or apply after line totals — policy fixed per implementation.

## Domain Events

- `SalesPriceResolved` (internal) — during draft save/post validation
- `SalesInvoicePosted` — prices frozen on lines

## State Model

Pricing masters use `isActive` and optional effective dates — not invoice lifecycle states. Invoice lines have no price state beyond parent invoice `status`.

## Integrations

- **Settings:** `ENFORCE_MRP_CAP`, default price list per branch
- **Product domain:** Medicine inactive → block sale
- **Tax reporting:** Snapshotted tax on lines feeds GST reports

## Security

- Price list edits require pricing admin permissions, not counter staff.
- Optional permission to override price on line with manager PIN (future).

## Performance

- Cache `(branchId → priceListId → Map<medicineId, PriceListItem>)` with invalidation on admin update.
- Batch-resolve prices for all cart lines in one query: `WHERE medicineId IN (...)`.

## Future

- Customer-segment price lists (loyalty tier)
- Time-of-day pricing
- Bundled SKU pricing
