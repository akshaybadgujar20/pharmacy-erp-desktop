# Phase 6 — Inventory Management

## 1. Objective

Phase 6 implements the Pharmacy ERP Inventory domain.

The database overview defines Inventory as a separate functional module responsible for inventory tracking, with these tables:

- `Batch`
- `Stock`
- `StockMovement`
- `StockAdjustment`
- `StockTransfer`
- `StockTake`
- `StockTakeItem`

fileciteturn3file2

The database relationship flow also places Inventory downstream of transactional receipt/invoice processing:

```text
Invoice
   ↓
Batch
   ↓
Stock
   ↓
Stock Movement
```

fileciteturn3file5

This phase therefore establishes the inventory foundation that later Purchase and Sales phases will consume.

---

# 2. Important Boundary

Phase 6 should NOT become a duplicate of Purchase or Sales.

### Inventory owns

```text
Batch identity
Batch lifecycle
Expiry tracking
Stock quantity/state
Stock movements
Stock adjustments
Stock transfers
Physical stock taking
Stock reconciliation
Inventory availability
Inventory ledger/history
Inventory search
Inventory controls
```

### Purchase owns later

```text
Purchase Order
Goods Receipt
Purchase Invoice
Purchase Return
Supplier procurement workflow
```

### Sales owns later

```text
Sales Invoice
Sales Return
Sales Payment
Customer billing
```

The database overview explicitly separates Inventory, Purchase and Sales into different functional modules. fileciteturn3file2

---

# 3. Architecture Principles

The architecture handbook requires:

```text
Angular
   ↓
NestJS
   ↓
Prisma
   ↓
SQLite
```

with:

- thin controllers
- rich services
- validated DTOs
- business rules in services
- normalized database design
- Prisma migrations

fileciteturn2file11

Inventory must also follow the offline-first architecture:

```text
Local SQLite
     ↓
Inventory operation
     ↓
Stock transaction
     ↓
Stock Movement
     ↓
Outbox
     ↓
Background Sync
     ↓
Cloud
```

The architecture specifically states that Inventory conflicts are transaction-based and stock should never be overwritten during conflict resolution. fileciteturn2file11

---

# 4. ADO Hierarchy

```text
EPIC-006 — Inventory Management
│
├── FEAT-066 — Batch Master & Batch Lifecycle
├── FEAT-067 — Stock Ledger & Stock Balance
├── FEAT-068 — Stock Movement Engine
├── FEAT-069 — Stock Adjustment
├── FEAT-070 — Stock Transfer
├── FEAT-071 — Physical Stock Take
├── FEAT-072 — Inventory Search & Availability
├── FEAT-073 — Expiry & Near-Expiry Management
├── FEAT-074 — Inventory Valuation & Quantity Controls
├── FEAT-075 — Inventory Authorization & Audit
├── FEAT-076 — Inventory API & Domain Services
├── FEAT-077 — Inventory UI/UX & Keyboard Workflow
├── FEAT-078 — Offline-First Inventory & Synchronization
└── FEAT-079 — Inventory Testing, Performance & Readiness
```

---

# 5. Epic

## EPIC-006 — Inventory Management

### Description

Build a reliable inventory subsystem that tracks medicine batches, quantities, stock movements, adjustments, transfers and physical stock counts across the pharmacy ERP.

### Business Value

Inventory is the operational bridge between:

```text
Medicine Master
      ↓
Inventory
      ↓
Purchase / Sales
```

It must provide a reliable answer to:

```text
What medicine is this?
Which batch is it?
How much stock exists?
Where is the stock?
Is it expired?
Is it locked?
How did the quantity change?
Who changed it?
Why did it change?
```

### Epic Completion Criteria

- Batch management is implemented.
- Stock balances are implemented.
- Every stock-changing operation produces an auditable movement.
- Stock adjustments are controlled.
- Branch/location transfers are controlled where supported by the schema.
- Physical stock-taking is supported.
- Inventory search is fast.
- Expiry and near-expiry visibility is available.
- Negative stock behavior is explicitly controlled.
- Stock cannot be directly overwritten by UI operations.
- Backend authorization is enforced.
- Audit events are generated.
- Offline operations are synchronization-aware.
- Inventory conflicts are transaction-based.
- Unit/API/UI/integration tests pass.
- SQLite and PostgreSQL compatibility is validated.

---

# 6. Core Inventory Model

Conceptually:

```text
Medicine
   │
   ├── Batch
   │     │
   │     └── Stock
   │
   └── Stock Movement
          │
          ├── Purchase Receipt
          ├── Sale
          ├── Sales Return
          ├── Purchase Return
          ├── Adjustment
          ├── Transfer
          └── Stock Take
```

Important:

`Stock` should represent the current inventory state.

`StockMovement` should represent how that state changed.

Do not use a stock update as a replacement for the movement history.

---

# 7. FEAT-066 — Batch Master & Batch Lifecycle

## Purpose

Maintain batch-level inventory identity for medicines.

The legacy application material shows batch-oriented workflows such as:

- Batch MRP & Expiry Date Changes
- Batch Bifurcation
- Batch Lock / Unlock
- Batch Serial Changes
- Batch Barcode Label Print

fileciteturn3file3

The current database overview confirms `Batch` as an Inventory table, but the available schema overview does not specify the exact Batch columns. Therefore the backlog below intentionally separates business-rule finalization from implementation instead of inventing a definitive field list.

---

## US-158 — Define Batch domain model

### Acceptance Criteria

1. Batch belongs to a medicine.
2. Batch has a stable internal identity.
3. Batch supports the information required for inventory tracking.
4. Batch can represent expiry information.
5. Batch can support inventory lifecycle/state.
6. Batch model follows the project's BIGINT + UUID conventions.
7. Soft-delete and versioning rules are explicitly defined.
8. Batch uniqueness rules are explicitly documented.

### Tasks

- TASK-001 — Review final Batch table specification.
- TASK-002 — Identify mandatory Batch fields.
- TASK-003 — Define Medicine-to-Batch relationship.
- TASK-004 — Define batch number uniqueness scope.
- TASK-005 — Define expiry representation.
- TASK-006 — Define batch lifecycle/state.
- TASK-007 — Define batch locking requirements.
- TASK-008 — Define batch deletion rules.
- TASK-009 — Define batch versioning.
- TASK-010 — Define branch/location scope if applicable.
- TASK-011 — Define synchronization identity.
- TASK-012 — Implement Prisma Batch model.
- TASK-013 — Add BIGINT primary key.
- TASK-014 — Add UUID.
- TASK-015 — Add foreign-key relationships.
- TASK-016 — Add timestamps.
- TASK-017 — Add deletedAt where required.
- TASK-018 — Add version where required.
- TASK-019 — Add unique constraints.
- TASK-020 — Add indexes.
- TASK-021 — Create Prisma migration.
- TASK-022 — Validate SQLite migration.
- TASK-023 — Validate PostgreSQL migration.

