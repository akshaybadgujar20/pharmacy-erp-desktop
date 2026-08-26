# Inventory Domain

The Inventory domain tracks medicine lots, branch-level balances, and every quantity change through an immutable ledger. It answers three operational questions for a pharmacy chain: **what lot** is on hand (Batch), **where and how much** is available (Stock per branch), and **why quantities changed** (StockMovement and originating documents).

Inventory is org-global at the lot level and branch-scoped at the balance level. Costing derives from `Batch.purchaseRate` plus movement history; selling price is **not** stored on Batch.

**Table overview:** [inventory.md](../database/tables/inventory/inventory.md)

**Related domains:** [product.md](product.md), [sales.md](sales.md)

## Overview & Aggregate

### Responsibilities

- Maintain org-global **Batch** identity (batch number, expiry, purchase rate, statutory MRP).
- Maintain branch **Stock** balances keyed by `(branchId, batchId)` with available, reserved, damaged, expired, and in-transit buckets.
- Record every quantity change as an immutable **StockMovement** with `balanceAfter`, `unitCost`, and polymorphic reference.
- Orchestrate **StockAdjustment**, **StockTransfer**, and **StockTake** workflows that produce ledger entries — never direct balance edits.
- Enforce **FEFO** (First Expiry First Out) for dispensing and allocation.
- Guard negative available stock on OUT movements unless explicitly overridden by policy.
- Publish domain events and outbox payloads for sync, audit, and downstream reporting.

### In scope

Batch lifecycle (create on GRN/purchase receipt, deactivate, soft delete); stock balance queries and availability checks per branch; ledger application via `InventoryLedgerService.applyMovement`; manual corrections (StockAdjustment); inter-branch moves (StockTransfer); physical counts (StockTake); reservation semantics on `Stock.reservedQuantity`; expiry-driven eligibility; unit cost snapshots on movements and document lines.

### Out of scope

**Sale pricing** — branch-scoped `PriceList` / `PriceListItem`; sale lines snapshot price at invoice time. **Purchase order / GRN creation** — Purchasing domain; inventory consumes GRN outcomes. **Sales invoice posting** — Sales domain; inventory receives OUT movement requests. **General ledger / accounting journals** — Finance domain consumes movement cost data. **Medicine master data** — Product/Medicine domain owns SKU identity.

### Related entities

| Entity | Role |
|--------|------|
| **Batch** | Org-global lot identity |
| **Stock** | Balance per `(branchId, batchId)` |
| **StockMovement** | Immutable ledger entry |
| **StockAdjustment** / **StockAdjustmentItem** | Manual correction header and lines |
| **StockTransfer** / **StockTransferItem** | Inter-branch transfer header and lines |
| **StockTake** / **StockTakeItem** | Physical count session and counted lines |
| **Medicine** | Product master |
| **Branch** | Tenant location |
| **Employee** | Approver / counter |

### Aggregate structure

```
┌─────────────────────────────────────────────────────────────┐
│  Batch (org-global)                                         │
│  - medicineId, batchNumber, expiryDate, purchaseRate, mrp   │
└──────────────────────────┬──────────────────────────────────┘
                           │ 1 : many
┌──────────────────────────▼──────────────────────────────────┐
│  Stock (branch-scoped balance)                              │
│  - unique (branchId, batchId)                               │
└──────────────────────────┬──────────────────────────────────┘
                           │ updated via
┌──────────────────────────▼──────────────────────────────────┐
│  StockMovement (immutable ledger)                           │
│  - IN/OUT, balanceAfter, referenceTable/referenceId         │
└─────────────────────────────────────────────────────────────┘

Document aggregates (each: header + items → movements):
  StockAdjustment    StockTransfer    StockTake
```

#### Batch aggregate (soft boundary)

- **Identity:** `(medicineId, batchNumber)` unique org-wide.
- **Creation:** Typically on first GRN receipt; may be referenced by multiple branches via Stock rows.
- **Mutability:** `purchaseRate` and `mrp` are lot snapshots at receipt; changes after movements exist require explicit policy (normally immutable).
- **No branch fields.** Batch never stores quantity.

#### Stock aggregate (balance root per branch + batch)

