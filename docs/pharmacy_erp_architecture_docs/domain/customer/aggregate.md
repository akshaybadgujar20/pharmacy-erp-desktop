# Customer — Aggregate Design

## Purpose

Define aggregate boundaries for customer master data so that identity, role assignment, contact details, and customer-specific attributes remain consistent within a single transactional unit of work.

## Responsibilities

- Treat **Party** as the aggregate root for shared identity.
- Treat **Customer** as a child entity owned exclusively by its Party.
- Coordinate **PartyRole**, **PartyAddress**, and **PartyContact** mutations through the Party application service.
- Delegate loyalty ledger writes to the Loyalty subdomain while enforcing customer existence invariants.

## Scope

### In Scope

- Party + Customer + CUSTOMER PartyRole as the primary consistency boundary for registration and update.
- Address and contact collections owned by Party.
- Customer code generation and type assignment.

### Out of Scope

- LoyaltyProgram configuration (master data owned by loyalty configuration service).
- LoyaltyTransaction posting (triggered by Sales aggregate on invoice post).
- Ledger balance updates (Finance aggregate).

## Related Entities

```
Party (root)
├── PartyRole[]          — includes CUSTOMER role
├── PartyAddress[]
├── PartyContact[]
└── Customer?            — 0..1 detail record
         └── LoyaltyTransaction[]  — referenced, not owned
```

Database reference: [party_management.md](../../database/tables/party_management/party_management.md).

## Aggregates

### Party Aggregate (Customer context)

| Component | Type | Notes |
|-----------|------|-------|
| Party | Root | `partyType`, `displayName`, person/org names, `isActive` |
| PartyRole | Entity | `roleType = CUSTOMER`; unique per party per role type |
| PartyAddress | Entity | `addressType`: HOME, WORK, BILLING, SHIPPING |
| PartyContact | Entity | `contactType`: PHONE, EMAIL, WHATSAPP |
| Customer | Entity | `customerCode`, `customerType`, credit fields, loyalty cache |

**Consistency rule:** Creating a Customer must atomically ensure a CUSTOMER `PartyRole` exists. Removing the Customer role must not orphan a Customer row.

### Loyalty (associated aggregate)

| Component | Type | Notes |
|-----------|------|-------|
| LoyaltyProgram | Root (config) | See [loyalty.md](../../database/tables/loyalty/loyalty.md) |
| LoyaltyTransaction | Entity | Append-only; references `customerId` |

Loyalty transactions are **not** modified through the Party aggregate; they are created by Sales/Finance workflows.

## Business Rules

- One Party → at most one Customer record (`partyId` unique on Customer).
- Customer creation assigns `customerCode` via sequence generator scoped to company.
- Address marked `isPrimary` for a given `addressType` should be unique per party (application enforced).
- Soft delete sets `deletedAt` on Party and cascades visibility to Customer; sync uses `uuid`.

## Domain Events

Emitted after successful `UnitOfWork` commit:

- `CustomerRegistered` — payload: `partyUuid`, `customerUuid`, `customerCode`, `customerType`
- `CustomerProfileUpdated` — changed fields diff for audit
- `CustomerRoleRevoked` — CUSTOMER role deactivated

## State Model

Aggregate-level status derives from:

- `Party.isActive`
- `PartyRole.isActive` where `roleType = CUSTOMER`
- `Customer.isActive`

All three must be true for **operational active** customer.

## Integrations

- **SequenceGenerator** — `customerCode` document type.
- **AuditService** — same transaction as Party/Customer writes.
- **Outbox** — entity sync events keyed on Party/Customer `uuid`.

## Security Considerations

- Aggregate mutations gated by `PARTY:PARTY:UPDATE`.
- Read access may be broader (`SALES_VIEW`) for invoice creation without edit rights.

## Performance Considerations

- Load aggregate with single query + joins for roles, one customer row, optional address/contact collections.
- Optimistic concurrency via `version` on Party and Customer; reject stale updates with conflict error.

## Future Enhancements

- Split read model (CustomerSummary projection) for POS search without loading full aggregate.
- Domain service for cross-role party merge (same person registered twice).
