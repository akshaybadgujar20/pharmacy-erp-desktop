# ADR-232: Geographic masters as flat CRUD per entity

**Status:** Active  
**Confidence:** Explicit  
**Modules:** masters

---

## Problem / Context

Country→State→City→Area hierarchy needs admin APIs.

## Question Discussed

Geographic masters API shape?

## Options Considered

1. Flat CRUD per entity with parent FK
2. Nested routes only
3. Read-only lookup

## Decision Selected

Flat CRUD per entity (`/countries`, `/states`, `/cities`, `/areas`) with parent FK + circular guards.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Nested routes only; Read-only seeded lookup

## Historical Source

- Doc 18 — subagent draft ADR-122

**Phase 2 draft cross-ref:** subagent draft ADR-122

