# Sales — Future Enhancements

## Purpose

Track planned extensions to the Sales domain beyond the current `SalesInvoice`-centric model. Prioritize items that depend on schema or cross-domain work.

**Database reference (current):** [Sales overview](../../database/tables/sales/sales.md)

## Responsibilities

- Roadmap for product and engineering
- Avoid implementing roadmap items without explicit approval (additive-only policy)

## Scope

### In Scope

- Documented future capabilities for sales
- Dependencies on other domains

### Out of Scope

- Committed delivery dates
- Implementation detail for unreleased features

## Related Entities

- Current: `SalesInvoice`, `SalesInvoiceItem`, `SalesPayment`, `SalesReturn`, `SalesReturnItem`
- Future: `SalesOrder`, `Quotation`, credit notes, e-invoice payloads

## Business Rules

Future features must preserve:

- Branch-scoped document numbers
- Price/tax snapshot on post
- FEFO at branch stock
- Atomic post with outbox + audit

## Domain Events

Future event types will extend the catalog in [events.md](./events.md) — version outbox payloads accordingly.

## State Model

Future invoice sources (order/quotation) must map cleanly to existing `status` / `paymentStatus` model.

## Integrations

| Initiative | Integration touchpoints |
|------------|-------------------------|
| Sales order | Inventory reservation, invoice conversion |
| Quotation | PDF/email, price list read-only |
| E-invoice | External GST API, new payload tables |
| Delivery | Address, rider app, invoice link |
| Loyalty | Customer domain, discount on post |
| Insurance | Split tender, third-party payer lines |

## Security

- New permissions per resource (`SALES:SALES_ORDER:*`, `SALES:QUOTATION:*`)
- E-invoice credentials in secure settings vault

## Performance

- High-volume chains: read replicas for invoice search; write path stays on primary SQLite per branch device
- Archival of invoices older than retention period to cold storage

## Future

### Near term

1. Additional permissions: cancel posted, approve return, export GST
2. Manager price override with audit reason
3. Stock reservation on draft invoice (setting-gated)

### Medium term

4. [Sales order](./sales-order.md) and [quotation](./quotation.md) tables and workflows
5. Credit note document type
6. Customer portal: view invoices and pay online

### Long term

7. Multi-branch transfer sale (dispatch from another branch)
8. Subscription / repeat Rx auto-refill
9. AI-assisted interaction checks at line add (CDSS)
