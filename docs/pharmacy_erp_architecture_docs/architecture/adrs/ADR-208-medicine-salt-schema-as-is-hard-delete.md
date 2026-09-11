# ADR-208: MedicineSalt schema unchanged; hard-delete junction rows

**Status:** Active  
**Confidence:** Explicit  
**Modules:** medicine

---

## Problem / Context

Prisma gap: no deletedAt on MedicineSalt.

## Question Discussed

Handle MedicineSalt schema gap how?

## Options Considered

1. As-is hard-delete; auto-set medicineGenericId
2. Add soft-delete migration
3. Drop medicineGenericId

## Decision Selected

No schema change — hard-delete junction rows; auto-set `medicineGenericId` from `SaltComposition.genericId` on create.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Add Prisma soft-delete migration; Drop medicineGenericId field

## Historical Source

- Doc 16 — subagent draft ADR-098

**Phase 2 draft cross-ref:** subagent draft ADR-098

