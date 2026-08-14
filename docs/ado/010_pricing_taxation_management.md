# Phase 10 — Pricing & Taxation Management

## 1. Purpose

Phase 10 implements the Pharmacy ERP Pricing domain.

The approved database overview defines Pricing as **Pricing and taxation**, with exactly these tables:

```text
PriceList
PriceListItem
Tax
DiscountRule
```

The database overview places Pricing after Financial and before Loyalty and Prescription. This phase therefore establishes the reusable pricing, tax, and discount engine that Sales and Purchase consume rather than duplicating pricing rules inside those modules. fileciteturn8file0

The architecture also requires independent business domains, offline-first operation, validated DTOs, rich services, and workflow-driven/keyboard-first UI. fileciteturn8file4turn7file11

---

## 2. Scope

- Price list master
- Price list items
- Medicine price resolution
- Batch-aware pricing boundary
- MRP/selling-price boundary
- Purchase cost and margin calculations
- Tax master
- Tax applicability
- Tax calculation
- Tax rounding
- Discount rules
- Discount eligibility
- Discount priority
- Manual discount authorization
- Sales integration
- Purchase integration
- Angular pricing UI
- NestJS pricing services/API
- Offline pricing
- Outbox and synchronization
- Idempotency/conflict handling
- Permissions and audit
- Unit/API/E2E testing
- SQLite/PostgreSQL compatibility
- Performance and documentation

## 3. Domain Boundary

| Domain | Responsibility |
|---|---|
| Pricing | PriceList, PriceListItem, Tax, DiscountRule and calculation rules |
| Medicine | Medicine identity/master data |
| Inventory | Batch/Stock availability and inventory transactions |
| Sales | Sales invoice/return transaction ownership |
| Purchase | Procurement transaction ownership |
| Financial | Accounting entries and monetary posting |
| Party | Customer/supplier identity and roles |

**Important:** Pricing calculates and resolves commercial values; it must not become the owner of Sales Invoice, Purchase Invoice, Stock, or Ledger transactions.

## 4. Pricing Calculation Pipeline

```text
Transaction Context
       ↓
Medicine / Batch
       ↓
Applicable Price List
       ↓
Base Price / MRP
       ↓
Discount Rule Evaluation
       ↓
Tax Rule Evaluation
       ↓
Rounding
       ↓
Final Commercial Amount
       ↓
Sales / Purchase
```

The exact tax-inclusive/exclusive and rule-precedence semantics must be finalized as explicit business rules rather than inferred in UI code.

---

## 5. ADO Hierarchy

```text
EPIC-010 — Pricing & Taxation Management
├── FEAT-141 — Pricing Domain & Data Model
├── FEAT-142 — Price List Management
├── FEAT-143 — Price List Item Management
├── FEAT-144 — Medicine Price Resolution
├── FEAT-145 — Batch-Level Pricing
├── FEAT-146 — Purchase Cost & Margin Handling
├── FEAT-147 — Tax Master Management
├── FEAT-148 — Tax Calculation Engine
├── FEAT-149 — Discount Rule Management
├── FEAT-150 — Discount Evaluation Engine
├── FEAT-151 — Pricing Priority & Rule Resolution
├── FEAT-152 — Sales Integration
├── FEAT-153 — Purchase Integration
├── FEAT-154 — Pricing UI & Workflow
├── FEAT-155 — Offline Pricing & Synchronization
├── FEAT-156 — Pricing Security, Audit & Testing
```

---

# 6. EPIC-010 — Pricing & Taxation Management

## Objective

Provide one authoritative pricing engine for price resolution, tax calculation, discounts, and transaction-time price snapshots.

## Epic Definition of Done
- [ ] Pricing schema finalized and migrated.
- [ ] PriceList and PriceListItem CRUD implemented.
- [ ] Price resolution is deterministic.
- [ ] Tax master and calculation engine implemented.
- [ ] Discount rules and evaluation engine implemented.
- [ ] Rule priority and conflicts are deterministic.
- [ ] Sales consumes Pricing through a service/API contract.
- [ ] Purchase consumes Pricing where applicable.
- [ ] Transaction-time pricing values are snapshotted.
- [ ] Angular UI is keyboard-first and workflow-driven.
- [ ] Offline changes are stored locally and queued through Outbox.
- [ ] Synchronization is idempotent and conflict-safe.
- [ ] Permissions and audit events are enforced.
- [ ] Unit/API/E2E/sync tests pass.
- [ ] SQLite/PostgreSQL compatibility is verified.

