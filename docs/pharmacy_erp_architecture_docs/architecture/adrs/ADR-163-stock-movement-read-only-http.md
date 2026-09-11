# ADR-163: StockMovement HTTP API is read-only

**Status:** Active  
**Confidence:** Strongly inferred  
**Modules:** inventory, persistence

---

## Problem / Context

Movement ledger must be immutable.

## Question Discussed

Should StockMovement have create/update/delete endpoints?

## Options Considered

1. Read-only HTTP; writes only via InventoryLedgerService
2. Full CRUD on movements
3. Append via dedicated POST

## Decision Selected

StockMovement is immutable — read-only list/get HTTP; movements created only by `InventoryLedgerService.applyMovement`.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Full CRUD on movements; Append via dedicated POST

## Historical Source

- Doc 11 — subagent draft ADR-045

**Phase 2 draft cross-ref:** subagent draft ADR-045

