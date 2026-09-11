# ADR-217: Client provides unique prescriptionNumber

**Status:** Active  
**Confidence:** Explicit  
**Modules:** prescription

---

## Problem / Context

Prescription document identity.

## Question Discussed

Prescription number on create?

## Options Considered

1. Client provided
2. Server auto-sequence
3. Optional auto when omitted

## Decision Selected

Client provides `prescriptionNumber` (unique).

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Server auto-sequence; Optional auto when omitted

## Historical Source

- Doc 17 — subagent draft ADR-108

**Phase 2 draft cross-ref:** subagent draft ADR-108