---

# FEAT-141 — Pricing Domain & Data Model

## US-385 — Finalize Pricing domain boundaries

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Map Pricing ownership against Sales, Purchase, Inventory and Financial domains
- [ ] Confirm Pricing owns price/tax/discount rules but not invoice persistence
- [ ] Define source-of-truth rules for transaction-time pricing snapshots
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

## US-386 — Finalize PriceList schema

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Define PriceList identity and UUID strategy
- [ ] Define price-list code/name/status fields
- [ ] Define branch/store scope if applicable
- [ ] Define effective-from/effective-to semantics
- [ ] Define active-list uniqueness and overlap rules
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

## US-387 — Finalize PriceListItem schema

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Define Medicine-to-PriceList relationship
- [ ] Define amount/percentage/price fields required by the model
- [ ] Define currency/unit handling
- [ ] Define duplicate medicine entries within one price list
- [ ] Define historical price retention behavior
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

## US-388 — Finalize Tax schema

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Define tax code/name/rate representation
- [ ] Define inclusive versus exclusive tax semantics if required
- [ ] Define tax category applicability
- [ ] Define tax effective dating
- [ ] Define inactive tax behavior
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

## US-389 — Finalize DiscountRule schema

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Define discount rule condition model
- [ ] Define percentage versus fixed discount semantics
- [ ] Define minimum/maximum constraints
- [ ] Define validity period
- [ ] Define stacking behavior
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

# FEAT-142 — Price List Management

## US-390 — Create and manage price lists

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Create list screen and search
- [ ] Create add/edit workflow
- [ ] Validate duplicate names/codes
- [ ] Add active/inactive state
- [ ] Add save/cancel behavior
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

## US-391 — Activate and deactivate price lists

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Prevent deactivation of a list that violates configured dependencies
- [ ] Define behavior for existing transaction snapshots
- [ ] Add activation/deactivation audit
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

## US-392 — Configure price list effective dates

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Validate date ranges
- [ ] Prevent invalid overlapping active periods where required
- [ ] Add effective-date filters
- [ ] Test boundary dates
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

# FEAT-143 — Price List Item Management

## US-393 — Assign medicines to price lists

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Provide medicine search
- [ ] Allow selecting medicine without duplicating medicine master data
- [ ] Validate price-list ownership
- [ ] Prevent duplicate assignment
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

## US-394 — Maintain medicine price entries

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Support create/update price entry
- [ ] Validate numeric precision
- [ ] Validate non-negative values
- [ ] Show effective period
- [ ] Preserve historical transaction snapshots
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

## US-395 — Validate price entry uniqueness

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Add database uniqueness constraints where appropriate
- [ ] Add service-level duplicate checks
- [ ] Test concurrent duplicate creation
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

# FEAT-144 — Medicine Price Resolution

## US-396 — Resolve applicable medicine price

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Define resolution inputs
- [ ] Resolve active list
- [ ] Resolve medicine price
- [ ] Apply effective dates
- [ ] Return deterministic result and reason
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

## US-397 — Resolve price by customer/store context

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Define branch/store context
- [ ] Define customer-specific context if supported
- [ ] Define fallback hierarchy
- [ ] Test context-specific pricing
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

## US-398 — Handle missing or invalid price

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Define no-price response
- [ ] Prevent silent zero pricing
- [ ] Expose actionable validation message
- [ ] Add fallback behavior only where explicitly configured
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

# FEAT-145 — Batch-Level Pricing

## US-399 — Support batch-specific price resolution

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Define batch pricing inputs
- [ ] Resolve batch-specific values
- [ ] Define fallback to medicine/list price
- [ ] Test expired/inactive batch price behavior
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

## US-400 — Handle MRP and selling-price boundaries

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Define MRP ownership
- [ ] Define selling-price ownership
- [ ] Define relationship to batch
- [ ] Prevent selling price from exceeding permitted business constraints
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

## US-401 — Preserve price snapshot on transactions

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Capture unit price at sale time
- [ ] Capture tax rate/value snapshot
- [ ] Capture discount value/rule snapshot
- [ ] Prevent historical invoice recalculation from changing past values
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

# FEAT-146 — Purchase Cost & Margin Handling

## US-402 — Define purchase cost and margin calculation

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Define purchase cost source
- [ ] Define margin formula
- [ ] Define margin percentage formula
- [ ] Define handling of zero cost
- [ ] Define rounding policy
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

