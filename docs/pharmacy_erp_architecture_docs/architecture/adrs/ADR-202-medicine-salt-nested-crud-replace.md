# ADR-202: MedicineSalt nested CRUD + PUT replace

**Status:** Active  
**Confidence:** Explicit  
**Modules:** medicine

---

## Problem / Context

Medicine composition is a junction collection.

## Question Discussed

MedicineSalt API under /medicines/:id/salts?

## Options Considered

1. Nested CRUD + replace
2. Nested CRUD only
3. Inline on Medicine body only

## Decision Selected

Nested under `/medicines/:medicineId/salts` — CRUD + `PUT .../replace`.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Nested CRUD only; Inline on Medicine create/update only

## Historical Source

- Doc 16 — subagent draft ADR-092

**Phase 2 draft cross-ref:** subagent draft ADR-092