- **Identity:** `(branchId, batchId)`.
- **Invariant:** `availableQuantity >= 0` on OUT unless policy override.
- **Invariant:** `reservedQuantity <= availableQuantity` (when reservation active).
- **Concurrency:** `version` optimistic lock on every balance update.
- **Mutation path:** Only `InventoryLedgerService.applyMovement` (or dedicated reservation service updating reserved buckets).

#### StockMovement (ledger entry — not an aggregate root)

- Created in the same transaction as Stock update.
- Immutable after insert; no `updatedAt` business edits.
- **Invariant:** `quantity > 0`; direction determines add vs subtract.
- **Invariant:** `balanceAfter` equals Stock.availableQuantity after apply (for available bucket movements).

#### StockAdjustment aggregate

- **Root:** StockAdjustment.
- **Children:** StockAdjustmentItem (unique per `batchId` per document).
- **Commit:** On approval, each item with non-zero quantity produces `ADJUSTMENT_GAIN` (IN) or `ADJUSTMENT_LOSS` (OUT) movement at item `unitCost`.
- **Branch scope:** Single `branchId` on header.

#### StockTransfer aggregate

- **Root:** StockTransfer.
- **Children:** StockTransferItem.
- **Cross-branch:** Coordinates two Stock aggregates (source OUT, destination IN) in one transaction at dispatch/receive milestones.

#### StockTake aggregate

- **Root:** StockTake.
- **Children:** StockTakeItem with `systemQuantity`, `physicalQuantity`, `varianceQuantity`.
- **Reconciliation:** Generates linked StockAdjustment (`stockAdjustmentId` on item); inventory moves only when adjustment approves.

**Performance notes:** Hot path is `(branchId, batchId)` Stock lookup via unique index; optimistic locking on `Stock.version`; ledger indexes on `(branchId, batchId, movementDate)` and `(referenceTable, referenceId)`; FEFO queries use `(medicineId, expiryDate)` on Batch; multi-line documents run in single `UnitOfWorkService.run` with one retry on conflict.

## Terminology

| Term | Definition | Persistence |
|------|------------|-------------|
| **Batch** | Org-global lot identity for a medicine (batch number, expiry, landed cost, MRP) | `Batch` |
| **Stock** | Branch-scoped quantity buckets for a batch at a location | `Stock` |
| **StockMovement** | Immutable ledger entry explaining a quantity change | `StockMovement` |
| **FEFO** | First Expiry First Out — allocate earliest `expiryDate` among eligible batches | Query ordering on `Batch.expiryDate` |
| **Available quantity** | Saleable units at a branch | `Stock.availableQuantity` |
| **Reserved quantity** | Units held for pending sales or dispatch | `Stock.reservedQuantity` |
| **Free stock** | Effective saleable = `availableQuantity - reservedQuantity` | Derived |
| **purchaseRate** | Lot cost at receipt; default unit cost | `Batch.purchaseRate` |
| **unitCost** | Immutable cost snapshot on a movement or document line | `StockMovement.unitCost` |
| **MRP** | Statutory maximum retail price on pack — not inventory cost | `Batch.mrp` |
| **Adjustment** | Manual correction document (damage, expiry, count variance, etc.) | `StockAdjustment` |
| **Transfer** | Inter-branch move of existing batch identity | `StockTransfer` |
| **Stock take** | Physical count session reconciled via adjustment | `StockTake` |

External systems exchange **uuid** identifiers, never local numeric ids.

## Business Rules & Invariants

### Structural rules

| ID | Rule |
|----|------|
| BR-01 | Batch is **org-global**; unique `(medicineId, batchNumber)`. |
| BR-02 | Stock is **branch-scoped**; unique `(branchId, batchId)`. |
| BR-03 | StockMovement is **append-only**; never update or delete. |
| BR-04 | Quantity on movement is always **> 0**; direction is IN or OUT. |
| BR-05 | Document numbers (`movementNumber`, `adjustmentNumber`, `transferNumber`, `stockTakeNumber`) are unique **per branch** (transfer: per source branch). |
| BR-06 | Stock quantity columns change **only** via ledger or approved reservation/in-transit services. |
| BR-07 | UUID is sync identifier; BIGINT `id` is local-only. |

### Batch and expiry

