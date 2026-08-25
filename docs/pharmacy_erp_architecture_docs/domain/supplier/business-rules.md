# Supplier — Business Rules

## Purpose

Enforceable rules for supplier master data, statutory compliance fields, and payable behavior.

## Responsibilities

- Document rule IDs, enforcement layer, and cross-context effects.

## Scope

Supplier aggregate; payment rules summarized — detail in [payments.md](payments.md).

## Related Entities

[06_supplier.md](../../database/tables/party_management/06_supplier.md), [43_payment.md](../../database/tables/financial/43_payment.md).

## Business Rules

### Identity and role

| ID | Rule | Enforcement |
|----|------|-------------|
| BR-S01 | Every Supplier references exactly one Party | DB FK |
| BR-S02 | At most one Supplier per Party | Unique partyId |
| BR-S03 | SUPPLIER PartyRole required before first PO | Application |
| BR-S04 | supplierCode unique per company | DB + sequence |

### Statutory

| ID | Rule | Enforcement |
|----|------|-------------|
| BR-S10 | gstin unique when not null | DB unique |
| BR-S11 | gstin format validated for Indian pharmacies | Validation |
| BR-S12 | drugLicenseNumber recommended for MANUFACTURER/DISTRIBUTOR | Warning |
| BR-S13 | panNumber format validated when present | Validation |

### Financial

| ID | Rule | Enforcement |
|----|------|-------------|
| BR-S20 | creditLimit ≥ 0 | Validation |
| BR-S21 | outstandingAmount ≥ 0 | Validation; ledger sync |
| BR-S22 | outstandingAmount updated from payable ledger, not manual entry | Job |
| BR-S23 | Payment amount ≤ outstanding + tolerance for advance payments | Payment service |

### Procurement

| ID | Rule | Enforcement |
|----|------|-------------|
| BR-S30 | Inactive supplier blocked on new PO | Purchasing |
| BR-S31 | preferredSupplier influences sort order, not exclusivity | UI |
| BR-S32 | supplierType guides required fields (license for pharma) | Validation |

### Lifecycle

| ID | Rule | Enforcement |
|----|------|-------------|
| BR-S40 | Soft delete only with history | Application |
| BR-S41 | Cannot delete supplier referenced by open PO | Purchasing guard |

## Domain Events

Rule violations return domain errors; successful operations emit events per [events.md](events.md).

## State Model

BR-S30 applies only when supplier not Active.

## Integrations

- Purchasing enforces BR-S30, BR-S41.
- Finance enforces BR-S23 on [Payment](../../database/tables/financial/43_payment.md).

## Security Considerations

- Statutory field changes logged with before/after in audit.

## Performance Considerations

- GSTIN lookup index for duplicate detection at registration.

## Future Enhancements

- Contract price list rules when contracts module exists.
