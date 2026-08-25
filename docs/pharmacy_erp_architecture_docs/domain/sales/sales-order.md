# Sales — Sales Order

## Purpose

Document the **planned** sales order concept for customer orders placed before dispensing/billing. This clarifies scope for product owners and developers.

> **NOT MODELED YET.** There is no `SalesOrder` or `SalesOrderItem` table in the current Prisma schema. Retail billing goes directly to `SalesInvoice`. This document describes future intent only.

**Database reference (current billing):** [Sales overview](../../database/tables/sales/sales.md)

## Responsibilities

When implemented, a sales order would:

- Capture customer intent (phone order, delivery request, reserved medicines)
- Hold requested quantities optionally via stock reservation
- Convert to `SalesInvoice` on fulfillment without re-entering lines

**Today:** none of these are implemented.

## Scope

### In Scope (future)

- Order header with customer, branch, requested delivery date
- Order lines with medicine and qty (batch TBD at invoice)
- Status: `DRAFT`, `CONFIRMED`, `PARTIALLY_FULFILLED`, `FULFILLED`, `CANCELLED`

### Out of Scope (today)

- Any persistence or API for sales orders
- Quotation (see [quotation.md](./quotation.md))

## Related Entities

**Future (proposed):**

- `SalesOrder`, `SalesOrderItem`
- `Customer`, `Branch`, `Medicine`
- Conversion target: `SalesInvoice`

**Current:**

- `SalesInvoice` only

## Business Rules

*Planned rules — not enforced in codebase:*

- Order number unique per branch (same pattern as invoice).
- Fulfillment creates invoice; order line `fulfilledQty` increments.
- Cannot delete confirmed order with partial fulfillment — cancel remainder only.
- Pricing at order time may be indicative; invoice post snapshots final `PriceListItem`.

## Domain Events

*Future:* `SalesOrderCreated`, `SalesOrderConfirmed`, `SalesOrderFulfilled`, `SalesOrderCancelled`.

## State Model

*Future proposed states:*

`DRAFT` → `CONFIRMED` → `PARTIALLY_FULFILLED` → `FULFILLED` | `CANCELLED`

## Integrations

*Future:* inventory reservation, delivery module, SMS notifications.

## Security

*Future:* permissions such as `SALES:SALES_ORDER:CREATE`, `SALES:SALES_ORDER:READ`.

## Performance

*Future:* index orders by `(branchId, status, requestedDate)`.

## Future

This entire document describes a **future enhancement**. Implementation requires:

1. Schema design for `SalesOrder` / `SalesOrderItem`
2. ADR on order vs invoice numbering
3. Reservation integration with Inventory domain
4. UI for order queue and convert-to-invoice action

Until then, use **SalesInvoice** in `DRAFT` as an informal hold if needed, understanding that stock is not reserved.