## US-403 — Calculate margin consistently

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Implement shared margin calculator
- [ ] Test positive/zero/negative margin
- [ ] Test discount impact
- [ ] Test tax treatment according to finalized business rule
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

## US-404 — Support cost changes without rewriting history

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Ensure historical purchases retain their original cost
- [ ] Ensure future calculations use new cost
- [ ] Prevent destructive updates to historical transaction data
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

# FEAT-147 — Tax Master Management

## US-405 — Create and manage tax masters

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Create tax master CRUD
- [ ] Validate tax code uniqueness
- [ ] Validate rate range
- [ ] Support active/inactive state
- [ ] Add search/filter
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

## US-406 — Configure tax applicability

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Define medicine/category applicability
- [ ] Define transaction applicability
- [ ] Validate tax selection
- [ ] Test excluded products
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

## US-407 — Configure tax effective dates

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Validate effective dates
- [ ] Resolve tax by transaction date
- [ ] Test transition between rates
- [ ] Prevent ambiguous active tax configuration
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

# FEAT-148 — Tax Calculation Engine

## US-408 — Calculate line-level tax

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Implement taxable-base calculation
- [ ] Implement tax amount calculation
- [ ] Handle line discount before/after tax according to rule
- [ ] Test rounding
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

## US-409 — Calculate invoice-level tax

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Aggregate line tax
- [ ] Support invoice-level tax summary
- [ ] Prevent double taxation
- [ ] Expose tax breakdown
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

## US-410 — Handle tax rounding and precision

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Define decimal precision
- [ ] Define rounding mode
- [ ] Test cumulative line rounding versus invoice rounding
- [ ] Ensure displayed and persisted values agree
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

# FEAT-149 — Discount Rule Management

## US-411 — Create and manage discount rules

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Create discount-rule CRUD
- [ ] Validate rule identity
- [ ] Support active/inactive state
- [ ] Support validity period
- [ ] Add rule search
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

## US-412 — Configure discount eligibility

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Define customer eligibility
- [ ] Define medicine/category eligibility
- [ ] Define minimum quantity/amount conditions
- [ ] Define branch/store scope
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

## US-413 — Configure discount limits and validity

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Define maximum discount percentage/value
- [ ] Define minimum bill conditions
- [ ] Define stacking restrictions
- [ ] Define authorization threshold
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

# FEAT-150 — Discount Evaluation Engine

## US-414 — Evaluate applicable discount rules

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Build rule evaluation pipeline
- [ ] Evaluate eligibility in deterministic order
- [ ] Return selected rule and calculated value
- [ ] Return rejection reason when no rule applies
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

## US-415 — Prevent invalid discount combinations

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Detect overlapping rules
- [ ] Define mutually exclusive rule groups
- [ ] Prevent duplicate discounts
- [ ] Test priority conflicts
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

## US-416 — Apply manual discount with authorization

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Add authorized manual-discount flow
- [ ] Validate user permission
- [ ] Require reason above configured threshold
- [ ] Audit manual override
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

# FEAT-151 — Pricing Priority & Rule Resolution

## US-417 — Define pricing rule priority

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Define rule precedence
- [ ] Document list versus batch versus customer precedence
- [ ] Document tax and discount evaluation order
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

## US-418 — Resolve conflicting pricing rules deterministically

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Implement deterministic comparator
- [ ] Test equal-priority rules
- [ ] Test expired/inactive rules
- [ ] Test multiple applicable rules
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

## US-419 — Expose pricing calculation explanation

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Return calculation trace
- [ ] Show selected price list/rule
- [ ] Show tax and discount components
- [ ] Keep explanation safe for UI use
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

# FEAT-152 — Sales Integration

## US-420 — Integrate pricing with Sales Invoice

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Call Pricing service from Sales flow
- [ ] Validate price before invoice posting
- [ ] Persist calculated price/tax/discount snapshot
- [ ] Prevent client-side-only calculation
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

## US-421 — Integrate tax and discount with Sales Return

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Reverse tax correctly
- [ ] Reverse discount correctly
- [ ] Preserve original transaction snapshot
- [ ] Test partial/full returns
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

# FEAT-153 — Purchase Integration

## US-422 — Integrate pricing with Purchase workflows

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Define purchase-side tax/cost usage
- [ ] Avoid applying sales-only discounts to purchasing
- [ ] Integrate purchase cost calculation
- [ ] Test purchase invoice scenarios
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

# FEAT-154 — Pricing UI & Workflow

