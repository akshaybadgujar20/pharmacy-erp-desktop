# ADR-162: Inventory headers created without embedded items[]

**Status:** Active  
**Confidence:** Strongly inferred  
**Modules:** inventory

---

## Problem / Context

Lines are added while document is still editable.

## Question Discussed

Should create DTOs include line items?

## Options Considered

1. Header create without items; add lines via item API
2. Embedded items[] on create
3. Bulk import only

## Decision Selected

Create DTOs for adjustment/transfer/stock-take have no `items[]`; items managed incrementally while parent is DRAFT (stock-take also IN_PROGRESS).

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Embedded items[] on create; Bulk import only

## Historical Source

- Doc 11 — subagent draft ADR-044

**Phase 2 draft cross-ref:** subagent draft ADR-044

