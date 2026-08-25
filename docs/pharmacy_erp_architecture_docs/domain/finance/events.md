# Finance — Domain Events

## Purpose

Catalog finance domain events for posting, payments, receipts, tax changes, and reconciliation.

## Responsibilities

- Event definitions for outbox, audit, and downstream projections.

## Scope

Finance bounded context events and consumed invoice events.

## Related Entities

[financial.md](../../database/tables/financial/financial.md).

## Event Catalog

### Journal events

| Event | Trigger | Payload | Consumers |
|-------|---------|---------|-----------|
| `LedgerEntryPosted` | Balanced voucher inserted | `voucherType`, `voucherId`, `voucherNumber`, `lineCount`, `totalAmount` | Reports cache, audit |
| `LedgerEntryReversed` | Reversal voucher posted | `originalVoucherId`, `reversalVoucherId` | Audit |

### Payment events

| Event | Trigger | Payload | Consumers |
|-------|---------|---------|-----------|
| `PaymentCreated` | Payment PENDING saved | `paymentUuid`, `paymentType`, `amount` | Audit |
| `PaymentCompleted` | Status COMPLETED + entries | `paymentUuid`, `paymentNumber`, `ledgerEntryUuids[]` | Supplier outstanding, audit |
| `PaymentCancelled` | Reversal posted | `paymentUuid`, `reason` | Supplier outstanding |
| `SupplierPaymentCompleted` | paymentType SUPPLIER_PAYMENT | `supplierUuid`, `amount` | Supplier domain |

### Receipt events

| Event | Trigger | Payload | Consumers |
|-------|---------|---------|-----------|
| `ReceiptCreated` | Receipt PENDING | `receiptUuid`, `receiptType`, `amount` | Audit |
| `ReceiptCompleted` | Status COMPLETED + entries | `receiptUuid`, `receiptNumber` | Customer outstanding |
| `ReceiptCancelled` | Reversal | `receiptUuid` | Customer outstanding |

### Tax events

| Event | Trigger | Payload | Consumers |
|-------|---------|---------|-----------|
| `TaxRateActivated` | New Tax row effective | `taxUuid`, `taxCode`, `taxRate`, `effectiveFrom` | Pricing cache |
| `TaxDeactivated` | isActive false | `taxUuid` | Block new line selection |

### Reconciliation events

| Event | Trigger | Payload | Consumers |
|-------|---------|---------|-----------|
| `OutstandingReconciled` | Job fixes drift | `entityType`, `entityUuid`, `oldBalance`, `newBalance` | Audit |

## Business Rules

- Events emitted only after commit.
- Use uuid in cross-context payloads.

## Domain Events

Naming follows past-tense PascalCase convention.

## State Model

`PaymentCompleted` requires COMPLETED status and posted entries — single atomic transition.

## Integrations

| Subscriber | Events |
|------------|--------|
| Customer cache | ReceiptCompleted |
| Supplier cache | PaymentCompleted (supplier type) |
| Outbox | All completion events |
| AuditService | All mutating events |

Cross-links: [customer/events.md](../customer/events.md), [supplier/events.md](../supplier/events.md).

## Security Considerations

- Financial events in logs must not include full bank account numbers.

## Performance Considerations

- `LedgerEntryPosted` high volume — subscribers must be async via outbox consumer.

## Future Enhancements

- `PeriodClosed` event blocking backdated posts.