| ID | Rule |
|----|------|
| BR-10 | Batch stores **purchaseRate** and **mrp**; **no saleRate**. |
| BR-11 | **FEFO:** allocate earliest `expiryDate` among batches with available stock. |
| BR-12 | **Expired batches cannot be sold** — block sales OUT unless explicit override (not default). |
| BR-13 | Expiry write-off uses adjustment workflow, not delete batch. |

### Stock balances

| ID | Rule |
|----|------|
| BR-20 | `availableQuantity >= 0` on OUT (default). |
| BR-21 | `reservedQuantity <= availableQuantity` (strict reservation mode). |
| BR-22 | Optimistic lock: Stock update must match `version` or conflict. |
| BR-23 | First IN at branch creates Stock row if absent. |

### Ledger and costing

| ID | Rule |
|----|------|
| BR-30 | Every inventory change produces exactly one StockMovement per quantity application. |
| BR-31 | `unitCost` on movement snapshots cost at transaction time (usually Batch.purchaseRate). |
| BR-32 | `balanceAfter` reflects availableQuantity after movement (for standard IN/OUT on available bucket). |
| BR-33 | `referenceTable` + `referenceId` must identify originating line item or document. |
| BR-34 | Movement types include: PURCHASE_GRN, SALES_INVOICE, PURCHASE_RETURN, SALES_RETURN, TRANSFER_IN, TRANSFER_OUT, ADJUSTMENT_GAIN, ADJUSTMENT_LOSS. |

### Stock adjustment

| ID | Rule |
|----|------|
| BR-40 | Adjustment belongs to one branch; requires reason. |
| BR-41 | At least one StockAdjustmentItem before approval. |
| BR-42 | Unique batch per adjustment document. |
| BR-43 | Approved adjustment is immutable; reversal = new adjustment. |
| BR-44 | Positive item qty → ADJUSTMENT_GAIN; negative → ADJUSTMENT_LOSS. |

### Stock transfer

| ID | Rule |
|----|------|
| BR-50 | `sourceBranchId ≠ destinationBranchId`. |
| BR-51 | At least one StockTransferItem. |
| BR-52 | Sent qty ≤ source available (at dispatch). |
| BR-53 | Status lifecycle: DRAFT, PENDING_APPROVAL, DISPATCHED, IN_TRANSIT, PARTIALLY_RECEIVED, COMPLETED, REJECTED, CANCELLED. |
| BR-54 | Dispatch creates TRANSFER_OUT at source; receive creates TRANSFER_IN at destination (same batchId). |
| BR-55 | Cancelled / rejected transfers post **no** net inventory change. |
| BR-56 | Partial receive: receivedQuantity + damagedQuantity ≤ sentQuantity; status PARTIALLY_RECEIVED until closed. |

### Stock take

| ID | Rule |
|----|------|
| BR-60 | StockTake does **not** update Stock directly. |
| BR-61 | varianceQuantity = physicalQuantity - systemQuantity. |
| BR-62 | varianceType: MATCHED, SURPLUS, DEFICIT. |
| BR-63 | Reconciliation generates StockAdjustment; movements on adjustment approval. |
| BR-64 | One active stock take per branch (policy — IN_PROGRESS). |

### Validation

#### Common

| Check | Failure code / HTTP |
|-------|---------------------|
| branchId matches RequestContext | FORBIDDEN |
| Entity not soft-deleted | NOT_FOUND |
| Optimistic version mismatch | SEQUENCE_CONFLICT (409) |
| Decimal quantity ≤ 0 where positive required | BAD_REQUEST |

#### Batch

| Check | Rule |
|-------|------|
| medicineId exists, active | NOT_FOUND |
| batchNumber non-empty, unique per medicine | CONFLICT |
| expiryDate required, valid date | BAD_REQUEST |
| purchaseRate, mrp ≥ 0 | BAD_REQUEST |

#### Stock / ledger (InventoryLedgerService)

| Check | Rule |
|-------|------|
| quantity > 0 | BAD_REQUEST |
| OUT: Stock row exists | STOCK_NOT_FOUND |
| OUT: available ≥ quantity | STOCK_INSUFFICIENT |
| batchId belongs to medicineId on movement | BAD_REQUEST |
| movementType, direction valid strings | BAD_REQUEST |
| referenceTable, referenceId present | BAD_REQUEST |

#### StockAdjustment