---

## US-159 — Create batch

### Acceptance Criteria

1. Authorized users/services can create a batch.
2. Medicine must exist.
3. Required batch fields are validated.
4. Duplicate batch creation is rejected according to the defined uniqueness rule.
5. Invalid expiry data is rejected.
6. Batch creation is audited.
7. Batch creation is synchronization-aware.

### Tasks

- TASK-024 — Create Batch DTO.
- TASK-025 — Add DTO validation.
- TASK-026 — Validate medicine reference.
- TASK-027 — Validate batch identity.
- TASK-028 — Validate expiry.
- TASK-029 — Implement duplicate batch detection.
- TASK-030 — Implement BatchService.create.
- TASK-031 — Implement create API.
- TASK-032 — Add authorization guard.
- TASK-033 — Add audit event.
- TASK-034 — Add Outbox event.
- TASK-035 — Add unit tests.
- TASK-036 — Add API integration tests.

---

## US-160 — View and search batches

### Tasks

- TASK-037 — Define batch search criteria.
- TASK-038 — Implement batch search service.
- TASK-039 — Implement batch list API.
- TASK-040 — Implement batch detail API.
- TASK-041 — Add pagination.
- TASK-042 — Add sorting.
- TASK-043 — Add active/locked filtering.
- TASK-044 — Add expiry filtering.
- TASK-045 — Add Medicine filtering.
- TASK-046 — Build Batch list UI.
- TASK-047 — Build Batch detail UI.
- TASK-048 — Add search UI.
- TASK-049 — Add filter UI.
- TASK-050 — Add tests.

---

## US-161 — Update batch

### Tasks

- TASK-051 — Define editable Batch fields.
- TASK-052 — Define fields that cannot be changed after stock activity.
- TASK-053 — Implement update DTO.
- TASK-054 — Implement update service.
- TASK-055 — Implement optimistic locking.
- TASK-056 — Implement update API.
- TASK-057 — Implement update UI.
- TASK-058 — Add downstream dependency validation.
- TASK-059 — Add audit event.
- TASK-060 — Add tests.

---

## US-162 — Lock and unlock batch

### Acceptance Criteria

1. A locked batch cannot be used in prohibited inventory operations.
2. Lock state is visible.
3. Lock/unlock requires appropriate permission.
4. Lock/unlock is audited.
5. The reason can be recorded if required by the finalized schema/business rule.

### Tasks

- TASK-061 — Define batch lock rules.
- TASK-062 — Define operations blocked by lock.
- TASK-063 — Implement lock service.
- TASK-064 — Implement unlock service.
- TASK-065 — Implement lifecycle API.
- TASK-066 — Implement lock/unlock UI.
- TASK-067 — Add backend enforcement.
- TASK-068 — Add audit events.
- TASK-069 — Add tests.

---

# 8. FEAT-067 — Stock Ledger & Stock Balance

## Purpose

Maintain current stock state independently from the movement history.

## US-163 — Define stock identity

### Acceptance Criteria

1. Stock is associated with the correct medicine/batch.
2. Stock scope is explicitly defined.
3. Branch/location dimensions are represented where supported by the final schema.
4. Duplicate stock rows for the same inventory scope are prevented.
5. Stock quantity rules are documented.
6. Stock state can be rebuilt from movements when required.

### Tasks

- TASK-070 — Review final Stock table specification.
- TASK-071 — Define Stock grain.
- TASK-072 — Define Medicine/Batch relationship.
- TASK-073 — Define branch scope.
- TASK-074 — Define location/shelf scope if applicable.
- TASK-075 — Define quantity precision.
- TASK-076 — Define available/reserved/blocked quantity rules if required.
- TASK-077 — Define negative stock policy.
- TASK-078 — Define uniqueness constraints.
- TASK-079 — Implement Prisma Stock model.
- TASK-080 — Add indexes.
- TASK-081 — Add migration.
- TASK-082 — Validate migration.

---

## US-164 — Calculate and maintain stock balance

### Acceptance Criteria

1. Stock balance changes only through controlled domain operations.
2. Every stock change has a corresponding movement.
3. Stock cannot be silently overwritten.
4. Quantity cannot become invalid.
5. Concurrent stock updates are protected.
6. Stock can be reconciled with movement history.

### Tasks

- TASK-083 — Implement StockService.
- TASK-084 — Implement stock increment operation.
- TASK-085 — Implement stock decrement operation.
- TASK-086 — Implement stock reservation behavior if required.
- TASK-087 — Implement stock release behavior if required.
- TASK-088 — Implement transaction boundary.
- TASK-089 — Implement concurrency handling.
- TASK-090 — Implement stock invariant validation.
- TASK-091 — Implement stock rebuild capability.
- TASK-092 — Add stock consistency checks.
- TASK-093 — Add unit tests.
- TASK-094 — Add concurrency tests.

---

## US-165 — View stock

### Acceptance Criteria

1. User can view current quantity.
2. User can identify medicine.
3. User can identify batch.
4. User can identify expiry.
5. User can filter stock.
6. User can view stock by branch/location where supported.

### Tasks

- TASK-095 — Implement stock query service.
- TASK-096 — Implement stock API.
- TASK-097 — Implement stock list UI.
- TASK-098 — Implement stock detail UI.
- TASK-099 — Add Medicine filter.
- TASK-100 — Add Batch filter.
- TASK-101 — Add expiry filter.
- TASK-102 — Add location filter if applicable.
- TASK-103 — Add branch filter if applicable.
- TASK-104 — Add pagination.
- TASK-105 — Add sorting.
- TASK-106 — Add tests.

---

# 9. FEAT-068 — Stock Movement Engine

## Purpose

Create the central mechanism through which inventory quantities change.

The database overview identifies `StockMovement` as the inventory movement/history table. fileciteturn3file2

The architecture also states:

> Inventory → Transaction-based, never overwrite stock.

fileciteturn2file11

## US-166 — Define movement model

### Movement categories

The final enum/value set must be agreed with the detailed schema, but the engine should accommodate operations such as:

```text
PURCHASE_RECEIPT
SALE
PURCHASE_RETURN
SALES_RETURN
ADJUSTMENT
TRANSFER_OUT
TRANSFER_IN
STOCK_TAKE
OPENING_STOCK
```

### Tasks

