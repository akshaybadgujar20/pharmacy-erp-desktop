# ADR-215: Tax and DiscountRule full CRUD; block delete on FK refs

**Status:** Active  
**Confidence:** Explicit  
**Modules:** pricing

---

## Problem / Context

Rate changes vs referential integrity.

## Question Discussed

Tax/DiscountRule edit policy when used?

## Options Considered

1. Full CRUD block delete on FK
2. Strict block update when referenced
3. Soft-delete only

## Decision Selected

Full CRUD — block delete only when FK references exist.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Strict block update/delete when referenced; Soft-deactivate only

## Historical Source

- Doc 17 — subagent draft ADR-106

**Phase 2 draft cross-ref:** subagent draft ADR-106

