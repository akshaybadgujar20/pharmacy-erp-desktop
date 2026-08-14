# Phase 11 — Loyalty & Customer Rewards

## 1. Purpose

Phase 11 implements the Pharmacy ERP Loyalty domain.

The approved database overview defines Loyalty as **Customer reward programs**, with:

```text
LoyaltyProgram
LoyaltyTransaction
```

fileciteturn9file9

The source also identifies Customer Loyalty as a future roadmap capability, so this phase deliberately treats loyalty as a dedicated domain rather than adding ad-hoc point fields and calculations into Sales. fileciteturn9file13

---

## 2. Scope

- Loyalty program master
- Program lifecycle
- Customer enrollment
- Membership state
- Earning rules
- Eligible/excluded transactions
- Point calculation
- Loyalty transaction ledger
- Point balance
- Point history
- Point redemption
- Redemption limits
- Sales integration
- Sales cancellation behavior
- Sales Return reversal
- Manual authorized adjustment
- Offline loyalty operation
- Outbox synchronization
- Idempotency
- Conflict handling
- Angular UI
- NestJS service/API
- Permissions
- Audit
- Unit/API/E2E/sync testing
- SQLite/PostgreSQL compatibility
- Performance and documentation

## 3. Domain Boundary

| Domain | Responsibility |
|---|---|
| Party/Customer | Customer identity and contact information |
| Loyalty | Programs, eligibility, points, earning, redemption and loyalty transactions |
| Pricing | Price, tax and discount calculation |
| Sales | Sales invoice/return ownership and transaction workflow |
| Financial | Accounting and monetary ledger posting |
| Synchronization | Outbox, SyncLog and SyncConflict |
| Audit | AuditLog and ChangeHistory |

**Important:** Loyalty must not become the owner of Sales Invoice or Customer master data.

## 4. Core Flow

```text
Customer
   ↓
Loyalty Program Enrollment
   ↓
Sales Invoice
   ↓
Eligibility Evaluation
   ↓
Points Earned / Points Redeemed
   ↓
LoyaltyTransaction
   ↓
Customer Loyalty Balance
```

Returns and cancellations must create controlled reversal transactions rather than silently editing historical point transactions.

---

## 5. ADO Hierarchy

```text
EPIC-011 — Loyalty & Customer Rewards
├── FEAT-157 — Loyalty Domain & Data Model
├── FEAT-158 — Loyalty Program Management
├── FEAT-159 — Customer Enrollment & Membership
├── FEAT-160 — Loyalty Earning Rules
├── FEAT-161 — Loyalty Point Transactions
├── FEAT-162 — Loyalty Redemption
├── FEAT-163 — Sales Integration
├── FEAT-164 — Returns, Reversals & Corrections
├── FEAT-165 — Offline Synchronization & Conflict Handling
└── FEAT-166 — Security, Audit, Reporting & Testing
```

# 6. EPIC-011 — Loyalty & Customer Rewards

## Objective

Provide a reliable customer reward system where points are earned, redeemed, reversed and audited without corrupting Sales transactions or customer balances.

## Epic Definition of Done
- [ ] Both approved Loyalty tables are finalized and implemented.
- [ ] Loyalty programs can be configured and managed.
- [ ] Customers can be enrolled and their membership status controlled.
- [ ] Points are calculated using centralized business rules.
- [ ] LoyaltyTransaction provides the authoritative transaction history.
- [ ] Point balance cannot become negative through normal workflows.
- [ ] Sales earning and redemption are atomic and idempotent.
- [ ] Sales Returns and cancellations reverse loyalty effects correctly.
- [ ] Manual adjustments require authorization and an audit trail.
- [ ] Offline operations work using the local database.
- [ ] Outbox synchronization is retry-safe and idempotent.
- [ ] Angular workflows are keyboard-first and pharmacist-oriented.
- [ ] Permissions and audit controls are enforced server-side.
- [ ] Unit/API/E2E/sync tests pass.
- [ ] SQLite and PostgreSQL behavior is validated.

# FEAT-157 — Loyalty Domain & Data Model