| Check | Rule |
|-------|------|
| ≥ 1 item before submit | BAD_REQUEST |
| reason non-empty | BAD_REQUEST |
| unique batch per document | CONFLICT |
| item quantity ≠ 0 | BAD_REQUEST |
| item unitCost ≥ 0 | BAD_REQUEST |
| approve only from PENDING_APPROVAL | BAD_REQUEST |
| loss OUT: sufficient available | STOCK_INSUFFICIENT |

#### StockTransfer

| Check | Rule |
|-------|------|
| sourceBranchId ≠ destinationBranchId | BAD_REQUEST |
| ≥ 1 item | BAD_REQUEST |
| sentQuantity > 0 | BAD_REQUEST |
| dispatch: status allows transition | BAD_REQUEST |
| dispatch: sent ≤ source available | STOCK_INSUFFICIENT |
| receive: received + damaged ≤ sent | BAD_REQUEST |
| valid status enum string | BAD_REQUEST |

Valid **status** values: `DRAFT`, `PENDING_APPROVAL`, `DISPATCHED`, `IN_TRANSIT`, `PARTIALLY_RECEIVED`, `COMPLETED`, `REJECTED`, `CANCELLED`.

#### StockTake

| Check | Rule |
|-------|------|
| countedByEmployeeId required | BAD_REQUEST |
| physicalQuantity ≥ 0 | BAD_REQUEST |
| unique batch per stock take | CONFLICT |
| reconcile only from COUNTED | BAD_REQUEST |
| one IN_PROGRESS per branch (policy) | CONFLICT |

Valid **countType**: `FULL_AUDIT`, `CYCLE_COUNT`, `SCHEDULE_H_AUDIT`, `COLD_CHAIN_AUDIT`, `NEAR_EXPIRY_AUDIT`.

Valid **status**: `DRAFT`, `IN_PROGRESS`, `COUNTED`, `RECONCILED`, `CANCELLED`.

#### Expiry / FEFO (sales path)

| Check | Rule |
|-------|------|
| batch.expiryDate ≥ sale date | BAD_REQUEST / domain code |
| FEFO warning if not earliest expiry batch (configurable strict) | WARNING or BAD_REQUEST |

Implementation: class-validator on NestJS DTOs; domain guards in `InventoryLedgerService`; Prisma unique constraints mapped to CONFLICT; `ContextEnrichInterceptor` supplies branchId for scope validation.

## Lifecycle & States

| Aggregate | Stateful? | States |
|-----------|-----------|--------|
| Batch | isActive flag | active / inactive (soft delete) |
| Stock | isActive flag | active balance row |
| StockMovement | No | N/A (immutable) |
| StockAdjustment | Yes | DRAFT, PENDING_APPROVAL, APPROVED, CANCELLED |
| StockTransfer | Yes | DRAFT, PENDING_APPROVAL, DISPATCHED, IN_TRANSIT, PARTIALLY_RECEIVED, COMPLETED, REJECTED, CANCELLED |
| StockTake | Yes | DRAFT, IN_PROGRESS, COUNTED, RECONCILED, CANCELLED |

### StockTransfer

```
                    ┌──────────────┐
                    │    DRAFT     │
                    └──────┬───────┘
                           │ submit
                           ▼
                    ┌──────────────┐     reject      ┌───────────┐
                    │PENDING_APPROVAL├───────────────►│ REJECTED  │
                    └──────┬───────┘                 └───────────┘
                           │ approve + dispatch
                           ▼
                    ┌──────────────┐
                    │  DISPATCHED  │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  IN_TRANSIT  │
                    └──────┬───────┘
                           │ receive (partial ok)
              ┌────────────┴────────────┐
              ▼                         ▼
    ┌──────────────────┐        ┌──────────────┐
    │PARTIALLY_RECEIVED│───────►│  COMPLETED   │
    └──────────────────┘        └──────────────┘

DRAFT / PENDING_APPROVAL ──cancel──► CANCELLED
```

| Status | Stock impact |
|--------|--------------|
| DRAFT, PENDING_APPROVAL, REJECTED, CANCELLED | None |
| DISPATCHED, IN_TRANSIT | OUT source; in-transit tracking |
| PARTIALLY_RECEIVED | Partial IN destination |
| COMPLETED | All quantities accounted |

