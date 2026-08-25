# Sales — Quotation

## Purpose

Document the **planned** quotation (proforma / estimate) concept for price quotes before a sale is committed.

> **NOT MODELED YET.** There is no `Quotation` or `QuotationItem` table in the current schema. Counter staff bill directly via `SalesInvoice`. This document describes future intent only.

**Database reference (current billing):** [Sales overview](../../database/tables/sales/sales.md)

## Responsibilities

When implemented, quotations would:

- Provide customers a non-binding price estimate with validity period
- Convert to `SalesInvoice` (or future `SalesOrder`) in one action
- Avoid inventory movement until conversion/post

**Today:** none of these are implemented.

## Scope

### In Scope (future)

- Quote header: customer, branch, valid-until date
- Quote lines with medicine, qty, estimated price from `PriceListItem`
- Status: `DRAFT`, `SENT`, `ACCEPTED`, `EXPIRED`, `CONVERTED`, `CANCELLED`

### Out of Scope (today)

- Quotation persistence, printing template, or API
- Sales order (see [sales-order.md](./sales-order.md)) — also future

## Related Entities

**Future (proposed):**

- `Quotation`, `QuotationItem`
- `Customer`, `PriceListItem`
- Conversion: `SalesInvoice`

**Current:**

- `SalesInvoice` (`DRAFT` may serve as informal estimate without quote number)

## Business Rules

*Planned — not in codebase:*

- Quote number unique per branch.
- No stock allocation or movement on quote save.
- Prices informational until invoice post snapshots rates.
- Expired quotes cannot convert without re-price step.
- `CONVERTED` quotes immutable; link `convertedInvoiceId`.

## Domain Events

*Future:* `QuotationCreated`, `QuotationSent`, `QuotationConverted`, `QuotationExpired`.

## State Model

*Future:*

`DRAFT` → `SENT` → `ACCEPTED` → `CONVERTED`  
`SENT` → `EXPIRED` (scheduler)  
Any → `CANCELLED`

## Integrations

*Future:* email/WhatsApp PDF, CRM, convert-to-invoice API.

## Security

*Future:* `SALES:QUOTATION:CREATE`, `SALES:QUOTATION:READ`.

## Performance

*Future:* lightweight documents — no inventory joins on save.

## Future

Implement after business confirms quote-to-cash requirements. Until then:

- Do not add quotation tables without ADR.
- Use printed `DRAFT` invoice preview only if policy allows (no official quote number).

See also [sales-order.md](./sales-order.md) for order-then-bill flow.