## US-433 — Finalize Loyalty domain boundaries and schema

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid loyalty operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Mutations are auditable where applicable.
- Duplicate/retry behavior is deterministic.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Confirm Loyalty owns loyalty programs and loyalty point transactions, not Customer identity
- [ ] Define relationship between Customer and LoyaltyProgram membership
- [ ] Define whether membership is represented directly or through an explicit membership model
- [ ] Define UUID and primary-key strategy
- [ ] Define soft-delete and versioning behavior
- [ ] Define whether point balance is derived from transactions or maintained as a controlled cached value
- [ ] Review source requirements and confirm the story is within Loyalty ownership
- [ ] Define business rules, validation rules and error cases
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Add audit requirements and event coverage
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

## US-434 — Define LoyaltyProgram lifecycle and configuration

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid loyalty operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Mutations are auditable where applicable.
- Duplicate/retry behavior is deterministic.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Define program code/name/status
- [ ] Define program effective dates
- [ ] Define earning and redemption configuration boundaries
- [ ] Define program activation/deactivation rules
- [ ] Define behavior when a program expires while customers still have balances
- [ ] Review source requirements and confirm the story is within Loyalty ownership
- [ ] Define business rules, validation rules and error cases
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Add audit requirements and event coverage
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

## US-435 — Define LoyaltyTransaction model and transaction semantics

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid loyalty operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Mutations are auditable where applicable.
- Duplicate/retry behavior is deterministic.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Define transaction types such as EARN, REDEEM, REVERSAL and ADJUSTMENT
- [ ] Define reference fields for originating Sales Invoice or Return
- [ ] Define positive/negative point semantics
- [ ] Define transaction immutability rules
- [ ] Define idempotency key requirements
- [ ] Review source requirements and confirm the story is within Loyalty ownership
- [ ] Define business rules, validation rules and error cases
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Add audit requirements and event coverage
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

# FEAT-158 — Loyalty Program Management

## US-436 — Create and manage loyalty programs

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid loyalty operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Mutations are auditable where applicable.
- Duplicate/retry behavior is deterministic.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Create program list/search screen
- [ ] Create add/edit program workflow
- [ ] Validate unique program identity
- [ ] Support active/inactive state
- [ ] Prevent invalid program configuration
- [ ] Review source requirements and confirm the story is within Loyalty ownership
- [ ] Define business rules, validation rules and error cases
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Add audit requirements and event coverage
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

## US-437 — Activate, deactivate and expire loyalty programs

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid loyalty operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Mutations are auditable where applicable.
- Duplicate/retry behavior is deterministic.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Define activation prerequisites
- [ ] Prevent invalid date ranges
- [ ] Define expiration behavior
- [ ] Ensure historical transactions remain readable after deactivation
- [ ] Review source requirements and confirm the story is within Loyalty ownership
- [ ] Define business rules, validation rules and error cases
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Add audit requirements and event coverage
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

## US-438 — Configure earning and redemption parameters

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid loyalty operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Mutations are auditable where applicable.
- Duplicate/retry behavior is deterministic.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Configure points-per-amount rules
- [ ] Configure redemption conversion value
- [ ] Configure minimum redemption points
- [ ] Configure maximum redemption limits
- [ ] Define rounding behavior for fractional calculations
- [ ] Review source requirements and confirm the story is within Loyalty ownership
- [ ] Define business rules, validation rules and error cases
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Add audit requirements and event coverage
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

# FEAT-159 — Customer Enrollment & Membership

## US-439 — Enroll a customer into a loyalty program

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid loyalty operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Mutations are auditable where applicable.
- Duplicate/retry behavior is deterministic.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Provide customer lookup
- [ ] Enroll customer into selected program
- [ ] Validate program availability
- [ ] Create membership/initial balance behavior
- [ ] Show enrollment result and membership state
- [ ] Review source requirements and confirm the story is within Loyalty ownership
- [ ] Define business rules, validation rules and error cases
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Add audit requirements and event coverage
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

## US-440 — Maintain customer loyalty membership status

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid loyalty operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Mutations are auditable where applicable.
- Duplicate/retry behavior is deterministic.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Define active/suspended/expired membership states if required
- [ ] Allow authorized status changes
- [ ] Prevent earning/redemption for ineligible memberships
- [ ] Preserve historical transactions when membership state changes
- [ ] Review source requirements and confirm the story is within Loyalty ownership
- [ ] Define business rules, validation rules and error cases
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Add audit requirements and event coverage
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