### StockAdjustment

`DRAFT` → `PENDING_APPROVAL` → `APPROVED` | `CANCELLED`

Approved adjustments are immutable; reversal uses a new adjustment document.

### StockTake

`DRAFT` → `IN_PROGRESS` → `COUNTED` → `RECONCILED` | `CANCELLED`

Stock and StockMovement have no business status enum — they are active balances and immutable facts.

### Batch and Stock status

| Batch state | Condition |
|-------------|-----------|
| **Active** | `isActive = true`, `deletedAt = null` |
| **Inactive** | `isActive = false` — no new receipts; existing stock may still deplete |
| **Deleted (soft)** | `deletedAt` set — hidden from pick lists; ledger retained |

Stock quantity buckets (orthogonal to isActive):

```
availableQuantity     ── saleable
reservedQuantity      ── held
damagedQuantity       ── write-off candidate
expiredQuantity       ── expired on shelf
inTransitQuantity     ── dispatched not yet received at dest
```

### Transfer transition matrix (simplified)

| From → To | Allowed |
|-----------|---------|
| DRAFT → PENDING_APPROVAL | yes |
| PENDING_APPROVAL → DISPATCHED | yes (approved) |
| PENDING_APPROVAL → REJECTED | yes |
| DISPATCHED → IN_TRANSIT | yes |
| IN_TRANSIT → PARTIALLY_RECEIVED / COMPLETED | yes (receive) |
| * → CANCELLED | from DRAFT or PENDING_APPROVAL only |

## Domain Events

Events emit **after** successful UoW commit (outbox in same tx for sync). Idempotent consumers use `(entityType, entityUuid, operationId)`. No event for failed validation.

### Batch

| Event | Trigger | Key payload |
|-------|---------|-------------|
| `BatchCreated` | Batch insert | uuid, medicineId, batchNumber, expiryDate, purchaseRate, mrp |
| `BatchUpdated` | Batch attribute change | uuid, changedFields |
| `BatchDeactivated` | isActive false / soft delete | uuid, medicineId |

### Stock and ledger

| Event | Trigger | Key payload |
|-------|---------|-------------|
| `StockBalanceChanged` | Stock row updated | branchId, batchId, availableQuantity, reservedQuantity, version |
| `StockMovementRecorded` | Movement insert | uuid, movementNumber, branchId, batchId, direction, quantity, unitCost, balanceAfter, movementType, referenceTable, referenceId |
| `StockInsufficient` | OUT rejected | branchId, batchId, requested, available (monitoring) |
| `StockDepleted` | availableQuantity reaches zero | branchId, batchId |
| `StockBelowReorderPoint` | policy threshold (future) | branchId, medicineId |

### StockAdjustment

| Event | Trigger | Key payload |
|-------|---------|-------------|
| `StockAdjustmentCreated` | DRAFT save | uuid, adjustmentNumber, branchId, adjustmentType |
| `StockAdjustmentSubmitted` | → PENDING_APPROVAL | uuid, itemCount |
| `StockAdjustmentApproved` | → APPROVED + movements | uuid, approvedByEmployeeId, totalValue |
| `StockAdjustmentCancelled` | → CANCELLED | uuid, reason |

### StockTransfer

| Event | Trigger | Key payload |
|-------|---------|-------------|
| `StockTransferCreated` | DRAFT save | uuid, transferNumber, sourceBranchId, destinationBranchId |
| `StockTransferSubmitted` | → PENDING_APPROVAL | uuid |
| `StockTransferApproved` | Approval recorded | uuid, approvedByEmployeeId |
| `StockTransferRejected` | → REJECTED | uuid |
| `StockTransferDispatched` | → DISPATCHED / IN_TRANSIT | uuid, items with sentQuantity |
| `StockTransferReceived` | Receive action | uuid, receivedQuantity per item |
| `StockTransferPartiallyReceived` | → PARTIALLY_RECEIVED | uuid, outstanding quantities |
| `StockTransferCompleted` | → COMPLETED | uuid, receivedDate |
| `StockTransferCancelled` | → CANCELLED | uuid |

### StockTake