## US-423 — Create pricing management UI

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Create price-list list screen
- [ ] Create add/edit form
- [ ] Create price-entry grid
- [ ] Add search/filter
- [ ] Add validation messages
- [ ] Add keyboard navigation
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

## US-424 — Create price calculation preview UI

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Create calculation preview
- [ ] Show base price
- [ ] Show discount
- [ ] Show taxable amount
- [ ] Show tax
- [ ] Show final amount
- [ ] Show calculation explanation
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

## US-425 — Create tax and discount configuration UI

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Create tax master UI
- [ ] Create discount-rule UI
- [ ] Add effective-date controls
- [ ] Add active/inactive controls
- [ ] Add authorization-aware controls
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

# FEAT-155 — Offline Pricing & Synchronization

## US-426 — Support offline pricing operations

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Persist pricing changes locally
- [ ] Allow Sales to calculate from local pricing data
- [ ] Create Outbox records for mutations
- [ ] Handle restart/retry safely
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

## US-427 — Synchronize pricing changes safely

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Define pricing sync payload
- [ ] Implement push
- [ ] Implement pull
- [ ] Implement idempotency
- [ ] Prevent duplicate price rules
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

## US-428 — Handle pricing synchronization conflicts

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Define conflict rules for master pricing
- [ ] Prefer configured authoritative source where required
- [ ] Record conflicts
- [ ] Provide resolution workflow
- [ ] Test concurrent changes
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

# FEAT-156 — Pricing Security, Audit & Testing

## US-429 — Implement pricing permissions

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Define pricing permission matrix
- [ ] Protect price changes
- [ ] Protect tax changes
- [ ] Protect discount changes
- [ ] Protect manual overrides
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

## US-430 — Implement pricing audit events

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Audit price-list changes
- [ ] Audit price changes
- [ ] Audit tax changes
- [ ] Audit discount-rule changes
- [ ] Audit manual discount overrides
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

## US-431 — Complete pricing unit/API/E2E testing

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Test price resolution
- [ ] Test tax calculation
- [ ] Test discount calculation
- [ ] Test rule priority
- [ ] Test Sales integration
- [ ] Test Purchase integration
- [ ] Test offline/sync scenarios
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

## US-432 — Validate SQLite/PostgreSQL compatibility and performance

### Acceptance Criteria

- Business behavior is enforced in the NestJS service layer, not only in Angular.
- Invalid data is rejected with a standard validation/error response.
- Applicable permissions are checked server-side.
- Mutating operations are auditable.
- Offline behavior and synchronization behavior are explicitly handled where applicable.
- Automated tests cover the success and failure paths.

### Tasks
- [ ] Benchmark price lookup
- [ ] Benchmark tax calculation
- [ ] Benchmark discount evaluation
- [ ] Review query plans
- [ ] Validate indexes
- [ ] Run SQLite test suite
- [ ] Run PostgreSQL test suite
- [ ] Review existing schema and domain boundary
- [ ] Define business rules and validation rules
- [ ] Define request/response DTO contract
- [ ] Define service-layer responsibility
- [ ] Define repository/query requirements
- [ ] Define authorization requirements
- [ ] Define audit requirements
- [ ] Define offline and synchronization behavior
- [ ] Implement Prisma model/repository changes where required
- [ ] Implement NestJS service logic
- [ ] Implement REST API endpoint(s)
- [ ] Implement Angular service integration
- [ ] Implement Angular UI/workflow
- [ ] Add keyboard-first interaction and validation feedback
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Document implementation and acceptance behavior

---

# 7. Core Pricing Business Rules

### Price resolution must be deterministic
Given the same transaction context and data state, Pricing must return the same price.

### Pricing history must not be rewritten
Changing a PriceList or Tax must not retroactively change an already completed invoice.

### Transaction values must be snapshotted
Sales/Purchase transactions should retain the price, tax, discount and relevant rule context used at transaction time.

### Client UI is not the authority
Angular may preview calculations, but final validation/calculation must occur in the backend/domain service.

### Inactive rules must not apply
Inactive or expired PriceList, Tax or DiscountRule entries must not be selected.

### Effective dates must be respected
Pricing rules must be evaluated against the transaction/business date.

### Discounts must be authorized
Manual overrides must require the appropriate permission and, where configured, a reason.

### Tax calculation must be consistent
The same calculation and rounding rules must be used in preview and final transaction processing.

### No silent zero pricing
A missing price must produce an explicit business validation result unless a documented fallback exists.

### Pricing must not own inventory
Stock availability and batch inventory remain Inventory responsibilities.

---

