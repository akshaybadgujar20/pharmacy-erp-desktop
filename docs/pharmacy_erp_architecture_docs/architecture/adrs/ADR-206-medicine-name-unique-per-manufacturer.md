# ADR-206: medicineName unique within manufacturerId

**Status:** Active  
**Confidence:** Explicit  
**Modules:** medicine

---

## Problem / Context

Name collisions within a manufacturer's catalog.

## Question Discussed

Medicine name uniqueness rule?

## Options Considered

1. Unique per manufacturerId
2. Globally unique name
3. Code unique only

## Decision Selected

`medicineName` unique within `manufacturerId`.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Globally unique medicineName; medicineCode unique only

## Historical Source

- Doc 16 — subagent draft ADR-096

**Phase 2 draft cross-ref:** subagent draft ADR-096

