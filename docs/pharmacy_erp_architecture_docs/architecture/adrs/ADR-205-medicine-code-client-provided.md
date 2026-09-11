# ADR-205: Client provides unique medicineCode

**Status:** Active  
**Confidence:** Explicit  
**Modules:** medicine

---

## Problem / Context

Medicine identity code assignment.

## Question Discussed

Medicine code on create?

## Options Considered

1. Client provides
2. Server auto-sequence
3. Optional auto when omitted

## Decision Selected

Client provides `medicineCode` (validated unique).

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Server auto-sequence; Optional auto when omitted

## Historical Source

- Doc 16 — subagent draft ADR-095

**Phase 2 draft cross-ref:** subagent draft ADR-095