- TASK-107 — Review final StockMovement table.
- TASK-108 — Define movement type values.
- TASK-109 — Define inbound/outbound semantics.
- TASK-110 — Define source document reference.
- TASK-111 — Define quantity rules.
- TASK-112 — Define movement date/time.
- TASK-113 — Define user attribution.
- TASK-114 — Define branch/location scope.
- TASK-115 — Define idempotency key.
- TASK-116 — Implement Prisma model.
- TASK-117 — Add indexes.
- TASK-118 — Add constraints.
- TASK-119 — Create migration.
- TASK-120 — Add tests.

---

## US-167 — Record stock movement

### Acceptance Criteria

1. Movement is immutable after posting except through controlled correction mechanisms.
2. Movement records the quantity change.
3. Movement identifies the affected stock/batch.
4. Movement identifies its business source.
5. Movement is created in the same transaction as the stock balance update.
6. Duplicate processing is idempotent.
7. Movement is auditable.

### Tasks

- TASK-121 — Implement StockMovementService.
- TASK-122 — Implement movement creation.
- TASK-123 — Implement inbound movement.
- TASK-124 — Implement outbound movement.
- TASK-125 — Implement transaction wrapping.
- TASK-126 — Implement idempotency.
- TASK-127 — Implement duplicate movement protection.
- TASK-128 — Add audit integration.
- TASK-129 — Add Outbox integration.
- TASK-130 — Add unit tests.
- TASK-131 — Add integration tests.
- TASK-132 — Add failure rollback tests.

---

## US-168 — View stock movement history

### Tasks

- TASK-133 — Implement movement search.
- TASK-134 — Add Medicine filter.
- TASK-135 — Add Batch filter.
- TASK-136 — Add movement-type filter.
- TASK-137 — Add date-range filter.
- TASK-138 — Add source-document filter.
- TASK-139 — Add user filter.
- TASK-140 — Add branch/location filter.
- TASK-141 — Add pagination.
- TASK-142 — Add sorting.
- TASK-143 — Implement movement history API.
- TASK-144 — Implement movement history UI.
- TASK-145 — Add tests.

---

# 10. FEAT-069 — Stock Adjustment

The database overview defines `StockAdjustment` as part of Inventory. fileciteturn3file2

## US-169 — Create stock adjustment

### Business Examples

```text
Physical damage
Expired stock
Breakage
Shortage
Excess stock
Data correction
Opening balance correction
Other approved inventory correction
```

The legacy application material also contains an expiry/breakage/return/shortage workflow. fileciteturn3file3

### Acceptance Criteria

1. Adjustment requires authorization.
2. Medicine/batch must be identified.
3. Quantity change must be explicit.
4. Adjustment reason is mandatory.
5. Positive and negative adjustments are distinguishable.
6. StockMovement is generated.
7. Stock balance is updated atomically.
8. Adjustment cannot silently overwrite stock.
9. Adjustment is audited.
10. Adjustment is synchronization-aware.

### Tasks

- TASK-146 — Review final StockAdjustment schema.
- TASK-147 — Define adjustment reasons.
- TASK-148 — Define positive/negative adjustment rules.
- TASK-149 — Define approval requirement.
- TASK-150 — Define maximum adjustment thresholds if required.
- TASK-151 — Implement Prisma model.
- TASK-152 — Add constraints.
- TASK-153 — Add indexes.
- TASK-154 — Create migration.
- TASK-155 — Implement DTO.
- TASK-156 — Implement validation.
- TASK-157 — Implement adjustment service.
- TASK-158 — Validate stock availability.
- TASK-159 — Create StockMovement.
- TASK-160 — Update Stock atomically.
- TASK-161 — Add authorization.
- TASK-162 — Add audit.
- TASK-163 — Add Outbox event.
- TASK-164 — Add tests.

---

## US-170 — View and search adjustments

### Tasks

- TASK-165 — Implement adjustment list API.
- TASK-166 — Implement adjustment detail API.
- TASK-167 — Implement adjustment search.
- TASK-168 — Add date filter.
- TASK-169 — Add reason filter.
- TASK-170 — Add Medicine filter.
- TASK-171 — Add Batch filter.
- TASK-172 — Add user filter.
- TASK-173 — Add pagination.
- TASK-174 — Build adjustment list UI.
- TASK-175 — Build adjustment detail UI.
- TASK-176 — Add tests.

---

# 11. FEAT-070 — Stock Transfer

The architecture handbook explicitly identifies future multi-store support including branch transfers and recommends keeping branch identifiers in core data models from the beginning. fileciteturn2file17

## US-171 — Define transfer workflow

### Transfer lifecycle

```text
Draft
  ↓
Submitted
  ↓
Approved
  ↓
In Transit
  ↓
Received
```

The exact states must be aligned with the finalized StockTransfer schema.

### Tasks

- TASK-177 — Review final StockTransfer schema.
- TASK-178 — Define source location.
- TASK-179 — Define destination location.
- TASK-180 — Define transfer item structure.
- TASK-181 — Define transfer status.
- TASK-182 — Define approval rules.
- TASK-183 — Define transfer quantity rules.
- TASK-184 — Define transfer cancellation rules.
- TASK-185 — Define partial receipt behavior.
- TASK-186 — Define transfer idempotency.
- TASK-187 — Define branch-level permissions.

---

## US-172 — Create stock transfer

### Acceptance Criteria

1. Source and destination cannot be invalid.
2. At least one item is required.
3. Quantity must be positive.
4. Source stock availability is validated.
5. Locked/expired batches are handled according to business rules.
6. Transfer creation does not incorrectly double-count stock.
7. Transfer lifecycle is tracked.

### Tasks

- TASK-188 — Implement transfer DTO.
- TASK-189 — Validate source.
- TASK-190 — Validate destination.
- TASK-191 — Validate items.
- TASK-192 — Validate batch.
- TASK-193 — Validate quantity.
- TASK-194 — Validate stock availability.
- TASK-195 — Implement transfer service.
- TASK-196 — Implement create API.
- TASK-197 — Implement transfer UI.
- TASK-198 — Add permission guard.
- TASK-199 — Add audit event.
- TASK-200 — Add tests.

---

## US-173 — Ship transfer

### Tasks

- TASK-201 — Implement transfer approval.
- TASK-202 — Implement transfer dispatch.
- TASK-203 — Generate source movement.
- TASK-204 — Update source stock.
- TASK-205 — Mark transfer in transit.
- TASK-206 — Prevent duplicate dispatch.
- TASK-207 — Add audit event.
- TASK-208 — Add Outbox event.
- TASK-209 — Add tests.

---

## US-174 — Receive transfer

### Tasks

