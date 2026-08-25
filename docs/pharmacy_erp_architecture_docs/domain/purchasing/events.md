# Purchasing — Domain Events

## Purpose

Catalog events for purchase orders, goods receipts, invoices, and returns. Events feed outbox/sync, audit, and downstream finance/inventory consumers.

**Database reference:** [Purchase overview](../../database/tables/purchase/purchase.md)

## Responsibilities

- Standardize event names and payloads
- Mark which events require outbox rows

## Scope

### In Scope

- All purchasing aggregate transitions
- Outbox `entityType` mapping

### Out of Scope

- Broker routing configuration

## Related Entities

- `Outbox`, `AuditLog`
- Purchasing headers and items (UUID-identified)

## Business Rules

- Outbox written in same transaction as GRN post and other posts.
- Payload uses `entityUuid` and `entityVersion`.
- Consumers idempotent via `operationId`.

## Domain Events

| Event | When | Outbox | Notes |
|-------|------|--------|-------|
| `PurchaseOrderCreated` | PO draft saved | Optional | |
| `PurchaseOrderUpdated` | Draft edit | Optional | |
| `PurchaseOrderSubmittedForApproval` | Submit | Optional | |
| `PurchaseOrderApproved` | Approved | **Yes** | Approver id |
| `PurchaseOrderRejected` | Back to draft | Audit | |
| `PurchaseOrderSentToSupplier` | Mark sent | **Yes** | |
| `GoodsReceiptPosted` | GRN post | **Yes** | Batch/stock created |
| `PurchaseOrderPartiallyReceived` | After GRN rollup | Derived | |
| `PurchaseOrderCompleted` | Full receipt | **Yes** | |
| `PurchaseOrderForceClosed` | Force close | **Yes** | Reason |
| `PurchaseOrderCancelled` | PO cancel | **Yes** | |
| `PurchaseInvoicePosted` | Invoice post | **Yes** | AP |
| `PurchaseInvoiceCancelled` | Cancel | **Yes** | |
| `PurchaseReturnApproved` | Return post | **Yes** | Stock OUT |
| `BatchCreated` | New lot on GRN | Internal | Inventory domain may echo |

## State Model

Events align to PO status enum and GRN `DRAFT`/`POSTED`/`CANCELLED`.

## Integrations

- **OutboxService:** entity types `PURCHASE_ORDER`, `GOODS_RECEIPT`, `PURCHASE_INVOICE`, `PURCHASE_RETURN`
- **AuditService:** module `PURCHASE`, actions per document
- **Sync:** Desktop ↔ HO replication ordered by sequence

## Security

- Event payloads exclude supplier bank details; sanitize in logs.

## Performance

- Single outbox row per post operation with compact JSON payload; line details by reference UUID list.

## Future

- Event schema registry with version field
- Real-time HO dashboard on `GoodsReceiptPosted`