| Event | Trigger | Key payload |
|-------|---------|-------------|
| `StockTakeCreated` | DRAFT | uuid, stockTakeNumber, branchId, countType |
| `StockTakeStarted` | → IN_PROGRESS | uuid, countedByEmployeeId |
| `StockTakeCounted` | → COUNTED | uuid, itemCount, totalVarianceValue |
| `StockTakeReconciled` | → RECONCILED + adjustments | uuid, linkedAdjustmentUuids |
| `StockTakeCancelled` | → CANCELLED | uuid |

### Reservation (planned)

| Event | When |
|-------|------|
| `StockReserved` | reservedQuantity increased |
| `StockReservationReleased` | reservedQuantity decreased without sale |
| `StockReservationConverted` | OUT movement + reservation cleared |
| `StockReservationFailed` | insufficient free stock |

### Expiry (planned / monitoring)

| Event | When |
|-------|------|
| `BatchExpiryApproaching` | Scheduled scan |
| `BatchExpiredOnShelf` | expiredQuantity increased |
| `SaleBlockedExpiredBatch` | validation failure (monitoring) |

Outbox `entityType` constants map to aggregate names; `operation` CREATE/UPDATE per `outbox-operation.constants.ts`.

## Permissions

Format: **`MODULE:RESOURCE:ACTION`**.

| Permission | Code | Use |
|------------|------|-----|
| View stock balances and movements | `INVENTORY:STOCK:READ` | List/detail Stock, StockMovement, Batch lookup |
| Create stock adjustments | `INVENTORY:STOCK_ADJUSTMENT:CREATE` | Draft and submit adjustment documents |

| Action | Permission (minimum) |
|--------|----------------------|
| View transfers / counts | `INVENTORY:STOCK:READ` |
| Create adjustment | `INVENTORY:STOCK_ADJUSTMENT:CREATE` |
| Dispatch / receive transfer | Transfer write + branch access (TBD) |
| Reconcile stock take | Stock take approve (TBD) |
| Reserve / release stock | Sales or inventory write (future) |

- All queries scoped by `RequestContext` (`companyId`, `branchId`); never trust client-supplied branch headers alone.
- Approve/dispatch/receive actions require elevated permissions (to be added per role matrix).
- Movements record `createdBy`; adjustment/transfer/stock-take headers record approver employee IDs.
- Immutable ledger supports forensic audit; approved documents must not be soft-deleted.
- Creator ≠ approver for adjustments above value threshold (policy).
- Batch create/update on receipt may be restricted to purchasing roles; backdating expiry correction requires elevated permission + audit.

## Workflows

### Batch

**Batch** is the org-global lot identity: manufacturer batch number, expiry, landed cost (`purchaseRate`), and statutory **MRP**. Batches exist once per organization; branch quantities live in **Stock**.

1. **Unique lot per medicine:** `(medicineId, batchNumber)` must be unique.
2. **expiryDate required.** manufacturingDate optional but recommended.
3. **purchaseRate** is the default **unitCost** for IN movements at receipt.
4. **mrp** is statutory; not used for inventory valuation.
5. **No saleRate on Batch.** Selling price is branch-scoped PriceList.
6. **UUID** is sync key; local `id` (BIGINT) is not replicated.
7. **Soft delete:** `deletedAt` set only when no active Stock with positive quantities (policy).

**Creation:** Typically on goods receipt / purchase invoice posting via Purchasing. **FEFO selection:** order eligible batches by ascending `expiryDate` where `Stock.availableQuantity > 0` and batch not expired.

### Stock

**Stock** holds quantity buckets for a **Batch at a Branch**. Uniqueness is `(branchId, batchId)`.

1. **availableQuantity** must not go negative on OUT unless branch policy allows (default: `STOCK_INSUFFICIENT`).
2. **All quantity changes** require a StockMovement except reserved-bucket-only updates.
3. **inTransitQuantity** increases when transfer dispatched from source; decreases when destination receives IN movement.
4. **damagedQuantity / expiredQuantity** updated via adjustment workflows, not sale OUT.
5. **First IN at branch** creates Stock row if missing (ledger create path).
6. **version** increment on every balance mutation; concurrent update throws `SEQUENCE_CONFLICT` and retries once at UoW level.

Effective free stock = `availableQuantity - reservedQuantity`.

### Stock adjustment

**StockAdjustment** documents manual corrections at a single branch: damage, expiry write-off, theft, opening balance, count variance, samples, or system correction.