- TASK-210 — Implement receive DTO.
- TASK-211 — Validate receiving branch/location.
- TASK-212 — Validate received quantity.
- TASK-213 — Support partial receipt if approved.
- TASK-214 — Generate destination movement.
- TASK-215 — Update destination stock.
- TASK-216 — Complete transfer lifecycle.
- TASK-217 — Prevent duplicate receipt.
- TASK-218 — Add audit event.
- TASK-219 — Add synchronization event.
- TASK-220 — Add tests.

---

## US-175 — Transfer history

### Tasks

- TASK-221 — Implement transfer search.
- TASK-222 — Add status filter.
- TASK-223 — Add source filter.
- TASK-224 — Add destination filter.
- TASK-225 — Add date filter.
- TASK-226 — Add Medicine/Batch filter.
- TASK-227 — Implement transfer list API.
- TASK-228 — Implement transfer detail UI.
- TASK-229 — Add tests.

---

# 12. FEAT-071 — Physical Stock Take

The database overview defines:

```text
StockTake
StockTakeItem
```

as Inventory tables. fileciteturn3file2

## US-176 — Create stock take

### Purpose

Record physical inventory counts and compare them against system stock.

### Workflow

```text
Create Stock Take
       ↓
Freeze / Snapshot
       ↓
Count Physically
       ↓
Enter Count
       ↓
Calculate Variance
       ↓
Review
       ↓
Approve
       ↓
Post Adjustment
```

### Tasks

- TASK-230 — Review StockTake schema.
- TASK-231 — Review StockTakeItem schema.
- TASK-232 — Define stock-take scope.
- TASK-233 — Define branch/location scope.
- TASK-234 — Define count status.
- TASK-235 — Define snapshot behavior.
- TASK-236 — Define concurrent transaction behavior.
- TASK-237 — Define variance rules.
- TASK-238 — Define approval rules.
- TASK-239 — Implement Prisma models.
- TASK-240 — Add constraints.
- TASK-241 — Add indexes.
- TASK-242 — Create migration.

---

## US-177 — Enter physical count

### Acceptance Criteria

1. User can record physical quantity.
2. Count is associated with the correct medicine/batch.
3. System quantity is visible.
4. Variance is calculated.
5. Negative counted quantity is rejected.
6. Count changes are controlled and auditable.

### Tasks

- TASK-243 — Implement count DTO.
- TASK-244 — Implement count validation.
- TASK-245 — Implement StockTakeService.
- TASK-246 — Implement item entry API.
- TASK-247 — Implement physical count UI.
- TASK-248 — Implement batch scanning/lookup where applicable.
- TASK-249 — Implement variance calculation.
- TASK-250 — Add tests.

---

## US-178 — Approve and post stock take

### Tasks

- TASK-251 — Implement review state.
- TASK-252 — Implement approval state.
- TASK-253 — Implement variance approval rules.
- TASK-254 — Generate adjustment movements.
- TASK-255 — Update Stock atomically.
- TASK-256 — Prevent duplicate posting.
- TASK-257 — Add audit event.
- TASK-258 — Add Outbox events.
- TASK-259 — Add tests.

---

# 13. FEAT-072 — Inventory Search & Availability

The legacy application material contains product/stock search workflows showing information such as stock quantity, product name, pack description, manufacturer, MRP, shelf and generic/composition. fileciteturn3file4

## US-179 — Search inventory

### Search dimensions

```text
Medicine
Generic
Manufacturer
Batch
Expiry
Stock status
Location
Branch
Schedule
```

Only dimensions supported by the finalized database should be exposed.

### Tasks

- TASK-260 — Define inventory search contract.
- TASK-261 — Implement search service.
- TASK-262 — Add Medicine search.
- TASK-263 — Add Batch search.
- TASK-264 — Add expiry search.
- TASK-265 — Add stock-state filter.
- TASK-266 — Add branch filter.
- TASK-267 — Add location filter.
- TASK-268 — Add pagination.
- TASK-269 — Add sorting.
- TASK-270 — Add database indexes.
- TASK-271 — Implement API.
- TASK-272 — Implement Angular search UI.
- TASK-273 — Add tests.

---

## US-180 — Provide batch availability lookup

### Acceptance Criteria

1. User can find available batches for a medicine.
2. Stock quantity is visible.
3. Expiry is visible.
4. Locked/unavailable batches are excluded where required.
5. Results can later be consumed by Sales and Purchase workflows.

### Tasks

- TASK-274 — Define batch availability contract.
- TASK-275 — Implement availability service.
- TASK-276 — Implement available quantity calculation.
- TASK-277 — Implement batch ordering rules.
- TASK-278 — Implement lookup API.
- TASK-279 — Implement reusable Angular component.
- TASK-280 — Add keyboard selection.
- TASK-281 — Add tests.

---

# 14. FEAT-073 — Expiry & Near-Expiry Management

The legacy report list explicitly includes:

- Expiry Stock
- Expiry Stock (Date wise)

fileciteturn3file1

## US-181 — Identify expired stock

### Acceptance Criteria

1. Expired batches are identifiable.
2. Expiry comparison uses a consistent date rule.
3. Expired quantity is visible.
4. Expired stock can be filtered by branch/location where applicable.
5. Expired stock is not silently treated as sellable.

### Tasks

- TASK-282 — Define expiry-date interpretation.
- TASK-283 — Implement expired batch query.
- TASK-284 — Implement expired stock query.
- TASK-285 — Add date filtering.
- TASK-286 — Add Medicine filtering.
- TASK-287 — Add Batch filtering.
- TASK-288 — Implement API.
- TASK-289 — Implement UI.
- TASK-290 — Add tests.

---

## US-182 — Identify near-expiry stock

### Tasks

- TASK-291 — Define near-expiry threshold configuration.
- TASK-292 — Implement threshold-based query.
- TASK-293 — Add configurable date range.
- TASK-294 — Implement near-expiry API.
- TASK-295 — Implement near-expiry UI.
- TASK-296 — Add sorting by expiry.
- TASK-297 — Add tests.

---

## US-183 — Prevent invalid sale of expired/locked stock

The exact enforcement belongs to Sales, but Inventory should expose authoritative availability information.

### Tasks

- TASK-298 — Define inventory availability contract.
- TASK-299 — Expose batch eligibility.
- TASK-300 — Expose expiry state.
- TASK-301 — Expose lock state.
- TASK-302 — Add backend validation service.
- TASK-303 — Add API tests.

---

# 15. FEAT-074 — Inventory Valuation & Quantity Controls

This phase should not implement the complete Pricing module. It should establish inventory-side quantity and valuation foundations required by later modules.

The legacy report material includes `Total Stock Value`, `Itemwise Closing Stock As On Date`, `Productwise Sales Closing Stock`, and supplierwise/itemwise closing stock reporting. fileciteturn3file1

