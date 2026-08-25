# Supplier Domain

## Purpose

The Supplier bounded context manages vendors, manufacturers, distributors, and wholesalers who supply medicines and goods to the pharmacy. Like Customer, it builds on the shared **Party** identity model with a **Supplier** role extension, procurement attributes, and payable balance tracking integrated with Finance payments.

## Responsibilities

- Register and maintain supplier master data via the Party aggregate.
- Enforce SUPPLIER role consistency with the Supplier detail record.
- Store statutory identifiers (GSTIN, drug license, PAN) required for pharmacy compliance.
- Track credit terms and denormalized payable outstanding linked to ledger truth.
- Provide supplier identity to Purchasing and Payment workflows.

## Scope

### In Scope

- Party + Supplier + SUPPLIER PartyRole.
- PartyAddress and PartyContact for supplier communication.
- Supplier type, codes, preferred flag, credit limit, payment terms.
- Outgoing supplier payments via Finance `Payment` aggregate (cross-context).

### Out of Scope

- Purchase order, GRN, purchase invoice workflows ([purchasing](../purchasing/README.md)).
- Supplier contracts and rate agreements — **not modeled**; see [contracts.md](contracts.md).
- Goods receipt quality inspection (Purchasing/Inventory).

## Related Entities

| Entity | Table overview |
|--------|----------------|
| Party | [party_management.md](../../database/tables/party_management/party_management.md) |
| PartyRole | [02_party_role.md](../../database/tables/party_management/02_party_role.md) |
| PartyAddress | [03_party_address.md](../../database/tables/party_management/03_party_address.md) |
| PartyContact | [04_party_contact.md](../../database/tables/party_management/04_party_contact.md) |
| Supplier | [06_supplier.md](../../database/tables/party_management/06_supplier.md) |
| Payment | [43_payment.md](../../database/tables/financial/43_payment.md) |
| Financial overview | [financial.md](../../database/tables/financial/financial.md) |

## Business Rules

- Every Supplier requires one Party and SUPPLIER PartyRole.
- `supplierCode` unique; `gstin` unique when provided.
- `outstandingAmount` reflects payables; authoritative balance from `LedgerEntry`.
- Preferred supplier flag influences PO suggestions but does not block other suppliers.
- Deactivate instead of delete when purchase history exists.

## Domain Events

| Event | Trigger |
|-------|---------|
| `SupplierRegistered` | New supplier master saved |
| `SupplierUpdated` | Profile or statutory fields changed |
| `SupplierDeactivated` | isActive false |
| `SupplierPaymentCompleted` | Payment posted against supplier payable (Finance) |

## State Model

| State | Meaning |
|-------|---------|
| **Active** | Party, role, Supplier all active |
| **Inactive** | Deactivated; no new POs |
| **Archived** | Soft-deleted Party |

## Integrations

- **Purchasing** — PO, GRN, PurchaseInvoice reference `Supplier`.
- **Finance** — `Payment` with `paymentType = SUPPLIER_PAYMENT` reduces payable; see [payments.md](payments.md).
- **Sync** — uuid-based replication.

## Security Considerations

- Master data: `PARTY:PARTY:UPDATE`.
- Payments: financial Payment permissions (planned `FINANCE:PAYMENT:CREATE`).
- GSTIN and drug license are sensitive compliance data — audit all changes.

## Performance Considerations

- Index by `supplierCode`, `gstin`, `preferredSupplier` for PO entry autocomplete.

## Future Enhancements

- Supplier contracts module — see [contracts.md](contracts.md).
- Vendor performance scorecard from GRN rejection rates.

## Document Index

| File | Topic |
|------|-------|
| [aggregate.md](aggregate.md) | Aggregate design |
| [terminology.md](terminology.md) | Glossary |
| [business-rules.md](business-rules.md) | Rules |
| [lifecycle.md](lifecycle.md) | Lifecycle |
| [workflows.md](workflows.md) | Workflows |
| [validation.md](validation.md) | Validation |
| [permissions.md](permissions.md) | Authorization |
| [payments.md](payments.md) | Supplier payments |
| [contracts.md](contracts.md) | Contracts (not modeled) |
| [events.md](events.md) | Domain events |
| [future.md](future.md) | Roadmap |
