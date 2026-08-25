# Customer — Terminology

## Purpose

Establish ubiquitous language for the Customer bounded context so that domain docs, UI labels, API DTOs, and database columns use consistent terms.

## Responsibilities

- Define business terms and map them to persistence models.
- Disambiguate overlapping concepts (Party vs Customer, points balance vs transaction).

## Scope

### In Scope

- Customer domain vocabulary and synonyms to avoid.
- Cross-references to party management and loyalty table names.

### Out of Scope

- Sales invoice line terminology (see [sales/terminology.md](../sales/terminology.md) when available).
- General ledger account naming (see [finance/terminology.md](../finance/ledger.md)).

## Related Entities

Terms map to tables documented under [party_management](../../database/tables/party_management/party_management.md) and [loyalty](../../database/tables/loyalty/loyalty.md).

## Glossary

| Term | Definition | Persistence |
|------|------------|-------------|
| **Party** | A person or organization master record shared across roles | `Party` |
| **Customer** | A party acting as a buyer; holds credit and loyalty attributes | `Customer` |
| **Party Role** | Assignment of a business function to a party | `PartyRole.roleType = CUSTOMER` |
| **Walk-in Customer** | Default retail customer used when no named buyer is selected | Seeded `Customer` + Party |
| **Customer Code** | Human-readable unique identifier (`CUST00001`) | `Customer.customerCode` |
| **Customer Type** | Commercial segment: RETAIL, WHOLESALE, CORPORATE | `Customer.customerType` |
| **Credit Limit** | Maximum outstanding receivable allowed | `Customer.creditLimit` |
| **Outstanding Amount** | Denormalized receivable balance | `Customer.outstandingAmount`; derived from `LedgerEntry` |
| **Payment Terms** | Credit period in days | `Customer.paymentTermsDays` |
| **Tax Exempt** | Flag excluding customer from tax on eligible sales | `Customer.isTaxExempt` |
| **Loyalty Program** | Rules for earning and redeeming points | `LoyaltyProgram` |
| **Loyalty Transaction** | Immutable points movement (earn, redeem, adjust) | `LoyaltyTransaction` |
| **Points Balance** | Sum of posted loyalty transactions | Not a authoritative column; `Customer.loyaltyPoints` is cache |
| **Primary Address** | Default address for a given address type | `PartyAddress.isPrimary` |
| **Display Name** | Name shown across ERP screens | `Party.displayName` |

## Business Rules

- Use **Customer** in user-facing sales flows; use **Party** only in master-data administration screens that manage multiple roles.
- Say **deactivate**, not **delete**, when setting `isActive = false`.
- Say **loyalty transaction**, not **points update**, for audit clarity.

## Domain Events

Event names use PascalCase nouns past tense: `CustomerRegistered`, not `CreateCustomer`.

## State Model

| UI Label | Domain State |
|----------|--------------|
| Active | Party + role + customer all active |
| Inactive | Any layer deactivated |
| Deleted | `deletedAt` populated (soft delete) |

## Integrations

External systems should exchange **uuid** identifiers for Party and Customer, never local numeric ids.

## Security Considerations

- **PII** — personally identifiable information in Party and PartyContact; restrict export.
- **Credit limit** — financial parameter; log changes in audit trail.

## Performance Considerations

- POS search by **display name** or **customer code**; document both in training materials.

## Future Enhancements

- Add **Member** synonym only if subscription model is introduced; until then avoid conflating with loyalty program membership.