## US-441 — Prevent duplicate customer membership

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid loyalty operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Mutations are auditable where applicable.
- Duplicate/retry behavior is deterministic.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Enforce uniqueness at database level where supported
- [ ] Add service-level duplicate protection
- [ ] Test concurrent enrollment requests
- [ ] Make enrollment retry-safe
- [ ] Review source requirements and confirm the story is within Loyalty ownership
- [ ] Define business rules, validation rules and error cases
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Add audit requirements and event coverage
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

# FEAT-160 — Loyalty Earning Rules

## US-442 — Calculate points earned from eligible sales

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid loyalty operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Mutations are auditable where applicable.
- Duplicate/retry behavior is deterministic.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Define eligible transaction states for earning
- [ ] Calculate points from finalized eligible sale value
- [ ] Exclude non-eligible amounts according to configured rules
- [ ] Apply rounding consistently
- [ ] Return earning calculation details
- [ ] Review source requirements and confirm the story is within Loyalty ownership
- [ ] Define business rules, validation rules and error cases
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Add audit requirements and event coverage
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

## US-443 — Define eligible and excluded products/transactions

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid loyalty operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Mutations are auditable where applicable.
- Duplicate/retry behavior is deterministic.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Define product/category eligibility
- [ ] Define excluded product categories
- [ ] Define treatment of discounts and taxes in earning base
- [ ] Define behavior for prescription/regulated products if applicable
- [ ] Document eligibility precedence
- [ ] Review source requirements and confirm the story is within Loyalty ownership
- [ ] Define business rules, validation rules and error cases
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Add audit requirements and event coverage
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

## US-444 — Handle minimum purchase and earning thresholds

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid loyalty operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Mutations are auditable where applicable.
- Duplicate/retry behavior is deterministic.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Configure minimum sale amount
- [ ] Configure minimum quantity where required
- [ ] Handle transactions below threshold
- [ ] Test boundary values
- [ ] Review source requirements and confirm the story is within Loyalty ownership
- [ ] Define business rules, validation rules and error cases
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Add audit requirements and event coverage
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

# FEAT-161 — Loyalty Point Transactions

## US-445 — Create immutable loyalty point transactions

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid loyalty operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Mutations are auditable where applicable.
- Duplicate/retry behavior is deterministic.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Create transaction atomically with business operation
- [ ] Prevent update/delete of completed point transactions
- [ ] Record source reference
- [ ] Record created timestamp and actor/source
- [ ] Validate point amount and transaction type
- [ ] Review source requirements and confirm the story is within Loyalty ownership
- [ ] Define business rules, validation rules and error cases
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Add audit requirements and event coverage
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

## US-446 — Provide customer loyalty balance

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid loyalty operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Mutations are auditable where applicable.
- Duplicate/retry behavior is deterministic.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Calculate current balance reliably
- [ ] Prevent negative balance
- [ ] Return balance with program context
- [ ] Optimize balance query for frequent Sales usage
- [ ] Review source requirements and confirm the story is within Loyalty ownership
- [ ] Define business rules, validation rules and error cases
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Add audit requirements and event coverage
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

## US-447 — Provide loyalty transaction history

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid loyalty operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Mutations are auditable where applicable.
- Duplicate/retry behavior is deterministic.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Support date filtering
- [ ] Support transaction-type filtering
- [ ] Show source document reference
- [ ] Show earn/redeem/reversal/adjustment details
- [ ] Paginate history safely
- [ ] Review source requirements and confirm the story is within Loyalty ownership
- [ ] Define business rules, validation rules and error cases
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Add audit requirements and event coverage
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

# FEAT-162 — Loyalty Redemption

## US-448 — Redeem points during sales

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid loyalty operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Mutations are auditable where applicable.
- Duplicate/retry behavior is deterministic.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Calculate redemption value
- [ ] Validate customer membership
- [ ] Validate available balance
- [ ] Create redemption transaction atomically with Sales operation
- [ ] Return remaining balance
- [ ] Review source requirements and confirm the story is within Loyalty ownership
- [ ] Define business rules, validation rules and error cases
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Add audit requirements and event coverage
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