1. Create DRAFT with items (signed quantity per batch).
2. Submit → PENDING_APPROVAL.
3. **Approve** → post movements per line; status APPROVED immutable.
4. **Cancel** before approval — no movements.

Typical **adjustmentType** values: `DAMAGE`, `EXPIRY`, `THEFT`, `OPENING_STOCK`, `COUNT_VARIANCE`, `SYSTEM_CORRECTION`, `SAMPLE`, `INTERNAL_USE`.

Positive item qty → `ADJUSTMENT_GAIN` (IN); negative → `ADJUSTMENT_LOSS` (OUT). **unitCost** defaults from `Batch.purchaseRate`. Stock take reconciliation links via `stockAdjustmentId` on StockTakeItem.

### Stock transfer

1. Create DRAFT with items (batchId, sentQuantity).
2. Submit → PENDING_APPROVAL (optional skip if policy allows direct dispatch from DRAFT).
3. Approve → record approvedByEmployeeId, approvedAt.
4. **Dispatch** → status DISPATCHED or IN_TRANSIT: TRANSFER_OUT at **source** branch; increment source `inTransitQuantity` (optional bucket).
5. **Receive** at destination: TRANSFER_IN for receivedQuantity; separate adjustment for damagedQuantity if not received as sellable; partial → PARTIALLY_RECEIVED until closed.
6. **COMPLETED** when all items fully received or closed; set receivedDate.
7. **REJECTED** from PENDING_APPROVAL — no movements.
8. **CANCELLED** from DRAFT or PENDING_APPROVAL — no movements.

transferType: `ROUTINE_REPLENISHMENT`, `EMERGENCY_TRANSFER`, `EXCESS_REBALANCING`. transferNumber unique per **sourceBranchId**.

### Stock take

1. DRAFT → IN_PROGRESS (count started; countedByEmployeeId set).
2. Enter StockTakeItem: systemQuantity from Stock snapshot, physicalQuantity counted, compute varianceQuantity and varianceType (MATCHED, SURPLUS, DEFICIT), varianceValue = variance × unitCost.
3. COUNTED when all lines entered.
4. **Reconcile** → RECONCILED: create StockAdjustment(s) for non-MATCHED lines; link stockAdjustmentId on items; approve adjustments to post movements.
5. CANCELLED from early states — no inventory change.

### Costing

Lot costing anchored on **`Batch.purchaseRate`**, with **movement-level snapshots** (`StockMovement.unitCost`) as the audit trail for COGS and valuation. There is **no saleRate on Batch**.

1. **Primary cost source:** `Batch.purchaseRate` set when batch is created from GRN/purchase invoice line landed cost.
2. **Movement snapshot:** `StockMovement.unitCost` copied from batch purchaseRate at IN time; OUT movements use same lot cost (specific identification per batch).
3. **No retroactive batch cost change** after movements exist without explicit correction adjustment and audit.
4. **Sales COGS** = sum of OUT movement `quantity × unitCost` for invoice lines.
5. **Transfer** does not re-cost: destination IN uses source OUT unitCost (same batchId).
6. **Adjustment loss/gain** uses item.unitCost × |quantity| for P&L impact.
7. **Returns:** sales return IN restores at original OUT unitCost if linked; otherwise purchaseRate.

### Valuation

Inventory **financial value** = quantity × unit cost, where unit cost derives from **`Batch.purchaseRate`** and **movement snapshots** — not from sale price or MRP.

1. **Default on-hand value (branch):** Σ over Stock rows of `(availableQuantity + damagedQuantity + expiredQuantity + inTransitQuantity?) × Batch.purchaseRate` — policy defines which buckets count as asset.
2. **Lot-specific identification:** each batch valued at its purchaseRate unless movement unitCost differs (use movement for historical COGS).
3. **Stock take surplus (SURPLUS):** positive varianceValue increases asset after adjustment approval.
4. **Stock take deficit (DEFICIT):** negative varianceValue reduces asset.
5. **Transfer in transit:** source OUT already reduced source value; inTransitQuantity at source may still carry cost until destination IN.
6. **Currency:** single currency per company in current schema.

Reports choose as-of timestamp: **snapshot** (current Stock × Batch.purchaseRate) or **historical** (replay movements).

### Reservation