## US-184 — Calculate stock quantity as of date

### Tasks

- TASK-304 — Define as-of-date semantics.
- TASK-305 — Implement movement aggregation query.
- TASK-306 — Implement opening quantity logic.
- TASK-307 — Implement inbound aggregation.
- TASK-308 — Implement outbound aggregation.
- TASK-309 — Implement adjustment aggregation.
- TASK-310 — Implement transfer aggregation.
- TASK-311 — Implement closing quantity.
- TASK-312 — Add tests.

## US-185 — Calculate stock value

### Acceptance Criteria

The exact valuation method must be defined before implementation.

### Tasks

- TASK-313 — Review valuation requirements.
- TASK-314 — Define cost source.
- TASK-315 — Define valuation method.
- TASK-316 — Define handling of free quantity.
- TASK-317 — Define handling of returns.
- TASK-318 — Define adjustment valuation.
- TASK-319 — Define historical valuation behavior.
- TASK-320 — Implement valuation service after approval.
- TASK-321 — Add tests.

---

# 16. FEAT-075 — Inventory Authorization & Audit

## US-186 — Define Inventory permissions

Recommended permission groups:

```text
Inventory.View
Inventory.Batch.View
Inventory.Batch.Create
Inventory.Batch.Update
Inventory.Batch.Lock
Inventory.Batch.Unlock

Inventory.Stock.View
Inventory.StockMovement.View

Inventory.Adjustment.View
Inventory.Adjustment.Create
Inventory.Adjustment.Approve
Inventory.Adjustment.Post

Inventory.Transfer.View
Inventory.Transfer.Create
Inventory.Transfer.Approve
Inventory.Transfer.Dispatch
Inventory.Transfer.Receive
Inventory.Transfer.Cancel

Inventory.StockTake.View
Inventory.StockTake.Create
Inventory.StockTake.Count
Inventory.StockTake.Approve
Inventory.StockTake.Post
```

### Tasks

- TASK-322 — Finalize Inventory permission catalog.
- TASK-323 — Seed permissions.
- TASK-324 — Map permissions to roles.
- TASK-325 — Add backend guards.
- TASK-326 — Add frontend permission handling.
- TASK-327 — Test unauthorized stock adjustment.
- TASK-328 — Test unauthorized transfer.
- TASK-329 — Test unauthorized stock-take posting.
- TASK-330 — Test unauthorized batch lock/unlock.

---

## US-187 — Audit Inventory operations

### Audit events

```text
BatchCreated
BatchUpdated
BatchLocked
BatchUnlocked

StockAdjusted
StockTransferred
StockTransferReceived

StockTakeCreated
StockTakeCounted
StockTakeApproved
StockTakePosted

StockMovementCreated
```

### Tasks

- TASK-331 — Define Inventory audit taxonomy.
- TASK-332 — Implement Batch audit.
- TASK-333 — Implement StockAdjustment audit.
- TASK-334 — Implement StockTransfer audit.
- TASK-335 — Implement StockTake audit.
- TASK-336 — Implement StockMovement audit.
- TASK-337 — Ensure stock-changing operations capture actor.
- TASK-338 — Ensure source-document references are retained.
- TASK-339 — Add audit tests.

---

# 17. FEAT-076 — Inventory API & Domain Services

## US-188 — Implement Inventory REST APIs

### Suggested API surface

```text
GET    /inventory/stock
GET    /inventory/stock/{id}

GET    /inventory/batches
GET    /inventory/batches/{id}
POST   /inventory/batches
PUT    /inventory/batches/{id}

GET    /inventory/movements
GET    /inventory/adjustments
POST   /inventory/adjustments

GET    /inventory/transfers
POST   /inventory/transfers
POST   /inventory/transfers/{id}/dispatch
POST   /inventory/transfers/{id}/receive

GET    /inventory/stock-takes
POST   /inventory/stock-takes
POST   /inventory/stock-takes/{id}/count
POST   /inventory/stock-takes/{id}/approve
POST   /inventory/stock-takes/{id}/post
```

The architecture handbook recommends consistent REST APIs and standard error structures. fileciteturn2file11

### Tasks

- TASK-340 — Define Inventory API conventions.
- TASK-341 — Define request DTOs.
- TASK-342 — Define response DTOs.
- TASK-343 — Define pagination.
- TASK-344 — Define filtering.
- TASK-345 — Define sorting.
- TASK-346 — Define standard error responses.
- TASK-347 — Implement BatchController.
- TASK-348 — Implement StockController.
- TASK-349 — Implement StockMovementController.
- TASK-350 — Implement StockAdjustmentController.
- TASK-351 — Implement StockTransferController.
- TASK-352 — Implement StockTakeController.
- TASK-353 — Add API documentation.
- TASK-354 — Add API integration tests.

---

## US-189 — Implement Inventory domain services

### Tasks

- TASK-355 — Implement BatchService.
- TASK-356 — Implement StockService.
- TASK-357 — Implement StockMovementService.
- TASK-358 — Implement StockAdjustmentService.
- TASK-359 — Implement StockTransferService.
- TASK-360 — Implement StockTakeService.
- TASK-361 — Implement InventoryQueryService.
- TASK-362 — Implement InventoryValidationService.
- TASK-363 — Implement InventoryConsistencyService.
- TASK-364 — Add service unit tests.

---

# 18. FEAT-077 — Inventory UI/UX & Keyboard Workflow

The architecture handbook says the ERP should optimize pharmacist workflow with minimum clicks, fast search, clear feedback and keyboard-first operation. fileciteturn2file11

## US-190 — Inventory dashboard

### Dashboard information

```text
Total Stock Items
Low/Short Stock
Near Expiry
Expired Stock
Locked Batches
Recent Adjustments
Pending Transfers
Open Stock Takes
```

Only metrics supported by implemented domains should be shown.

### Tasks

- TASK-365 — Create Inventory route.
- TASK-366 — Create inventory dashboard.
- TASK-367 — Implement stock summary cards.
- TASK-368 — Implement expiry summary.
- TASK-369 — Implement pending operation summary.
- TASK-370 — Add permission-aware visibility.
- TASK-371 — Add loading states.
- TASK-372 — Add error states.
- TASK-373 — Add tests.

---

## US-191 — Stock list screen

### Suggested columns

```text
Medicine
Generic
Batch
Expiry
Quantity
Status
Location
Branch
```

Actual columns must follow the finalized schema.

### Tasks

- TASK-374 — Create stock list component.
- TASK-375 — Implement search.
- TASK-376 — Implement filters.
- TASK-377 — Implement sorting.
- TASK-378 — Implement pagination.
- TASK-379 — Implement stock detail drawer/page.
- TASK-380 — Add batch navigation.
- TASK-381 — Add movement history navigation.
- TASK-382 — Add keyboard navigation.
- TASK-383 — Add tests.

