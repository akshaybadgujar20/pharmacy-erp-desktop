# Sales — Invoice

## Purpose

`SalesInvoice` is the customer billing document — the legal and operational record of medicines sold at a branch. It captures commercial totals, optional customer and prescription links, document lifecycle, and payment settlement summary. Posting an invoice is the moment inventory leaves the branch and revenue is recognized.

**Database reference:** [SalesInvoice](../../database/tables/sales/38_sales_invoice.md) · [Sales overview](../../database/tables/sales/sales.md)

## Responsibilities

- Assign branch-scoped `invoiceNumber` via `SequenceGenerator` (`documentType = SALES_INVOICE`)
- Maintain header totals: `grossAmount`, `discountAmount`, `taxAmount`, `netAmount`
- Track settlement: `paidAmount`, `balanceAmount`, `paymentStatus`
- Transition `status` through draft, posted, return, and cancelled states
- Coordinate line items that snapshot batch, price, and tax at post time

## Scope

### In Scope

- Draft creation and editing at the counter
- Posting with atomic stock deduction and movement creation
- Cancellation with reversal (where policy allows)
- Prescription-linked and walk-in OTC sales

### Out of Scope

- Payment capture details (see [payment.md](./payment.md))
- Return processing (see [return.md](./return.md))
- Price list maintenance (see [pricing.md](./pricing.md))

## Related Entities

- `SalesInvoiceItem` — one row per dispensed batch line
- `SalesPayment` — settlement records
- `SalesReturn` — reverses all or part of a posted invoice
- `Customer`, `Prescription`, `Branch`
- `StockMovement` — OUT on post

## Business Rules

- Minimum one `SalesInvoiceItem` before post.
- `invoiceNumber` unique per branch: `@@unique([branchId, invoiceNumber])`.
- In `DRAFT`, lines may be added/removed; header totals recalculate from lines.
- On **post** (`status → POSTED`):
  - Resolve each line's batch via FEFO at `branchId`.
  - Snapshot `unitPrice` from `PriceListItem` (and MRP/tax from resolved sources).
  - Create OUT `StockMovement` per line; decrement `Stock.availableQuantity`.
  - Set `paymentStatus` to `UNPAID` unless same-transaction payment zeroes balance.
- Posted invoices cannot be edited; use returns or controlled cancellation.
- `status` values: `DRAFT`, `POSTED`, `PARTIALLY_RETURNED`, `RETURNED`, `CANCELLED`.
- `paymentStatus` values: `UNPAID`, `PARTIALLY_PAID`, `PAID`, `REFUNDED` — updated when payments/refunds change.
- Schedule H medicines: require prescription reference and prescriber/patient fields when configured.
- Soft delete (`deletedAt`) only for drafts; posted invoices never hard-deleted.

## Domain Events

- `SalesInvoiceCreated` — draft persisted
- `SalesInvoicePosted` — stock OUT, totals finalized
- `SalesInvoicePartiallyReturned` / `SalesInvoiceFullyReturned` — driven by return aggregate
- `SalesInvoiceCancelled` — reversal movements if previously posted

## State Model

| status | Editable | Stock impact |
|--------|----------|--------------|
| `DRAFT` | Yes | None |
| `POSTED` | No | OUT applied |
| `PARTIALLY_RETURNED` | No | Net OUT reduced by returns |
| `RETURNED` | No | Fully reversed via returns |
| `CANCELLED` | No | Reversal if was posted |

`paymentStatus` is computed from `SalesPayment` and refund totals, not set manually on post except initial default.

## Integrations

- **SequenceGenerator:** `SI-{BR}-{SEQ}` format per branch seed configuration
- **Inventory:** FEFO allocator + stock service on post
- **Pricing:** Price list resolver per branch/medicine
- **Outbox:** `SalesInvoicePosted` with `entityUuid`
- **Print:** Thermal receipt on post (optional setting)

## Security

- `SALES:SALES_INVOICE:CREATE` — create draft and post
- `SALES:SALES_INVOICE:READ` — view and search
- Post and cancel require branch membership; cross-branch denied

## Performance

- Pre-fetch stock candidates for all medicines on invoice before post (single query per medicine or batched join).
- Denormalized totals on header avoid summing lines on every list page — recalc on line change only.

## Future

- Hold invoice in `DRAFT` with stock reservation (see inventory reservation doc)
- Split billing: insurance vs patient payable portions
- Digital signature on posted invoice PDF
