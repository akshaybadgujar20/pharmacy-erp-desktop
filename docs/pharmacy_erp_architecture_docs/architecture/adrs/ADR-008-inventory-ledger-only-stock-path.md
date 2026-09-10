# ADR-008: InventoryLedgerService is the only stock mutation path

**Status:** Active  
**Confidence:** Explicit  
**Modules:** Inventory, purchase, sales, persistence

---

## Problem / Context

Stock balances and movement history must stay consistent; direct `Stock` updates would bypass movement audit trail and negative-stock guards.

## Question Discussed

How should stock quantities change in the application layer?

## Options Considered

1. Central `InventoryLedgerService.applyMovement(tx, …)` — upsert Stock + insert StockMovement
2. Direct `stock.update` in each workflow service
3. Database triggers only

## Decision Selected

**InventoryLedgerService** allocates movement number, guards negative stock on OUT, upserts `Stock`, inserts immutable `StockMovement`.

## Rationale

Single place for FEFO consumers, movement types, and `STOCK_INSUFFICIENT` errors; integration tests validate IN/OUT/rollback.

## Trade-offs

- Workflow services never touch `Stock` table directly
- Movement number via `SequenceGeneratorService` (`STOCK_MOVEMENT` type)
- GRN accept, sales post, returns, adjustments, transfers, stock-take all call ledger

## Architectural Impact

- Enforces ADR-003 (branch + batch scope on stock row)
- Purchase invoice post does **not** touch stock (GRN accept boundary)
- Sales invoice post calls ledger OUT per FEFO line

## Affected Modules / Components

- `persistence/inventory/inventory-ledger.service.ts`
- `goods-receipt.service.ts`, `sales-invoice.service.ts`, `stock-adjustment.service.ts`, etc.

## Rejected Alternatives

- **Direct stock updates** — rejected (consistency and audit)

## Historical Source

- [`plans/persistence_foundation_patterns_3af5df7a.plan.md`](../../../../plans/persistence_foundation_patterns_3af5df7a.plan.md) — Inventory workflow contract