## US-449 — Validate available points and redemption limits

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid loyalty operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Mutations are auditable where applicable.
- Duplicate/retry behavior is deterministic.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Validate minimum redemption points
- [ ] Validate maximum redemption per transaction
- [ ] Validate program status
- [ ] Validate customer eligibility
- [ ] Reject insufficient balance before committing sale
- [ ] Review source requirements and confirm the story is within Loyalty ownership
- [ ] Define business rules, validation rules and error cases
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Add audit requirements and event coverage
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

## US-450 — Prevent double redemption and negative balance

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid loyalty operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Mutations are auditable where applicable.
- Duplicate/retry behavior is deterministic.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Use transaction-safe balance validation
- [ ] Protect against concurrent redemption
- [ ] Use idempotency keys
- [ ] Test repeated requests
- [ ] Test simultaneous redemption attempts
- [ ] Review source requirements and confirm the story is within Loyalty ownership
- [ ] Define business rules, validation rules and error cases
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Add audit requirements and event coverage
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

# FEAT-163 — Sales Integration

## US-451 — Integrate loyalty earning with Sales Invoice completion

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid loyalty operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Mutations are auditable where applicable.
- Duplicate/retry behavior is deterministic.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Define exact Sales lifecycle point at which points are earned
- [ ] Do not award points for draft/failed invoices
- [ ] Persist source Sales Invoice reference
- [ ] Ensure retry does not award points twice
- [ ] Review source requirements and confirm the story is within Loyalty ownership
- [ ] Define business rules, validation rules and error cases
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Add audit requirements and event coverage
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

## US-452 — Integrate loyalty redemption with Sales Invoice

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid loyalty operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Mutations are auditable where applicable.
- Duplicate/retry behavior is deterministic.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Pass redemption context from Sales to Loyalty
- [ ] Validate redemption before final invoice completion
- [ ] Persist redemption reference on the transaction
- [ ] Ensure invoice retry is idempotent
- [ ] Review source requirements and confirm the story is within Loyalty ownership
- [ ] Define business rules, validation rules and error cases
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Add audit requirements and event coverage
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

## US-453 — Define loyalty behavior for sales cancellation

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid loyalty operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Mutations are auditable where applicable.
- Duplicate/retry behavior is deterministic.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Define cancellation behavior before completion
- [ ] Define cancellation behavior after points were awarded
- [ ] Prevent orphan loyalty transactions
- [ ] Test cancellation/retry scenarios
- [ ] Review source requirements and confirm the story is within Loyalty ownership
- [ ] Define business rules, validation rules and error cases
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Add audit requirements and event coverage
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

# FEAT-164 — Returns, Reversals & Corrections

## US-454 — Reverse earned points for Sales Return

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid loyalty operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Mutations are auditable where applicable.
- Duplicate/retry behavior is deterministic.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Identify original earning transactions
- [ ] Calculate reversal amount
- [ ] Create reversal transaction instead of editing history
- [ ] Prevent reversal more than once
- [ ] Test full and partial Sales Return
- [ ] Review source requirements and confirm the story is within Loyalty ownership
- [ ] Define business rules, validation rules and error cases
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Add audit requirements and event coverage
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

## US-455 — Reverse redeemed points for Sales Return

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid loyalty operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Mutations are auditable where applicable.
- Duplicate/retry behavior is deterministic.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Identify original redemption
- [ ] Define whether returned goods restore redeemed points
- [ ] Create controlled reversal transaction
- [ ] Prevent duplicate reversal
- [ ] Test full and partial returns
- [ ] Review source requirements and confirm the story is within Loyalty ownership
- [ ] Define business rules, validation rules and error cases
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Add audit requirements and event coverage
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

## US-456 — Support controlled manual loyalty corrections

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid loyalty operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Mutations are auditable where applicable.
- Duplicate/retry behavior is deterministic.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Restrict manual adjustment to authorized roles
- [ ] Require reason/reference
- [ ] Create explicit ADJUSTMENT transaction
- [ ] Audit before/after balance
- [ ] Prevent arbitrary balance edits
- [ ] Review source requirements and confirm the story is within Loyalty ownership
- [ ] Define business rules, validation rules and error cases
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Add audit requirements and event coverage
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

# FEAT-165 — Offline Synchronization & Conflict Handling

