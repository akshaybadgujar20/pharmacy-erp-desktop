# Supplier — Domain Events

## Purpose

Catalog domain events for supplier master data changes and finance-triggered payment events affecting supplier payables.

## Responsibilities

- Event names, payloads, producers, consumers.

## Scope

Supplier aggregate events; Payment events consumed by supplier context.

## Related Entities

Supplier, Payment — [financial.md](../../database/tables/financial/financial.md).

## Event Catalog

### Supplier master events

| Event | Trigger | Payload | Consumers |
|-------|---------|---------|-----------|
| `SupplierRegistered` | Onboarding complete | `supplierUuid`, `partyUuid`, `supplierCode`, `supplierType`, `gstin` | Audit, outbox, search |
| `SupplierUpdated` | Profile/statutory edit | `supplierUuid`, `changedFields[]`, `version` | Audit, purchasing cache |
| `SupplierDeactivated` | isActive false | `supplierUuid`, `reason` | PO block list |
| `SupplierReactivated` | Reverse deactivation | `supplierUuid` | PO allow list |
| `SupplierPreferredChanged` | preferredSupplier toggle | `supplierUuid`, `preferred` | PO sort cache |

### Finance events (consumed)

| Event | Producer | Payload | Supplier impact |
|-------|----------|---------|-----------------|
| `SupplierPaymentCompleted` | Payment service | `paymentUuid`, `supplierUuid`, `amount`, `paymentNumber` | Reduce outstanding cache |
| `SupplierPaymentCancelled` | Payment reversal | `paymentUuid`, `reversalEntries` | Restore outstanding |
| `PurchaseInvoicePosted` | Purchasing | `supplierUuid`, `payableAmount` | Increase outstanding |

## Business Rules

- Events use uuid identifiers for sync.
- `PurchaseInvoicePosted` owned by Purchasing but updates Supplier denormalized balance.

## Domain Events

Emit after UnitOfWork commit via outbox.

## State Model

`SupplierDeactivated` does not auto-cancel open POs — separate purchasing policy.

## Integrations

| Consumer | Events |
|----------|--------|
| AuditService | All supplier master events |
| Outbox | Registered, Updated |
| Purchasing UI | Deactivated, PreferredChanged |
| Reconciliation job | PaymentCompleted, PurchaseInvoicePosted |

## Security Considerations

Mask PAN in event payloads on sync to branch devices.

## Performance Considerations

Debounce rapid PreferredChanged during bulk import.

## Future Enhancements

`SupplierContractSigned` when contracts module exists.
