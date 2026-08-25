# Customer — Lifecycle

## Purpose

Describe how a customer record progresses from creation through active use to deactivation or archival, including loyalty enrollment timing and credit lifecycle.

## Responsibilities

- Define lifecycle phases and entry/exit criteria.
- Clarify which sub-entities participate at each phase.

## Scope

### In Scope

- Party, Customer, PartyRole, addresses, contacts, loyalty participation.

### Out of Scope

- Sales order lifecycle, invoice payment lifecycle.

## Related Entities

See [party_management.md](../../database/tables/party_management/party_management.md) and [loyalty.md](../../database/tables/loyalty/loyalty.md).

## Lifecycle Phases

### 1. Registration

**Entry:** Operator creates new customer from POS or master-data screen.

**Actions:**
- Create `Party` (PERSON or ORGANIZATION).
- Assign `PartyRole` with `roleType = CUSTOMER`.
- Create `Customer` with generated `customerCode`.
- Optionally add `PartyAddress` and `PartyContact`.
- Default `customerType = RETAIL`, `creditLimit = 0`, `loyaltyPoints = 0`.

**Exit criteria:** All required fields valid; aggregate persisted in one transaction.

**Event:** `CustomerRegistered`.

### 2. Active operation

**Entry:** Customer active on all layers (`Party`, role, Customer).

**Actions:**
- Selected on sales invoices.
- Earn loyalty on posted sales per active `LoyaltyProgram`.
- Credit sales allowed when within `creditLimit`.
- Profile updates (address, phone, credit limit).

**Exit criteria:** Deactivation request or soft delete.

**Events:** `CustomerUpdated`, `LoyaltyPointsEarned`, `LoyaltyPointsRedeemed`.

### 3. Credit review (ongoing sub-phase)

**Entry:** WHOLESALE/CORPORATE customer with `creditLimit > 0`.

**Actions:**
- Finance posts receipts reducing outstanding.
- Reconciliation updates `outstandingAmount`.
- Supervisor may adjust credit limit.

**Exit:** Limit reached blocks new credit sales until receipt or limit increase.

### 4. Deactivation

**Entry:** Customer no longer transacting (moved, duplicate, fraud).

**Actions:**
- Set `Customer.isActive = false` and/or deactivate CUSTOMER `PartyRole`.
- Historical invoices and loyalty transactions remain queryable.

**Exit criteria:** Reactivation or archival.

**Event:** `CustomerDeactivated`.

### 5. Archival (soft delete)

**Entry:** GDPR request or duplicate merge completion.

**Actions:**
- Set `deletedAt` on Party (cascades visibility).
- Exclude from sync to branch devices if policy requires.

**Event:** `CustomerArchived` (conceptual; may map to soft delete audit action).

## Business Rules

- Cannot archive Party while open receivable above threshold without supervisor override.
- Loyalty balance should be zero or forfeited per policy before archival.

## Domain Events

See [events.md](events.md) for full catalog per phase.

## State Model

Phases map to [state-machine.md](state-machine.md) states: Draft → Active → Inactive → Archived.

## Integrations

- **Sales** — only Active phase customers on new invoices.
- **Finance** — receivable persists through Inactive; collections still allowed.
- **Loyalty** — earn stops at deactivation; redeem may be blocked by policy.

## Security Considerations

- Archival requires `PARTY:PARTY:UPDATE`; may need additional admin permission in future.

## Performance Considerations

- Bulk import registers many customers in Registration phase; use batch UnitOfWork with sequence pre-allocation.

## Future Enhancements

- **Suspended** state for temporary credit hold without full deactivation.
- Automated deactivation of customers with no activity in N months.
