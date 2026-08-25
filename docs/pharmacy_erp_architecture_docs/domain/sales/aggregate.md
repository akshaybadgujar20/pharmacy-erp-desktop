# Sales — Aggregate Model

## Purpose

Define the bounded context and aggregate boundaries for retail sales. The primary aggregate is **SalesInvoice**: the consistency boundary for billing lines, stock consumption, payments, and return eligibility. Child entities (`SalesInvoiceItem`, `SalesPayment`, `SalesReturn`) are owned through the invoice lifecycle or linked return aggregate.

**Database reference:** [Sales tables overview](../../database/tables/sales/sales.md)

## Responsibilities

- Declare which entities form a single transactional unit
- Specify invariants enforced inside vs outside the aggregate
- Map aggregate roots to persistence tables and sync identity (`uuid`)
- Clarify that SalesOrder/Quotation are **not** part of the current model

## Scope

### In Scope

- Aggregate root: `SalesInvoice`
- Entities: `SalesInvoiceItem`, `SalesPayment`
- Related aggregate: `SalesReturn` (references posted `SalesInvoice`)
- Cross-aggregate reads: `Stock`, `PriceListItem`, `Batch` (no direct mutation except via domain services)

### Out of Scope

- Inventory aggregate (`Batch`, `Stock`, `StockMovement`) — owned by Inventory domain
- Pricing master (`PriceList`, `PriceListItem`) — owned by Product/Pricing domain
- `SalesOrder`, `Quotation` — not modeled

## Related Entities

```
SalesInvoice (root)
 ├── SalesInvoiceItem[*]
 ├── SalesPayment[*]
 └── SalesReturn[*] (separate root, FK to invoice)
      └── SalesReturnItem[*]
```

| Table | Aggregate | Notes |
|-------|-----------|-------|
| `SalesInvoice` | Root | Owns totals, status, paymentStatus |
| `SalesInvoiceItem` | Child | Batch snapshot, immutable after POSTED |
| `SalesPayment` | Child | Multiple per invoice |
| `SalesReturn` | Root (linked) | Must reference one POSTED invoice |
| `SalesReturnItem` | Child of return | Restores stock to original batch when possible |

## Business Rules

- Only `SalesInvoice` in `DRAFT` may add/remove/edit lines.
- Posting the invoice is the sole operation that decrements branch `Stock` for its lines.
- `SalesPayment` totals update invoice `paidAmount`, `balanceAmount`, and `paymentStatus` but do not change invoice `status` from `POSTED` unless cancelled.
- `SalesReturn` may only be created against `POSTED` or `PARTIALLY_RETURNED` invoices.
- Return lines must reference medicines/batches that appeared on the original invoice (or subset thereof).
- UUID is the sync identity; local `BigInt id` is for FK performance only.

## Domain Events

- Events are raised from aggregate roots: `SalesInvoicePosted`, `SalesPaymentRecorded`, `SalesReturnApproved`.
- Outbox payload carries `entityUuid` and `entityVersion` for the root entity.

## State Model

| Aggregate | Primary state field | Values |
|-----------|---------------------|--------|
| `SalesInvoice` | `status` | `DRAFT`, `POSTED`, `PARTIALLY_RETURNED`, `RETURNED`, `CANCELLED` |
| `SalesInvoice` | `paymentStatus` | `UNPAID`, `PARTIALLY_PAID`, `PAID`, `REFUNDED` |
| `SalesPayment` | `status` | `PENDING`, `COMPLETED`, `FAILED`, `CANCELLED`, `REFUNDED` |
| `SalesReturn` | `status` | `DRAFT`, `APPROVED`, `REFUNDED`, `CANCELLED` |

Invoice document state and payment state evolve independently but are reconciled on read models.

## Integrations

- **UnitOfWork:** All aggregate mutations that affect inventory run inside `UnitOfWork.run(tx)`.
- **InventoryLedger / StockMovement:** Called from invoice post and return approve — not embedded in invoice table.
- **SequenceGenerator:** Allocates `invoiceNumber` per branch on first save of draft or on post (policy: on post).

## Security

- Aggregate mutations require branch-scoped authorization.
- Cross-branch invoice access is denied even if user knows UUID.

## Performance

- Load invoice aggregate with items + payments in one query for post validation.
- Do not load entire customer history when opening a draft — paginate list endpoints.

## Future

- Optional `SalesOrder` aggregate as upstream draft that converts to invoice (not in schema today)
- Event sourcing read models for counter shift summaries