## US-457 — Support offline loyalty earning and redemption

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid loyalty operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Mutations are auditable where applicable.
- Duplicate/retry behavior is deterministic.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Calculate loyalty operations from local SQLite data
- [ ] Persist loyalty mutation and Outbox record transactionally
- [ ] Allow Sales workflow to continue without cloud connectivity
- [ ] Define local authority rules for loyalty master data
- [ ] Review source requirements and confirm the story is within Loyalty ownership
- [ ] Define business rules, validation rules and error cases
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Add audit requirements and event coverage
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

## US-458 — Synchronize loyalty transactions using Outbox

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid loyalty operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Mutations are auditable where applicable.
- Duplicate/retry behavior is deterministic.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Define Outbox payload for loyalty transactions
- [ ] Implement push synchronization
- [ ] Implement retry behavior
- [ ] Use idempotency keys
- [ ] Prevent duplicate cloud transactions
- [ ] Verify synchronization after restart
- [ ] Review source requirements and confirm the story is within Loyalty ownership
- [ ] Define business rules, validation rules and error cases
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Add audit requirements and event coverage
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

## US-459 — Resolve loyalty synchronization conflicts and duplicate requests

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid loyalty operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Mutations are auditable where applicable.
- Duplicate/retry behavior is deterministic.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Define authoritative transaction identity
- [ ] Detect duplicate transaction submissions
- [ ] Define conflict behavior for loyalty master changes
- [ ] Record unresolved conflicts
- [ ] Test replay and concurrent synchronization
- [ ] Review source requirements and confirm the story is within Loyalty ownership
- [ ] Define business rules, validation rules and error cases
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Add audit requirements and event coverage
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

# FEAT-166 — Security, Audit, Reporting & Testing

## US-460 — Implement loyalty permissions and audit

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid loyalty operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Mutations are auditable where applicable.
- Duplicate/retry behavior is deterministic.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Define permission matrix for program administration
- [ ] Protect enrollment/status changes
- [ ] Protect redemption
- [ ] Protect manual adjustments
- [ ] Audit all privileged operations
- [ ] Review source requirements and confirm the story is within Loyalty ownership
- [ ] Define business rules, validation rules and error cases
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Add audit requirements and event coverage
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

## US-461 — Create loyalty UI, balance/history views and workflows

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid loyalty operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Mutations are auditable where applicable.
- Duplicate/retry behavior is deterministic.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Create loyalty program management UI
- [ ] Create customer enrollment UI
- [ ] Show customer current points balance
- [ ] Show loyalty transaction history
- [ ] Add redemption workflow to Sales
- [ ] Add validation and insufficient-balance messages
- [ ] Support keyboard-first workflow
- [ ] Review source requirements and confirm the story is within Loyalty ownership
- [ ] Define business rules, validation rules and error cases
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Add audit requirements and event coverage
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

## US-462 — Complete loyalty testing, performance and documentation

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid loyalty operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Mutations are auditable where applicable.
- Duplicate/retry behavior is deterministic.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Test program lifecycle
- [ ] Test earning calculation
- [ ] Test redemption calculation
- [ ] Test Sales integration
- [ ] Test Sales Return reversal
- [ ] Test concurrent redemption
- [ ] Test offline/sync scenarios
- [ ] Benchmark balance lookup and transaction insertion
- [ ] Review indexes and query plans
- [ ] Document operational troubleshooting
- [ ] Review source requirements and confirm the story is within Loyalty ownership
- [ ] Define business rules, validation rules and error cases
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Add audit requirements and event coverage
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

---

# 7. Core Loyalty Business Rules

### 7.1 LoyaltyTransaction is the historical source of truth
Completed earning, redemption, reversal and adjustment transactions should not be edited or deleted to change history. Corrections should be represented by new compensating transactions.

### 7.2 Balance must be deterministic
The current balance must be derivable consistently from the loyalty transaction history or from a transactionally maintained balance mechanism whose correctness is guaranteed.

### 7.3 Sales must not award points for failed transactions
Points should be awarded only at the explicitly defined successful Sales lifecycle point.

### 7.4 Redemption must be atomic
Balance validation, redemption creation and the associated Sales operation must not permit a partial successful state.

### 7.5 Returns must reverse loyalty effects
A returned sale must not simply delete the original loyalty transaction. The system must create the appropriate reversal/correction transaction.

