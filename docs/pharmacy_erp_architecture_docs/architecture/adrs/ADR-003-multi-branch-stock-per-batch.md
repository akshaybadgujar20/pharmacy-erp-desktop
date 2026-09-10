# ADR-003: Stock balance per branch per batch (not one stock per batch globally)

**Status:** Active  
**Confidence:** Explicit  
**Modules:** Inventory, purchase, sales, configuration (branches)

---

## Problem / Context

Original schema had `batchId @unique` on `Stock` and `Batch.stock Stock?` (one-to-one), making per-branch stock and inter-branch transfers impossible — a critical flaw for multi-branch pharmacy ERP.

## Question Discussed

How should stock balances relate to batches and branches?

## Options Considered

1. `@@unique([branchId, batchId])` on Stock; `Batch.stocks Stock[]`; remove global `batchId @unique`
2. Keep one stock row per batch (org-global quantity)
3. Duplicate batch records per branch

## Decision Selected

**Split Stock from Batch:** one `Stock` row per `(branchId, batchId)` pair; batch is org-global; stock is branch-scoped.

## Rationale

Documented as critical finding: multi-branch stock and transfers require branch-scoped balances on shared batch master.

## Trade-offs

- All stock mutations must include `branchId`
- `InventoryLedgerService` upserts on `(branchId, batchId)`
- Batch pricing vs branch pricing separation still required (see batch pricing layer in review)

## Architectural Impact

- GRN accept, sales post, transfers, adjustments all go through ledger with branch scope
- Read APIs for `/stocks` filter by JWT branch
- Inter-branch transfers move stock between branch balances for same batch

## Affected Modules / Components

- `inventory/stock`, `inventory/batch` Prisma models
- `InventoryLedgerService`
- Purchase GRN accept, sales FEFO allocation

## Constraints / Assumptions

- `Stock.branchId` must have FK to `Branch`
- Batch master remains org-global (medicine + batch number + expiry)

## Rejected Alternatives

- **One Stock per Batch globally** — rejected (breaks multi-branch)
- **Per-branch batch duplicates** — rejected (lot identity should be org-global)

## Historical Source

- [`plans/pharmacy_erp_db_review_cfc2c0b5.plan.md`](../../../../plans/pharmacy_erp_db_review_cfc2c0b5.plan.md) — stock-batch finding + corrective phase
