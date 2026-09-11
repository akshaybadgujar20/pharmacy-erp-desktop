# ADR-216: Prescription lifecycle via workflow POST routes

**Status:** Active  
**Confidence:** Explicit  
**Modules:** prescription

---

## Problem / Context

Prescription status transitions are workflow actions.

## Question Discussed

Prescription lifecycle API shape?

## Options Considered

1. Workflow POST routes
2. PATCH status only
3. CRUD minimal no guards

## Decision Selected

`POST activate`, `POST cancel`, `POST expire`; item CRUD only in `DRAFT`.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Status transitions via PATCH only; CRUD without transition guards

## Historical Source

- Doc 17 — subagent draft ADR-107

**Phase 2 draft cross-ref:** subagent draft ADR-107