---

## US-192 — Batch management UI

### Tasks

- TASK-384 — Create batch list screen.
- TASK-385 — Create batch detail screen.
- TASK-386 — Create batch edit form.
- TASK-387 — Implement batch search.
- TASK-388 — Implement expiry filter.
- TASK-389 — Implement lock/unlock action.
- TASK-390 — Add permission-aware actions.
- TASK-391 — Add confirmation dialogs.
- TASK-392 — Add audit/history access.
- TASK-393 — Add tests.

---

## US-193 — Stock adjustment UI

### Tasks

- TASK-394 — Create adjustment form.
- TASK-395 — Medicine lookup.
- TASK-396 — Batch lookup.
- TASK-397 — Quantity input.
- TASK-398 — Adjustment reason selection.
- TASK-399 — Before/after stock display.
- TASK-400 — Validation messages.
- TASK-401 — Save workflow.
- TASK-402 — Confirmation workflow.
- TASK-403 — Adjustment history screen.
- TASK-404 — Add keyboard-first operation.
- TASK-405 — Add tests.

---

## US-194 — Stock transfer UI

### Tasks

- TASK-406 — Create transfer list.
- TASK-407 — Create transfer form.
- TASK-408 — Source selection.
- TASK-409 — Destination selection.
- TASK-410 — Medicine/batch selection.
- TASK-411 — Quantity entry.
- TASK-412 — Transfer review.
- TASK-413 — Dispatch action.
- TASK-414 — Receive action.
- TASK-415 — Partial receipt UX if approved.
- TASK-416 — Transfer history.
- TASK-417 — Add tests.

---

## US-195 — Stock take UI

### Tasks

- TASK-418 — Create stock-take list.
- TASK-419 — Create stock-take workflow.
- TASK-420 — Show expected quantity.
- TASK-421 — Enter physical quantity.
- TASK-422 — Calculate variance.
- TASK-423 — Highlight variance.
- TASK-424 — Review screen.
- TASK-425 — Approval screen.
- TASK-426 — Posting confirmation.
- TASK-427 — Add barcode/scanner workflow where applicable.
- TASK-428 — Add keyboard workflow.
- TASK-429 — Add tests.

---

# 19. FEAT-078 — Offline-First Inventory & Synchronization

The architecture handbook defines:

```text
Local SQLite = source of truth during daily operation

Push
Local → Cloud

Pull
Cloud → Local

Outbox
Read → Send → Success → Retry

Idempotency
Unique UUID per transaction

Conflict Resolution
Inventory = transaction based
Never overwrite stock
```

fileciteturn2file11

## US-196 — Outbox integration

### Tasks

- TASK-430 — Identify all inventory mutation events.
- TASK-431 — Define Outbox payload for Batch.
- TASK-432 — Define Outbox payload for Adjustment.
- TASK-433 — Define Outbox payload for Transfer.
- TASK-434 — Define Outbox payload for StockTake.
- TASK-435 — Define Outbox payload for StockMovement.
- TASK-436 — Generate Outbox records transactionally.
- TASK-437 — Implement retry behavior.
- TASK-438 — Implement failure tracking.
- TASK-439 — Add tests.

---

## US-197 — Inventory idempotency

### Acceptance Criteria

1. Replayed requests do not duplicate stock changes.
2. Replayed movement events do not duplicate movements.
3. Replayed transfers do not double-decrement or double-increment stock.
4. Replayed stock-take posting does not duplicate adjustments.

### Tasks

- TASK-440 — Define inventory idempotency strategy.
- TASK-441 — Implement mutation idempotency keys.
- TASK-442 — Implement movement deduplication.
- TASK-443 — Implement adjustment deduplication.
- TASK-444 — Implement transfer deduplication.
- TASK-445 — Implement stock-take posting deduplication.
- TASK-446 — Add replay tests.

---

## US-198 — Inventory conflict handling

### Acceptance Criteria

Inventory conflicts must be treated as transactions rather than simple last-write-wins updates.

### Tasks

- TASK-447 — Define conflict scenarios.
- TASK-448 — Define concurrent sale conflict.
- TASK-449 — Define concurrent purchase receipt conflict.
- TASK-450 — Define concurrent adjustment conflict.
- TASK-451 — Define concurrent transfer conflict.
- TASK-452 — Define concurrent stock-take conflict.
- TASK-453 — Prevent stock overwrite during sync.
- TASK-454 — Implement conflict recording.
- TASK-455 — Implement conflict resolution workflow.
- TASK-456 — Add SyncConflict integration.
- TASK-457 — Add conflict tests.

---

# 20. FEAT-079 — Inventory Testing, Performance & Readiness

## US-199 — Unit tests

### Tasks

- TASK-458 — Batch validation tests.
- TASK-459 — Batch lifecycle tests.
- TASK-460 — Stock balance tests.
- TASK-461 — Stock movement tests.
- TASK-462 — Stock adjustment tests.
- TASK-463 — Stock transfer tests.
- TASK-464 — Stock take tests.
- TASK-465 — Expiry tests.
- TASK-466 — Availability tests.
- TASK-467 — Authorization tests.
- TASK-468 — Idempotency tests.
- TASK-469 — Concurrency tests.

---

## US-200 — API integration tests

### Tasks

- TASK-470 — Batch CRUD API tests.
- TASK-471 — Stock API tests.
- TASK-472 — StockMovement API tests.
- TASK-473 — Adjustment API tests.
- TASK-474 — Transfer API tests.
- TASK-475 — StockTake API tests.
- TASK-476 — Expiry API tests.
- TASK-477 — Search/filter tests.
- TASK-478 — Authorization failure tests.
- TASK-479 — Validation failure tests.
- TASK-480 — Transaction rollback tests.

---

## US-201 — End-to-end inventory workflows

### Workflow 1 — Receive inventory

```text
Medicine
 ↓
Batch
 ↓
Stock increase
 ↓
StockMovement
 ↓
Audit
 ↓
Outbox
```

### Workflow 2 — Sell inventory

```text
Available batch
 ↓
Stock validation
 ↓
Stock decrease
 ↓
StockMovement
 ↓
Audit
 ↓
Outbox
```

### Workflow 3 — Adjustment

```text
Stock
 ↓
Adjustment
 ↓
Movement
 ↓
Stock balance
 ↓
Audit
```

### Workflow 4 — Transfer

```text
Source stock
 ↓
Transfer
 ↓
Dispatch
 ↓
Source decrease
 ↓
Receive
 ↓
Destination increase
```

### Workflow 5 — Stock take

