# Supplier — Lifecycle

## Purpose

Describe supplier progression from onboarding through active procurement to deactivation or archival.

## Responsibilities

- Phase definitions, criteria, and integration touchpoints.

## Scope

Supplier master lifecycle; payment lifecycle cross-reference only.

## Related Entities

[party_management.md](../../database/tables/party_management/party_management.md).

## Lifecycle Phases

### 1. Onboarding

- Create Party (typically ORGANIZATION).
- Add SUPPLIER PartyRole.
- Create Supplier with `supplierCode`, type, GSTIN, drug license.
- Add billing address and AP contact.
- **Event:** `SupplierRegistered`.

### 2. Active procurement

- Selected on purchase orders and invoices.
- Payable increases on purchase invoice post (Finance).
- Payments reduce outstanding via `Payment` — [payments.md](payments.md).
- Profile and statutory updates audited.

### 3. Credit relationship

- `paymentTermsDays` drives due date on payables report.
- `creditLimit` may cap concurrent open PO value (future policy).

### 4. Deactivation

- Set `Supplier.isActive = false` when vendor relationship ends.
- Block new POs; allow payment of remaining payables.
- **Event:** `SupplierDeactivated`.

### 5. Archival

- Soft-delete Party when no open PO/payable or with override.
- **Event:** conceptual `SupplierArchived`.

## Business Rules

See [business-rules.md](business-rules.md) BR-S40, BR-S41.

## Domain Events

Per phase in [events.md](events.md).

## State Model

Active → Inactive → Archived; no mandatory Draft persistence.

## Integrations

| Phase | Context |
|-------|---------|
| Active | Purchasing, Finance |
| Deactivation | Purchasing block |
| Payment | Finance Payment aggregate |

## Security Considerations

Onboarding may require manager approval for new GSTIN vendors.

## Performance Considerations

Bulk vendor import during system migration — batch sequences.

## Future Enhancements

- Vendor qualification workflow before Active (samples, certificates).
