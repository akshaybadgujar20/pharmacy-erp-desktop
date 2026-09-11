# ADR-165: Stock and StockMovement read-only at API layer

**Status:** Active  
**Confidence:** Explicit  
**Modules:** inventory

---

## Problem / Context

Stock balances are ledger-managed; direct quantity writes are forbidden.

## Question Discussed

For Stock DTOs, which approach?

## Options Considered

1. No create/update DTOs — mapper + list-query only
2. Keep create/update DTOs for future/admin use

## Decision Selected

No create/update DTOs — mapper + optional list-query DTO only.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Keep create/update DTOs for future/admin use

## Historical Source

- Doc 11 — transcript 052a3bc9 Inventory DTO scope AskQuestion

