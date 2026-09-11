# ADR-207: MedicineCategory flat CRUD with circular-parent guard

**Status:** Active  
**Confidence:** Explicit  
**Modules:** medicine

---

## Problem / Context

Category hierarchy without dedicated tree API.

## Question Discussed

MedicineCategory hierarchy API?

## Options Considered

1. Flat CRUD + parentCategoryId
2. Flat CRUD + tree endpoint
3. Tree read-only

## Decision Selected

Flat CRUD with `parentCategoryId` + circular-parent validation; no tree endpoint.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Flat CRUD + GET /tree; Tree read-only client-built only without validation

## Historical Source

- Doc 16 — subagent draft ADR-097

**Phase 2 draft cross-ref:** subagent draft ADR-097

