# Sales — Domain Events

## Purpose

Catalog events emitted by the Sales domain when invoice, payment, and return lifecycles change. Events drive audit trails, outbox/sync replication, downstream finance/inventory reactions, and operational reporting.

**Database reference:** [Sales overview](../../database/tables/sales/sales.md)

## Responsibilities

- Name events consistently with past-tense verbs
- Specify payload identifiers (`entityUuid`, not local `id`)
- Clarify which events write to `Outbox` vs audit-only

## Scope

### In Scope

- Events from `SalesInvoice`, `SalesPayment`, `SalesReturn` aggregates
- Outbox operation mapping
- Audit module constants for sales actions

### Out of Scope

- Inventory-internal events (`StockAdjusted`) — Inventory domain
- Message broker topology (future)

## Related Entities

- `Outbox` — sync payload with `entityUuid`, `operationId`, `sequenceNo`
- `AuditLog` — business audit via `AuditService`
- `SalesInvoice`, `SalesPayment`, `SalesReturn`

## Business Rules

- Every **post** operation emits outbox entry in the same DB transaction as the business write.
- Event payload includes `entityVersion` (optimistic lock version) for conflict detection on sync.
- Use UUID for cross-device identity; never publish local `BigInt id` to sync consumers.
- Idempotent consumers: `operationId` or `(entityUuid, sequenceNo)` dedupe.

## Domain Events

| Event | When | Outbox | Key payload fields |
|-------|------|--------|-------------------|
| `SalesInvoiceCreated` | Draft saved | Optional | `entityUuid`, `branchId`, `status=DRAFT` |
| `SalesInvoiceUpdated` | Draft line/total change | Optional | `entityUuid`, `entityVersion` |
| `SalesInvoicePosted` | Post success | **Yes** | `entityUuid`, `invoiceNumber`, `netAmount`, line batch snapshots |
| `SalesPaymentRecorded` | Payment COMPLETED | **Yes** | `paymentUuid`, `salesInvoiceUuid`, `paymentAmount` |
| `SalesPaymentCancelled` | Payment voided | **Yes** | `paymentUuid`, reason |
| `SalesReturnCreated` | Return draft | Optional | `returnUuid`, `salesInvoiceUuid` |
| `SalesReturnApproved` | Return posted | **Yes** | `returnUuid`, lines, stock IN refs |
| `SalesReturnRefunded` | Refund completed | **Yes** | `returnUuid`, `refundAmount` |
| `SalesInvoiceCancelled` | Invoice cancelled | **Yes** | `entityUuid`, reversal refs |
| `SalesInvoicePartiallyReturned` | Cumulative partial | Derived | `entityUuid`, returned totals |
| `SalesInvoiceFullyReturned` | All qty returned | Derived | `entityUuid` |

## State Model

Events align to transitions on:

- Invoice `status`: `DRAFT` → `POSTED` → `PARTIALLY_RETURNED` | `RETURNED` | `CANCELLED`
- Invoice `paymentStatus`: `UNPAID` → `PARTIALLY_PAID` → `PAID` | `REFUNDED`

## Integrations

- **OutboxService:** `entityType` constants for `SALES_INVOICE`, `SALES_PAYMENT`, `SALES_RETURN`
- **AuditService:** `SALES_INVOICE_POST`, `SALES_PAYMENT_RECORD`, etc.
- **Sync clients:** Subscribe to outbox ordered by `sequenceNo` per device

## Security

- Event payloads exclude full patient PII in outbox; sync clients re-fetch authorized detail via API.
- Log sanitizer strips payment instrument details from structured logs.

## Performance

- Batch outbox inserts when posting invoice + payments in one transaction (single commit).
- Archive processed outbox rows per retention policy.

## Future

- Webhook notifications for `SalesInvoicePosted` to external ERP
- Event catalog versioning for schema evolution
