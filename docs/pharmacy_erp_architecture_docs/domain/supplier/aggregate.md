# Supplier — Aggregate Design

## Purpose

Define aggregate boundaries for supplier master data ensuring Party identity, SUPPLIER role, statutory fields, and procurement attributes remain consistent within one transactional unit.

## Responsibilities

- Party as root; Supplier as owned entity.
- Coordinate PartyRole, PartyAddress, PartyContact mutations.
- Expose supplier reference to Purchasing without leaking Party complexity.

## Scope

### In Scope

- Party + Supplier + SUPPLIER role registration and update.

### Out of Scope

- Payment aggregate (Finance) — references Supplier by id.
- PurchaseInvoice aggregate — references Supplier by id.

## Related Entities

```
Party (root)
├── PartyRole[]       — SUPPLIER role
├── PartyAddress[]
├── PartyContact[]
└── Supplier?         — 0..1 detail
         └── referenced by PurchaseOrder, Payment, etc.
```

[party_management.md](../../database/tables/party_management/party_management.md)

## Aggregates

### Party Aggregate (Supplier context)

| Component | Type | Notes |
|-----------|------|-------|
| Party | Root | Identity and isActive |
| PartyRole | Entity | roleType = SUPPLIER |
| PartyAddress | Entity | Registered office, warehouse |
| PartyContact | Entity | Accounts payable contacts |
| Supplier | Entity | supplierCode, gstin, drugLicenseNumber, credit fields |

**Consistency:** Supplier row must not exist without SUPPLIER PartyRole.

### Payment Aggregate (Finance — associated)

| Component | Type | Notes |
|-----------|------|-------|
| Payment | Root | Outgoing money; see [43_payment.md](../../database/tables/financial/43_payment.md) |

Payment is **not** part of Party aggregate; linked via `referenceType` / supplier id.

## Business Rules

- Unique `partyId` on Supplier.
- GSTIN validated for format when present (Indian GST 15-char pattern).
- `preferredSupplier` boolean; multiple preferred allowed per company policy.

## Domain Events

- `SupplierRegistered`, `SupplierUpdated`, `SupplierDeactivated` on aggregate commit.

## State Model

Operational supplier requires Active Party, active SUPPLIER role, `Supplier.isActive = true`.

## Integrations

- SequenceGenerator for `supplierCode`.
- AuditService + Outbox on writes.

## Security Considerations

- Statutory field edits require `PARTY:PARTY:UPDATE` and audit reason.

## Performance Considerations

- Optimistic locking via `version` on Party and Supplier.

## Future Enhancements

- Sub-aggregate for supplier bank accounts when payment file export added.
