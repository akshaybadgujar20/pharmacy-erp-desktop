# ADR-164: Batch org-global; Stock and documents branch-scoped

**Status:** Active  
**Confidence:** Strongly inferred  
**Modules:** inventory

---

## Problem / Context

Same lot can exist at multiple branches with independent quantities.

## Question Discussed

How should Batch vs Stock API scoping work?

## Options Considered

1. Batch org-global; Stock branch-scoped
2. Everything branch-scoped
3. Everything org-global

## Decision Selected

Batch list/get has no branch filter; Stock, adjustments, transfers, stock-takes filter by `RequestContext` branch.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Everything branch-scoped; Everything org-global

## Historical Source

- Doc 11 — subagent draft ADR-046

**Phase 2 draft cross-ref:** subagent draft ADR-046

