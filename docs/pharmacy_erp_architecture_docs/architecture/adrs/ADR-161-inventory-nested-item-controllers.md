# ADR-161: Inventory documents use nested item controllers

**Status:** Active  
**Confidence:** Strongly inferred  
**Modules:** inventory

---

## Problem / Context

Adjustment/transfer/stock-take are header+line documents edited incrementally.

## Question Discussed

Do inventory documents need separate item-level APIs?

## Options Considered

1. Nested item controllers under parent routes
2. Items only via header create/update body
3. Single combined controller

## Decision Selected

Use separate nested item controllers (e.g. `/stock-adjustments/:id/items`) matching party nested-resource pattern.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Items only via header create/update body; Single combined controller

## Historical Source

- Doc 11 — subagent draft ADR-043

**Phase 2 draft cross-ref:** subagent draft ADR-043

