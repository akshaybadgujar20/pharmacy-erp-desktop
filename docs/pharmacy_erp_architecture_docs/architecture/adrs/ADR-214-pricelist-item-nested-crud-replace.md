# ADR-214: PriceListItem nested CRUD + PUT replace

**Status:** Active  
**Confidence:** Explicit  
**Modules:** pricing

---

## Problem / Context

Price lines are a collection under a list.

## Question Discussed

PriceListItem API shape?

## Options Considered

1. Nested CRUD + replace
2. Nested CRUD only
3. Flat /price-list-items

## Decision Selected

Nested `/price-lists/:priceListId/items` + `PUT .../replace`.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Nested CRUD only; Flat top-level items endpoint

## Historical Source

- Doc 17 — subagent draft ADR-105

**Phase 2 draft cross-ref:** subagent draft ADR-105