# 8. Sales Integration Contract

```text
Sales Invoice
    ↓
PricingService
    ↓
Price + Discount + Tax
    ↓
Sales Invoice Item Snapshot
    ↓
Financial / Inventory workflows
```

- Sales must not implement a second independent price-selection algorithm.
- Sales sends the relevant medicine/batch/customer/quantity/date context to Pricing.
- Pricing returns the calculated commercial values and calculation metadata required by Sales.
- Sales persists transaction-time values so historical invoices remain stable.
- Sales returns must use the original transaction context where required rather than recalculating historical prices from current master data.

# 9. Purchase Integration Contract

- Purchase remains the owner of PurchaseOrder, GoodsReceipt and PurchaseInvoice transactions.
- Pricing provides applicable cost/tax/discount calculations where configured.
- Purchase must not duplicate Pricing rule evaluation.
- Historical purchase values must remain stable when future price rules change.
- Purchase and Sales pricing rules must remain independently configurable where their business semantics differ.

# 10. Offline & Synchronization Design

The architecture defines the local database as the source of truth during daily operation and uses Outbox-based background synchronization. fileciteturn7file11

```text
Angular
   ↓
NestJS Pricing Service
   ↓
SQLite
   ↓
Outbox
   ↓
Cloud Sync
   ↓
PostgreSQL
```

- Price/tax/discount master mutations must be persisted locally and queued transactionally.
- Repeated synchronization requests must be idempotent.
- Conflicting master-data changes must follow an explicit authority/version rule.
- A failed sync must remain retryable without creating duplicate pricing rules.
- Completed Sales/Purchase snapshots must not be rewritten merely because a newer pricing master record arrives.

# 11. UI Standards

- Pricing screens should minimize clicks and support keyboard-first navigation.
- Price-list grids should support search, filtering, sorting and efficient entry.
- Tax and discount forms should provide immediate validation feedback.
- Calculation preview should clearly separate base price, discount, taxable amount, tax and final amount.
- Manual discount overrides should clearly show permission/authorization requirements.
- UI must not expose actions the current user cannot perform.

# 12. Testing Matrix

| Area | Required coverage |
|---|---|
| PriceList | CRUD, activation, dates, uniqueness |
| PriceListItem | CRUD, medicine assignment, validation |
| Price resolution | Priority, effective date, missing price, context |
| Batch pricing | Batch override/fallback behavior |
| Tax | Applicability, rate, dates, rounding |
| Discount | Eligibility, priority, limits, manual override |
| Sales | Final price/tax/discount snapshot |
| Purchase | Cost/tax/discount integration |
| Offline | Local mutation, Outbox, retry |
| Sync | Duplicate request, conflict, replay |
| Security | Allowed/denied pricing changes |
| Audit | All pricing master mutations/overrides |
| Database | SQLite/PostgreSQL |
| Performance | Lookup/calculation latency |

# 13. Definition of Done
- [ ] All four approved Pricing tables are implemented according to finalized schema decisions.
- [ ] Price resolution has one authoritative implementation.
- [ ] Tax calculation has one authoritative implementation.
- [ ] Discount evaluation has one authoritative implementation.
- [ ] Sales and Purchase do not duplicate pricing rules.
- [ ] Transaction-time commercial values are persisted correctly.
- [ ] Pricing changes work offline.
- [ ] Outbox synchronization is reliable and idempotent.
- [ ] Conflict behavior is documented and tested.
- [ ] Permissions are enforced in backend services.
- [ ] Audit history is complete for pricing mutations and overrides.
- [ ] Angular workflows are keyboard-first.
- [ ] Unit, API, E2E and synchronization tests pass.
- [ ] SQLite and PostgreSQL validation is complete.
- [ ] Performance targets are measured and documented.
- [ ] Phase documentation is complete.

# 14. Phase 10 Summary

| Type | Count |
|---|---:|
| Epic | 1 |
| Features | 16 |
| User Stories | 48 |
| Tasks | 1173 |
| **Total Work Items** | **1238** |

# 15. Source Boundary

The supplied database overview explicitly defines Pricing as `PriceList`, `PriceListItem`, `Tax`, and `DiscountRule`. It does not provide detailed field-level definitions for these four tables in the retrieved source, so this backlog intentionally creates schema/business-rule finalization work rather than inventing unsupported columns or relationships. fileciteturn8file0

The architecture source supports the offline-first, modular, service-layer, keyboard-first and testing expectations used throughout this backlog. fileciteturn7file11turn8file3