`Stock.reservedQuantity` holds quantity committed to pending operations without reducing **availableQuantity** until a ledger OUT posts.

1. **Reservation does not post StockMovement** — only changes reservedQuantity.
2. **Reserve request:** increment reservedQuantity if `(available - reserved) >= requestQty`.
3. **Release:** decrement reservedQuantity without movement.
4. **Confirm sale:** ledger OUT for quantity; decrement both available (via movement) and reserved if previously reserved.
5. **Invariant (strict):** `reservedQuantity <= availableQuantity` at all times.
6. **Transfer dispatch:** optional pattern — reserve on PENDING_APPROVAL, release on CANCELLED, OUT on DISPATCHED.
7. **Expired batch:** cannot reserve for sale.
8. **FEFO interaction:** reservation should specify batchId; medicine-level reservation requires batch allocation before confirm.

`InventoryLedgerService` does not manage reservedQuantity today — separate ReservationService required.

### Expiry and FEFO

Expiry lives on **Batch.expiryDate**; branch quantities on **Stock**; write-offs via **StockAdjustment**.

1. **expiryDate required** on every Batch.
2. **FEFO default:** prefer earliest expiry among rows where `Stock.availableQuantity > 0` and batch not expired.
3. **Expired definition:** `expiryDate < current date` (branch timezone policy).
4. **No sale of expired batch:** sales ledger OUT rejects; POS must not allow selection.
5. **Near-expiry warning:** configurable threshold (e.g. 90 days) — UI warning, not hard block unless policy says so.
6. **Expired on shelf:** move to `expiredQuantity` via adjustment (adjustmentType EXPIRY); then ADJUSTMENT_LOSS.
7. **Transfer FEFO:** optional policy to prefer sending nearer-expiry batches on routine replenishment.
8. **Stock take NEAR_EXPIRY_AUDIT:** count limited to batches expiring within window.

### Ledger reference mapping

| Workflow | referenceTable | referenceId |
|----------|----------------|-------------|
| Transfer OUT/IN | StockTransferItem | item.id |
| Adjustment | StockAdjustmentItem | item.id |
| GRN (external) | GoodsReceiptItem | line id |
| Sale (external) | SalesInvoiceItem | line id |

## Integrations

| Boundary | Direction | Mechanism |
|----------|-----------|-----------|
| **Purchasing / GRN** | Inbound | GRN creates Batch (if new) + IN movement (`PURCHASE_GRN`); sets Batch.purchaseRate |
| **Sales** | Outbound | Invoice posts OUT (`SALES_INVOICE`); returns IN (`SALES_RETURN`); batch picker filters `expiryDate >= today`, sorts FEFO |
| **Purchase returns** | Outbound | OUT (`PURCHASE_RETURN`) |
| **Persistence** | Internal | `UnitOfWorkService`, `InventoryLedgerService`, `SequenceGeneratorService` |
| **Outbox / sync** | Outbound | Entity UUID + operation on Batch, documents, movements |
| **Audit** | Outbound | `AuditService` on approve/dispatch/reconcile actions |
| **Reporting** | Read | StockMovement ledger + Stock snapshot for valuation reports |
| **Finance GL (future)** | Outbound | Periodic journal from movement types and adjustment totals |

### Internal services

- **InventoryLedgerService** — sole writer to Stock + StockMovement for quantity changes; accepts `unitCost` on `ApplyMovementInput`.
- **SequenceGeneratorService** — allocates document numbers inside the same transaction.
- **OutboxService** — enqueues sync events from document roots after commit.
- Purchasing/Sales modules invoke ledger with `referenceTable` / `referenceId` pointing to their line items.

### Validation stack

- **class-validator** on DTOs at controller boundary.
- **PermissionsGuard** + `@RequirePermissions()` for API routes.
- **Prisma unique constraints** mapped to CONFLICT via prisma-error.mapper.
- **ContextEnrichInterceptor** supplies branchId for scope validation.

### Event consumers

| Consumer | Usage |
|----------|-------|
| **OutboxService** | Cloud sync entity payloads |
| **AuditService** | User-action audit trail |
| **Notifications (future)** | Low stock, transfer arrival |
| **Analytics** | Movement stream for dashboards |

Cross-context calls must not bypass aggregate services or patch Stock quantities directly.
