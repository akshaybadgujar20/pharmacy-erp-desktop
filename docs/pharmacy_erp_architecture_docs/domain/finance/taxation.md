# Finance — Taxation

## Purpose

Document tax master data (`Tax`) and how pricing and transactional modules consume rates for GST-compliant pharmacy billing.

## Responsibilities

- Tax configuration rules, effective dating, and integration with invoice lines.
- Clarify Tax lives in pricing tables but is finance-owned conceptually.

## Scope

Tax master — not invoice tax calculation algorithms (Sales/Purchasing).

## Related Entities

[49_tax.md](../../database/tables/pricing/49_tax.md), pricing context, [financial.md](../../database/tables/financial/financial.md) for GST ledger postings.

## Tax Master Model

Central `Tax` table defines:

| Field | Purpose |
|-------|---------|
| `taxCode` | Short code (GST18, GST5) |
| `taxName` | Display label |
| `taxType` | GST, CGST, SGST, IGST, CESS |
| `taxRate` | Percentage 0–100 |
| `effectiveFrom` / `effectiveTo` | Rate validity window |
| `isActive` | Selectable on new transactions |

### Typical pharmacy GST rates (India)

| taxCode | Rate | Use |
|---------|-----:|-----|
| GST0 | 0% | Exempt / zero-rated |
| GST5 | 5% | Essential medicines (schedule) |
| GST12 | 12% | Selected formulations |
| GST18 | 18% | General pharma products |
| GST28 | 28% | Cosmetics / non-schedule (policy) |

Split CGST/SGST for intra-state; IGST for inter-state — application logic on invoice post.

## Business Rules

| ID | Rule |
|----|------|
| BR-F40 | taxCode unique |
| BR-F41 | 0 ≤ taxRate ≤ 100 |
| BR-F42 | Inactive tax blocked on new lines |
| BR-F43 | Never edit rate after use — new row with new effectiveFrom |
| BR-F44 | Invoice line snapshots taxRate at post |

Customer `isTaxExempt` flag — [05_customer.md](../../database/tables/party_management/05_customer.md) — may zero tax on eligible sales.

## Domain Events

- `TaxRateActivated`, `TaxDeactivated` — [events.md](events.md).

## State Model

Tax effective window independent of Payment/Receipt lifecycle.

## Integrations

| Consumer | Usage |
|----------|-------|
| PriceListItem | Default tax on price list |
| SalesInvoiceItem | Snapshotted tax on post |
| PurchaseInvoiceItem | Input tax credit |
| Ledger posting | GST Input/Output accounts |

Pricing tables overview: tax referenced alongside branch price lists in product/pricing docs.

Finance GL: tax component of invoice posts to GST ledgers — [accounting.md](accounting.md).

## Workflow WF-TAX01 — Rate change

1. End-date current Tax row (`effectiveTo`).
2. Insert new row with new rate and `effectiveFrom`.
3. Invalidate pricing cache.
4. Historical invoices unchanged (snapshot preserved).

## Security Considerations

- Tax master edit admin-only; affects statutory reporting.

## Performance Considerations

- Cache active taxes by date in memory for POS barcode scans.

## Future Enhancements

- HSN/SAC code mapping per medicine.
- GSTR-1 / GSTR-3B export from ledger + invoice snapshots.
- CESS and compensation cess rules.

## Cross-Links

- [party_management — Customer tax exempt](../../database/tables/party_management/05_customer.md)
- [loyalty.md](../../database/tables/loyalty/loyalty.md) — loyalty discounts separate from tax base (policy)