```text
Snapshot
 ↓
Physical count
 ↓
Variance
 ↓
Approval
 ↓
Adjustment
 ↓
Movement
```

### Tasks

- TASK-481 — E2E receive inventory flow.
- TASK-482 — E2E stock deduction flow.
- TASK-483 — E2E adjustment flow.
- TASK-484 — E2E transfer flow.
- TASK-485 — E2E stock-take flow.
- TASK-486 — E2E expiry flow.
- TASK-487 — E2E offline mutation flow.
- TASK-488 — E2E sync retry flow.
- TASK-489 — E2E duplicate request flow.
- TASK-490 — E2E concurrent update flow.

---

## US-202 — Performance testing

### Acceptance Criteria

1. Inventory search remains responsive with realistic data volume.
2. Stock lookup does not load unnecessary records.
3. Movement history is paginated.
4. Large stock-take operations do not freeze the UI.
5. Database indexes are verified.
6. Stock update transactions remain safe under concurrent activity.

### Tasks

- TASK-491 — Define realistic inventory dataset.
- TASK-492 — Seed large Medicine/Batch dataset.
- TASK-493 — Seed large Stock dataset.
- TASK-494 — Seed large StockMovement dataset.
- TASK-495 — Benchmark stock search.
- TASK-496 — Benchmark batch availability.
- TASK-497 — Benchmark movement history.
- TASK-498 — Benchmark stock-take queries.
- TASK-499 — Inspect query plans.
- TASK-500 — Add indexes where justified.
- TASK-501 — Re-run benchmarks.
- TASK-502 — Test concurrent stock operations.

---

## US-203 — Database compatibility

### Tasks

- TASK-503 — Validate SQLite schema.
- TASK-504 — Validate PostgreSQL schema.
- TASK-505 — Validate foreign keys.
- TASK-506 — Validate unique constraints.
- TASK-507 — Validate indexes.
- TASK-508 — Validate transactions.
- TASK-509 — Validate decimal/quantity handling.
- TASK-510 — Validate soft-delete behavior.
- TASK-511 — Validate optimistic locking.
- TASK-512 — Run SQLite integration suite.
- TASK-513 — Run PostgreSQL integration suite.

---

## US-204 — Inventory documentation

### Tasks

- TASK-514 — Document Batch domain.
- TASK-515 — Document Stock domain.
- TASK-516 — Document StockMovement domain.
- TASK-517 — Document Adjustment workflow.
- TASK-518 — Document Transfer workflow.
- TASK-519 — Document StockTake workflow.
- TASK-520 — Document expiry behavior.
- TASK-521 — Document inventory permissions.
- TASK-522 — Document audit events.
- TASK-523 — Document synchronization behavior.
- TASK-524 — Document idempotency rules.
- TASK-525 — Document conflict rules.
- TASK-526 — Document API contracts.

---

## US-205 — Phase readiness

### Tasks

- TASK-527 — Complete database review.
- TASK-528 — Complete backend code review.
- TASK-529 — Complete Angular code review.
- TASK-530 — Complete security review.
- TASK-531 — Complete offline/sync review.
- TASK-532 — Complete performance review.
- TASK-533 — Complete QA review.
- TASK-534 — Validate all acceptance criteria.
- TASK-535 — Validate downstream Purchase integration points.
- TASK-536 — Validate downstream Sales integration points.
- TASK-537 — Complete Phase 6 sign-off.

---

# 21. Inventory Permission Catalog

Recommended initial permission model:

```text
Inventory.View

Inventory.Batch.View
Inventory.Batch.Create
Inventory.Batch.Update
Inventory.Batch.Lock
Inventory.Batch.Unlock

Inventory.Stock.View
Inventory.StockMovement.View

Inventory.Adjustment.View
Inventory.Adjustment.Create
Inventory.Adjustment.Approve
Inventory.Adjustment.Post

Inventory.Transfer.View
Inventory.Transfer.Create
Inventory.Transfer.Approve
Inventory.Transfer.Dispatch
Inventory.Transfer.Receive
Inventory.Transfer.Cancel

Inventory.StockTake.View
Inventory.StockTake.Create
Inventory.StockTake.Count
Inventory.StockTake.Approve
Inventory.StockTake.Post
```

The exact permissions should be reconciled with the Phase 4 security model.

---

# 22. Inventory Business Rules

The following rules should be treated as core design rules unless the detailed table specifications explicitly change them.

## 22.1 Stock must not be directly edited

Bad:

```text
UPDATE Stock
SET quantity = 100
```

Preferred:

```text
Business Operation
      ↓
StockMovement
      ↓
Stock Balance Update
```

The architecture specifically requires Inventory to be transaction-based and not overwrite stock during conflict handling. fileciteturn2file11

---

## 22.2 Every stock-changing operation must be traceable

Examples:

```text
Purchase Receipt
Sale
Sales Return
Purchase Return
Adjustment
Transfer
Stock Take
Opening Stock
```

Each should result in traceable inventory movement.

---

## 22.3 Historical movements should not be casually deleted

If an incorrect movement must be corrected:

```text
Incorrect Movement
       ↓
Correction / Reversal
       ↓
New Movement
```

Do not simply delete the historical movement and rewrite the balance.

---

## 22.4 Negative stock must be explicitly controlled

Do not leave this behavior undefined.

Before implementation, decide:

```text
Allow negative stock?
OR
Block transaction?
OR
Allow only for specific roles?
OR
Allow with supervisor approval?
```

Create a configuration/business rule and test it.

---

## 22.5 Expired stock must be distinguishable

Expired stock may physically exist but should not automatically be treated as available-for-sale stock.

Inventory should expose its state so Sales can enforce its own transaction rule.

---

## 22.6 Locked batches must be protected

A locked batch should be prevented from prohibited operations by backend validation, not just by hiding a button.

---

## 22.7 Stock synchronization must be transaction based

Never use:

```text
Cloud stock = Local stock
```

as a conflict resolution strategy.

Instead synchronize:

```text
Stock transaction
       ↓
Movement
       ↓
Server-side application
```

This aligns with the architecture's explicit Inventory conflict rule. fileciteturn2file11

---

# 23. Inventory Reports / Queries to Prepare

The legacy report inventory includes a substantial set of stock-oriented reporting concepts. These should influence the query/service design, while the actual reporting UI can be handled in a dedicated Reporting phase.

Examples include:

```text
Companywise Batchwise Stock
Locationwise Batchwise Stock
Product Typewise Batchwise Stock
Contentwise Batchwise Stock
Schedulewise Batchwise Stock
Expiry Stock
Expiry Stock Date-wise
Product Ledger
Non-Moving Product List
Total Stock Value
Supplierwise Closing Stock
Itemwise Closing Stock As On Date
Product Short List
Below Stock Level
```

