# ADR-230: Company and Branch full CRUD with default/head-office guards

**Status:** Active  
**Confidence:** Explicit  
**Modules:** configuration

---

## Problem / Context

Org structure must enforce single default company and head office.

## Question Discussed

Company / Branch admin?

## Options Considered

1. Full CRUD with default guards
2. Branch CRUD; Company read-only
3. Read-only org seed

## Decision Selected

Full CRUD for Company and Branch with `isDefault` / `isHeadOffice` single-flag enforcement.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Branch CRUD; Company read-only singleton; Read-only org via seed only

## Historical Source

- Doc 18 — subagent draft ADR-120

**Phase 2 draft cross-ref:** subagent draft ADR-120

