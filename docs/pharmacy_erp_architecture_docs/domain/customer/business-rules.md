# Customer — Business Rules

## Purpose

Catalog enforceable business rules for customer master data, loyalty participation, and credit behavior that application services and validators must implement consistently.

## Responsibilities

- Document rule intent, enforcement layer, and failure behavior.
- Align rules with [05_customer.md](../../database/tables/party_management/05_customer.md) and loyalty tables.

## Scope

### In Scope

- Registration, update, deactivation, credit, loyalty, and role rules.

### Out of Scope

- Sales pricing rules, invoice posting, payment allocation (Sales/Finance domains).

## Related Entities

Party, PartyRole, PartyAddress, PartyContact, Customer, LoyaltyProgram, LoyaltyTransaction — see [party_management.md](../../database/tables/party_management/party_management.md) and [loyalty.md](../../database/tables/loyalty/loyalty.md).

## Business Rules

### Identity and role

| ID | Rule | Enforcement |
|----|------|-------------|
| BR-C01 | Every Customer must reference exactly one Party | DB FK + application |
| BR-C02 | A Party may have at most one Customer record | Unique `partyId` |
| BR-C03 | Customer must have CUSTOMER role in PartyRole before first sale | Application on activate |
| BR-C04 | Same role type cannot be duplicated on one Party | Unique (partyId, roleType) |
| BR-C05 | `displayName` is required and used as primary search key | Validation |

### Customer classification

| ID | Rule | Enforcement |
|----|------|-------------|
| BR-C10 | `customerType` ∈ {RETAIL, WHOLESALE, CORPORATE} | Validation |
| BR-C11 | `customerCode` unique per company | DB unique + sequence |
| BR-C12 | WHOLESALE and CORPORATE may require credit limit > 0 before credit sale | Sales integration |

### Financial attributes

| ID | Rule | Enforcement |
|----|------|-------------|
| BR-C20 | `creditLimit` ≥ 0 | Validation |
| BR-C21 | `outstandingAmount` ≥ 0 | Validation; prefer ledger-derived |
| BR-C22 | Credit sale blocked when outstanding + invoice total > credit limit | Sales service |
| BR-C23 | `paymentTermsDays` ≥ 0 | Validation |
| BR-C24 | Do not manually set `outstandingAmount` except reconciliation job | Application policy |

### Loyalty

| ID | Rule | Enforcement |
|----|------|-------------|
| BR-C30 | Points balance = sum of posted LoyaltyTransaction for customer | Domain service |
| BR-C31 | Redemption cannot exceed available points | Sales + loyalty service |
| BR-C32 | Only active LoyaltyProgram within effective dates applies | Program selector |
| BR-C33 | Earn/redeem creates LoyaltyTransaction; reversals create REVERSAL type | Sales post |

### Lifecycle

| ID | Rule | Enforcement |
|----|------|-------------|
| BR-C40 | Soft delete only; never hard delete with transaction history | Application |
| BR-C41 | Deactivated customer cannot be selected for new invoices | Sales UI + API |
| BR-C42 | Party soft delete hides Customer from operational queries | Query filters |

## Domain Events

Rules trigger events documented in [events.md](events.md); e.g., BR-C22 violation emits no event but returns `CREDIT_LIMIT_EXCEEDED` error.

## State Model

Rules apply differently by state — inactive customers skip BR-C22 checks because new sales are blocked at BR-C41.

## Integrations

- **Finance** — outstanding derived from Customer Receivable ledger; see [financial.md](../../database/tables/financial/financial.md).
- **Sales** — credit check at invoice save/post.

## Security Considerations

- BR-C20–BR-C24 changes require elevated permission beyond basic party edit where configured.
- Loyalty adjustments (BR-C33 manual ADJUSTMENT) require audit reason text.

## Performance Considerations

- BR-C30 balance calculation: use indexed sum on `LoyaltyTransaction.customerId` or maintain cache with outbox refresh.

## Future Enhancements

- Per-branch credit limits for corporate chains.
- Rule engine for promotional bonus eligibility (BR-C32 extension).