fileciteturn3file1

For Phase 6, create reusable query services where the required inventory data is available.

Do not build the entire Reporting module here.

---

# 24. Legacy-Informed Inventory Operations

The legacy application material shows several inventory-related operations that should be considered when validating the modern domain:

```text
Opening Stock
Batch MRP & Expiry Date Changes
Batch Bifurcation
Batch Lock / Unlock
Batch Serial Changes
Batch Barcode Label Print

Expiry / Breakage / Return / Shortage
Stock Issue
Productwise Balance
Stock Reports
```

fileciteturn3file0turn3file3

Some of these may ultimately belong to Purchase, Sales or Reporting rather than Inventory. During implementation, keep ownership aligned with the new normalized domain model rather than reproducing the legacy menu structure literally.

---

# 25. Data Ownership

| Data | Owner |
|---|---|
| Medicine identity | Medicine Master |
| Generic | Medicine Master |
| Manufacturer | Medicine Master |
| Batch | Inventory |
| Batch expiry | Inventory |
| Stock balance | Inventory |
| Stock movement | Inventory |
| Stock adjustment | Inventory |
| Stock transfer | Inventory |
| Physical stock take | Inventory |
| Purchase Order | Purchase |
| Goods Receipt | Purchase |
| Purchase Invoice | Purchase |
| Purchase Return | Purchase |
| Sales Invoice | Sales |
| Sales Return | Sales |
| Sales Payment | Sales |
| Pricing | Pricing |
| Tax | Pricing |

This maintains the database's functional-module separation. fileciteturn3file2

---

# 26. Downstream Integration

Phase 6 should expose stable contracts for:

```text
Medicine Master
      ↓
Inventory
      ↓
┌───────────────┬────────────────┐
│               │                │
Purchase       Sales          Reporting
│               │                │
Receipt        Sale          Stock reports
│               │
Batch/Stock    Stock deduction
```

The database overview's relationship flow explicitly shows:

```text
Invoice
  ↓
Batch
  ↓
Stock
  ↓
Stock Movement
```

fileciteturn3file5

The exact transaction integration should be implemented in the corresponding Purchase/Sales phases, while Inventory provides the authoritative stock domain services.

---

# 27. Testing Matrix

| Area | Required Coverage |
|---|---|
| Batch | Create / Update / Lock / Unlock |
| Stock | Increase / Decrease / Query |
| Movement | Inbound / Outbound / History |
| Adjustment | Create / Validate / Post |
| Transfer | Create / Dispatch / Receive |
| Stock Take | Count / Variance / Approve / Post |
| Expiry | Expired / Near-expiry |
| Search | Medicine / Batch / Stock |
| Authorization | Allowed / Denied |
| Concurrency | Concurrent stock changes |
| Idempotency | Duplicate requests |
| Offline | Local inventory mutation |
| Sync | Retry / replay |
| Conflict | Transaction conflict |
| Audit | Every mutation |
| UI | Lists / forms / workflows |
| Keyboard | Search / selection / save |
| Performance | Large inventory |
| Database | SQLite / PostgreSQL |

---

# 28. Definition of Done

Phase 6 is complete only when:

- [ ] Batch schema is finalized.
- [ ] Batch CRUD is implemented.
- [ ] Batch lifecycle is implemented.
- [ ] Batch locking is implemented where required.
- [ ] Stock schema is finalized.
- [ ] Stock balance engine is implemented.
- [ ] Stock movement engine is implemented.
- [ ] Stock cannot be directly overwritten through normal workflows.
- [ ] Stock adjustments are implemented.
- [ ] Stock transfers are implemented.
- [ ] Physical stock take is implemented.
- [ ] Variance calculation is implemented.
- [ ] Expired stock can be identified.
- [ ] Near-expiry stock can be identified.
- [ ] Inventory search is implemented.
- [ ] Batch availability lookup is implemented.
- [ ] Inventory permissions are implemented.
- [ ] Backend authorization is enforced.
- [ ] Audit events are implemented.
- [ ] Outbox integration is implemented.
- [ ] Inventory idempotency is implemented.
- [ ] Transaction-based conflict handling is implemented.
- [ ] Unit tests pass.
- [ ] API integration tests pass.
- [ ] E2E inventory workflows pass.
- [ ] Performance tests pass.
- [ ] SQLite compatibility is verified.
- [ ] PostgreSQL compatibility is verified.
- [ ] Documentation is complete.
- [ ] Purchase integration contracts are ready.
- [ ] Sales integration contracts are ready.
- [ ] QA sign-off is complete.

---

# 29. Phase 6 Work Item Summary

| Type | Count |
|---|---:|
| Epic | 1 |
| Features | 14 |
| User Stories | 48 |
| Tasks | 537 |
| **Total Work Items** | **600** |

The task list is intentionally detailed so database, NestJS backend, Angular UI, security, audit, offline synchronization, testing, performance and documentation can be tracked independently in Azure DevOps.

Some tasks are intentionally **schema-finalization tasks** because the available database overview confirms the Inventory table names but does not provide the full column-level definitions. This prevents the ADO backlog from inventing fields that are not actually part of your approved schema.

---

# 30. Phase 6 Boundary

At the end of Phase 6:

```text
Medicine Master
       ↓
     Batch
       ↓
     Stock
       ↓
Stock Movement
```

and:

```text
Stock
 ├── Adjustment
 ├── Transfer
 └── Stock Take
```

The system should be able to answer:

```text
What stock do I have?
Which batch?
How much?
Where?
Is it expired?
Is it locked?
What changed it?
When?
Why?
Who performed it?
```

But Phase 6 does NOT implement the complete:

```text
Purchase workflow
Sales workflow
Pricing/tax workflow
Accounting workflow
Reporting module
```

Those remain separate phases.

---

# 31. Final Phase Architecture

```text
                    MEDICINE MASTER
                           │
                           ▼
                         BATCH
                           │
                           ▼
                         STOCK
                           │
             ┌─────────────┼──────────────┐
             │             │              │
             ▼             ▼              ▼
        ADJUSTMENT      TRANSFER       STOCK TAKE
             │             │              │
             └─────────────┼──────────────┘
                           ▼
                    STOCK MOVEMENT
                           │
                           ▼
                        OUTBOX
                           │
                           ▼
                       SYNC ENGINE
```

The critical design principle for Phase 6 is:

> **Stock is a state; StockMovement is the history of how that state changed.**

That separation is the foundation required for a reliable pharmacy inventory system and is especially important because the architecture requires transaction-based inventory synchronization rather than stock overwrites. fileciteturn2file11
