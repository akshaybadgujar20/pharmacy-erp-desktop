# Customer — Invariants

## Purpose

State conditions that must **always** hold for the Customer domain, regardless of UI path or integration channel. Violations indicate bugs or data corruption requiring investigation.

## Responsibilities

- Distinguish invariants (always true) from business policies (configurable rules).
- Support test authors and code reviewers validating aggregate integrity.

## Scope

### In Scope

- Structural, referential, and balance invariants across Party and Customer aggregates and loyalty ledger.

### Out of Scope

- Sales invoice line math (Sales domain).
- Double-entry ledger balance (Finance domain).

## Related Entities

[Party](../../database/tables/party_management/01_party.md), [Customer](../../database/tables/party_management/05_customer.md), [LoyaltyTransaction](../../database/tables/loyalty/52_loyalty_transaction.md).

## Invariants

### Structural

| ID | Invariant |
|----|-----------|
| INV-C01 | If `Customer` row exists, referenced `Party` row exists and is not hard-deleted |
| INV-C02 | `Customer.partyId` is unique — at most one Customer per Party |
| INV-C03 | `Customer.uuid` and `Party.uuid` are globally unique non-empty strings |
| INV-C04 | `Customer.version` ≥ 1 and increments on every successful update |

### Role consistency

| ID | Invariant |
|----|-----------|
| INV-C05 | For every non-deleted Customer, there exists an active or historical PartyRole with `roleType = CUSTOMER` |
| INV-C06 | Operational Customer (available for sales) requires CUSTOMER PartyRole with `isActive = true` |

### Financial denormalization

| ID | Invariant |
|----|-----------|
| INV-C07 | `Customer.creditLimit` ≥ 0 |
| INV-C08 | `Customer.outstandingAmount` ≥ 0 |
| INV-C09 | When reconciliation runs, `outstandingAmount` equals ledger-derived receivable within tolerance ε |

### Loyalty

| ID | Invariant |
|----|-----------|
| INV-C10 | Every `LoyaltyTransaction` references valid `customerId` and `loyaltyProgramId` |
| INV-C11 | Posted loyalty transactions are immutable (`isPosted = true` → no field updates) |
| INV-C12 | Sum of `LoyaltyTransaction.points` for customer equals cached `Customer.loyaltyPoints` after sync job |
| INV-C13 | REDEEM and EXPIRY transactions have negative or deducting points sign per type convention |

### Sync and audit

| ID | Invariant |
|----|-----------|
| INV-C14 | Sync replication keys on `uuid`, never local `BigInt id` |
| INV-C15 | Soft-deleted records have `deletedAt` ≥ `createdAt` |

## Business Rules

Invariants are non-negotiable; business rules in [business-rules.md](business-rules.md) may be relaxed by configuration but must not break invariants.

## Domain Events

Invariant violation during command handling must **not** emit domain events; return application error and log at error level.

## State Model

Inactive state preserves all invariants; only INV-C06 restricts operational use.

## Integrations

Reconciliation jobs (Finance + Loyalty) are responsible for restoring INV-C09 and INV-C12 when drift detected.

## Security Considerations

Direct SQL updates bypassing application layer can break invariants — restrict database access in production.

## Performance Considerations

Periodic invariant checks can run as background jobs sampling customers with recent ledger activity.

## Future Enhancements

- Automated invariant test suite in `test/persistence/` validating seed data integrity.
