# ADR-169: StockMovement HTTP API is read-only

**Status:** Active  
**Confidence:** Strongly inferred  
**Modules:** inventory, persistence

---

## Problem / Context

Movements must be immutable audit trail of stock changes.

## Question Discussed

Should StockMovement expose mutation endpoints?

## Options Considered

1. Read-only HTTP; ledger creates movements
2. Admin CRUD on movements

## Decision Selected

StockMovement is immutable — read-only HTTP; created only by InventoryLedgerService.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Admin CRUD on movements

## Historical Source

- Doc 11 — inventory-module.md golden rules

