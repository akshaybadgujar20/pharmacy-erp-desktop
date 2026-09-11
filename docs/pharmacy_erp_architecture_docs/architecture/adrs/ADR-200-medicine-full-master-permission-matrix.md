# ADR-200: Full MASTER:RESOURCE:ACTION permission matrix

**Status:** Active  
**Confidence:** Explicit  
**Modules:** medicine, security

---

## Problem / Context

Eight medicine master resources need granular access.

## Question Discussed

Permission model for all 8 resources?

## Options Considered

1. Full matrix per resource
2. Coarse MASTER:MEDICINE:UPDATE
3. Granular Medicine+Salt only

## Decision Selected

Full `MASTER:RESOURCE:ACTION` matrix + `REPLACE` for `MEDICINE_SALT`.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Coarse MASTER:MEDICINE:UPDATE for all writes; Granular Medicine+Salt only

## Historical Source

- Doc 16 — subagent draft ADR-090

**Phase 2 draft cross-ref:** subagent draft ADR-090

