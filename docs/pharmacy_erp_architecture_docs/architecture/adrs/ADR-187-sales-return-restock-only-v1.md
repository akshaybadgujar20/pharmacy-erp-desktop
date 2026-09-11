# ADR-187: Sales returns RESTOCK disposition only in v1

**Status:** Active  
**Confidence:** Explicit  
**Modules:** sales, inventory

---

## Problem / Context

Return dispositions include damaged/quarantine paths.

## Question Discussed

Sales return stock disposition on approve?

## Options Considered

1. RESTOCK only
2. Full disposition routing
3. RESTOCK IN; others record-only

## Decision Selected

RESTOCK only — approved returns create IN StockMovement; ignore DAMAGED/DISCARD routing.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Full disposition routing; RESTOCK IN; others record-only

## Historical Source

- Doc 14 — subagent draft ADR-074

**Phase 2 draft cross-ref:** subagent draft ADR-074

