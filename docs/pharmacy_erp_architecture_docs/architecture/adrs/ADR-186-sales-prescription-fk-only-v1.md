# ADR-186: Prescription FK validation only in sales v1

**Status:** Active  
**Confidence:** Explicit  
**Modules:** sales, prescription

---

## Problem / Context

Schedule H rules add complexity.

## Question Discussed

Prescription / Schedule H handling?

## Options Considered

1. FK validation only
2. Schedule H strict
3. Ignore prescriptionId

## Decision Selected

Optional `prescriptionId` FK validation (exists + branch match); no Schedule H rules in v1.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Schedule H strict enforcement; Ignore prescriptionId in v1

## Historical Source

- Doc 14 — subagent draft ADR-073

**Phase 2 draft cross-ref:** subagent draft ADR-073

