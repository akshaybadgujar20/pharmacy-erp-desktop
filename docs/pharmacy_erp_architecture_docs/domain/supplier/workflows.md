# Supplier — Workflows

## Purpose

Application workflows for supplier master-data operations and handoff to payment processing.

## Responsibilities

- Step sequences, services, transaction boundaries.

## Scope

Supplier registration through payment initiation; not full purchase cycle.

## Related Entities

[party_management.md](../../database/tables/party_management/party_management.md), [financial.md](../../database/tables/financial/financial.md).

## Workflows

### WF-S01 — Register supplier

1. Validate GSTIN uniqueness and format.
2. Generate `supplierCode` via SequenceGenerator.
3. UnitOfWork: insert Party, SUPPLIER PartyRole, Supplier, optional address/contact.
4. Audit + outbox `SupplierRegistered`.

**Permission:** `PARTY:PARTY:UPDATE`.

### WF-S02 — Update supplier profile

1. Load aggregate; check `version`.
2. Update statutory fields with audit diff.
3. Emit `SupplierUpdated`.

GSTIN change may require re-validation against government API (future).

### WF-S03 — Mark preferred supplier

1. Toggle `preferredSupplier` flag.
2. Emit `SupplierPreferredChanged`.

Multiple preferred allowed unless policy changed.

### WF-S04 — Deactivate supplier

1. Check open POs (Purchasing query).
2. Set inactive; emit `SupplierDeactivated`.

### WF-S05 — Pay supplier (cross-context)

Detailed in [payments.md](payments.md):

1. User selects supplier and open purchase invoices.
2. PaymentService creates `Payment` (SUPPLIER_PAYMENT).
3. Posts balanced `LedgerEntry` pair.
4. Updates `Supplier.outstandingAmount`.
5. Emit `SupplierPaymentCompleted`.

### WF-S06 — Payable reconciliation

1. Sum Supplier Payable ledger entries per supplier.
2. Update `outstandingAmount` if drift detected.

## Business Rules

Each step enforces [business-rules.md](business-rules.md).

## Domain Events

See [events.md](events.md).

## State Model

WF-S01 → Active; WF-S04 → Inactive.

## Integrations

| Workflow | Context |
|----------|---------|
| WF-S05 | Finance Payment + LedgerEntry |
| WF-S06 | Finance |
| WF-S04 | Purchasing |

## Security Considerations

WF-S05 requires financial payment permission in addition to party read.

## Performance Considerations

WF-S05 should batch ledger entries for multi-invoice allocation in one transaction.

## Future Enhancements

WF-S07 — onboard from scanned drug license OCR.
