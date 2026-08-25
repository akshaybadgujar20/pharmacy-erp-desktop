# Customer Domain

## Purpose

The Customer bounded context manages retail, wholesale, and corporate buyers who purchase medicines and services from the pharmacy. It treats **Party** as the shared identity root and **Customer** as the role-specific extension, coordinating addresses, contacts, credit terms, and loyalty participation without duplicating master data.

## Responsibilities

- Register and maintain customer master data through the Party aggregate.
- Enforce role consistency between `PartyRole` (`CUSTOMER`) and the `Customer` detail record.
- Manage customer-specific financial attributes (credit limit, payment terms) while delegating balance truth to ledger entries.
- Coordinate loyalty program enrollment and point transaction history.
- Expose customer identity to Sales, Prescription, and Finance contexts by stable `uuid`.

## Scope

### In Scope

- Party identity (person or organization) shared with other roles.
- Customer role assignment via `PartyRole`.
- Addresses (`PartyAddress`) and contacts (`PartyContact`).
- Customer type, code, credit limit, payment terms, tax exemption flag.
- Loyalty program configuration consumption and point ledger (`LoyaltyProgram`, `LoyaltyTransaction`).
- Customer activation, deactivation, and soft delete.

### Out of Scope

- Sales invoice posting, pricing, and tax calculation (see [sales](../sales/README.md)).
- Receipt collection and receivable ledger posting (see [finance](../finance/README.md)).
- Prescription clinical validation (see prescription modules).
- Supplier, doctor, and employee role management (see respective domain folders).

## Related Entities

| Entity | Role | Table overview |
|--------|------|----------------|
| Party | Aggregate root for identity | [party_management.md](../../database/tables/party_management/party_management.md) |
| PartyRole | Business role assignment | [02_party_role.md](../../database/tables/party_management/02_party_role.md) |
| PartyAddress | Physical / billing / shipping addresses | [03_party_address.md](../../database/tables/party_management/03_party_address.md) |
| PartyContact | Phone, email, WhatsApp | [04_party_contact.md](../../database/tables/party_management/04_party_contact.md) |
| Customer | Customer-specific attributes | [05_customer.md](../../database/tables/party_management/05_customer.md) |
| LoyaltyProgram | Earning and redemption rules | [loyalty.md](../../database/tables/loyalty/loyalty.md) |
| LoyaltyTransaction | Immutable points history | [52_loyalty_transaction.md](../../database/tables/loyalty/52_loyalty_transaction.md) |

## Business Rules

- Every `Customer` record requires exactly one `Party` and an active `PartyRole` with `roleType = CUSTOMER`.
- `customerCode` is unique within the company scope.
- `creditLimit`, `outstandingAmount`, and `loyaltyPoints` on `Customer` are denormalized caches; authoritative balances come from `LedgerEntry` and `LoyaltyTransaction` respectively.
- Customers are deactivated (`isActive = false`) rather than hard-deleted when historical sales exist.
- A party may hold other roles (e.g., `DOCTOR`) concurrently without a separate identity record.

## Domain Events

| Event | Trigger | Downstream consumers |
|-------|---------|---------------------|
| `CustomerRegistered` | New Party + Customer + CUSTOMER role created | Search index, CRM exports |
| `CustomerUpdated` | Identity or customer attributes changed | Sales UI cache invalidation |
| `CustomerDeactivated` | `isActive` set to false | Block new credit sales |
| `CustomerCreditLimitChanged` | Credit limit modified | Sales credit check |
| `LoyaltyPointsEarned` | Sales invoice posts earn transaction | Customer balance cache refresh |
| `LoyaltyPointsRedeemed` | Redemption on invoice | Pricing / discount application |

## State Model

Customer lifecycle is driven by Party and Customer `isActive` flags plus role activation:

| State | Meaning |
|-------|---------|
| **Draft** | Party created; Customer detail incomplete (UI-only; not persisted as separate status) |
| **Active** | Party active, CUSTOMER role active, Customer `isActive = true` |
| **Inactive** | Customer or role deactivated; historical data retained |
| **Archived** | Soft-deleted (`deletedAt` set); excluded from operational queries |

See [lifecycle.md](lifecycle.md) and [state-machine.md](state-machine.md) for transitions.

## Integrations

- **Sales** — `SalesInvoice.customerId` references `Customer`; walk-in retail may use a default customer.
- **Finance** — Receivables and receipts post to customer sub-ledgers via `LedgerEntry`; see [financial.md](../../database/tables/financial/financial.md).
- **Loyalty** — Earn/redeem flows create `LoyaltyTransaction` rows; see [loyalty.md](../../database/tables/loyalty/loyalty.md).
- **Sync** — All entities expose `uuid` for offline-first replication; local `BigInt` ids are not sync keys.

## Security Considerations

- Master-data changes require `PARTY:PARTY:UPDATE` (`PARTY_MANAGE` permission code). See [permissions.md](permissions.md).
- PII (name, phone, address) is subject to audit logging via `AuditService`.
- Credit limit changes should be restricted to supervisors; loyalty adjustments require separate authorization.
- Tenant isolation: customer records are scoped through branch/company context on transactional documents, not on Party itself in early phases.

## Performance Considerations

- Index lookups by `customerCode`, `displayName` (via Party), and `outstandingAmount` for credit dashboards.
- Loyalty balance: prefer summing `LoyaltyTransaction` for accuracy; cache `loyaltyPoints` on Customer for POS speed with periodic reconciliation.
- Avoid N+1 when loading customer with addresses and contacts; use eager load patterns in application services.

## Future Enhancements

- Customer segmentation and marketing campaigns.
- Corporate contract pricing linked to customer type.
- GDPR-style consent and data export for customer PII.
- Multi-program loyalty enrollment per customer (currently default program driven).

## Document Index

| File | Topic |
|------|-------|
| [aggregate.md](aggregate.md) | Aggregate boundaries and consistency |
| [terminology.md](terminology.md) | Ubiquitous language |
| [business-rules.md](business-rules.md) | Detailed rules |
| [invariants.md](invariants.md) | Must-always-hold constraints |
| [lifecycle.md](lifecycle.md) | Lifecycle phases |
| [state-machine.md](state-machine.md) | State transitions |
| [events.md](events.md) | Event catalog |
| [workflows.md](workflows.md) | Application workflows |
| [validation.md](validation.md) | Input validation |
| [permissions.md](permissions.md) | Authorization |
| [integration.md](integration.md) | Cross-context integration |
| [future.md](future.md) | Roadmap |