### 7.6 Manual changes require authorization
An operator must not directly edit a customer's points balance. Authorized changes must use a controlled adjustment transaction with a reason/reference and audit trail.

### 7.7 Historical loyalty data must survive program changes
Deactivating or changing a loyalty program must not make historical transactions unreadable or change their historical meaning.

---

# 8. Sales Integration

```text
Sales Invoice
     │
     ├── Pricing calculation
     │
     └── Loyalty evaluation
              │
       ┌──────┴──────┐
       ▼             ▼
     EARN          REDEEM
       │             │
       └──────┬──────┘
              ▼
      LoyaltyTransaction
```

Sales remains responsible for the invoice. Loyalty owns only the reward calculation and loyalty transaction.

---

# 9. Offline & Synchronization

The architecture requires offline-first operation with SQLite as the local operational database and background synchronization using Outbox/SyncLog/SyncConflict. fileciteturn9file13turn9file12

```text
Angular
   ↓
NestJS Loyalty Service
   ↓
SQLite
   ↓
Outbox
   ↓
Cloud Sync
   ↓
PostgreSQL
```

- Loyalty mutations must be persisted locally before being queued.
- Repeated synchronization must not create duplicate loyalty transactions.
- Loyalty transaction UUIDs/idempotency keys must identify the same logical operation across retries.
- Conflicting program/master changes require explicit resolution rules.
- Completed local Sales loyalty effects must not be silently rewritten by later synchronization.

# 10. UI Standards

- Customer loyalty balance should be visible from the relevant customer/Sales workflow.
- Redemption should show available points before confirmation.
- Insufficient balance should be immediately understandable.
- Earning/redeeming should require minimal clicks during billing.
- Program administration should support search/filter and efficient keyboard navigation.
- Transaction history should clearly distinguish EARN, REDEEM, REVERSAL and ADJUSTMENT.
- Manual adjustment should expose authorization and reason requirements.

# 11. Testing Matrix

| Area | Required coverage |
|---|---|
| Program | CRUD, lifecycle, dates, configuration |
| Enrollment | Enrollment, duplicate prevention, status |
| Earning | Calculation, eligibility, threshold, rounding |
| Transaction | Immutable history, references, idempotency |
| Balance | Correct aggregation, concurrency, no negative balance |
| Redemption | Limits, insufficient balance, concurrency |
| Sales | Earn/redeem integration and retries |
| Returns | Earn reversal, redemption reversal, partial return |
| Adjustment | Permission, reason, audit |
| Offline | Local operation, Outbox, restart/retry |
| Sync | Duplicate request, conflict, replay |
| Security | Allowed/denied operations |
| Performance | Balance lookup and transaction insertion |
| Database | SQLite/PostgreSQL |

# 12. Definition of Done
- [ ] Customer reward programs can be created and managed.
- [ ] Customers can enroll without duplicate membership.
- [ ] Points can be earned from eligible completed Sales.
- [ ] Points can be redeemed safely during Sales.
- [ ] Balance cannot be made negative through concurrent redemption.
- [ ] Every point change has a traceable LoyaltyTransaction.
- [ ] Returns and cancellations create correct compensating transactions.
- [ ] Manual adjustments are permission-controlled and audited.
- [ ] Offline Sales loyalty behavior works correctly.
- [ ] Synchronization is idempotent and retry-safe.
- [ ] Angular workflows are fast and keyboard-first.
- [ ] All critical loyalty workflows have automated coverage.
- [ ] SQLite and PostgreSQL compatibility is verified.
- [ ] Performance of balance and transaction operations is measured.
- [ ] Documentation is complete.

# 13. Phase 11 Summary

| Type | Count |
|---|---:|
| Epic | 1 |
| Features | 10 |
| User Stories | 30 |
| Tasks | 570 |
| **Total Work Items** | **611** |

# 14. Source Boundary

The database overview explicitly supports the Loyalty module and the two tables `LoyaltyProgram` and `LoyaltyTransaction`. fileciteturn9file9

The source does not provide detailed field-level definitions for these two tables in the retrieved material. Therefore this backlog deliberately includes schema-finalization work and does not treat invented fields as approved database requirements.

The architecture source supports offline-first operation, testing, security, observability, migration and future customer loyalty as part of the overall ERP direction. fileciteturn9file13turn9file17