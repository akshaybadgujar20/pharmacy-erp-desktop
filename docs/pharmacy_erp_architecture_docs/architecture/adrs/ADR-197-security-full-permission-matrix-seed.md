# ADR-197: Full SECURITY:RESOURCE:ACTION permission matrix

**Status:** Active  
**Confidence:** Explicit  
**Modules:** security

---

## Problem / Context

Admin APIs need granular guards.

## Question Discussed

Permission seed model?

## Options Considered

1. Full SECURITY matrix
2. Coarse SECURITY:MANAGE
3. Reuse auth permissions only

## Decision Selected

Full `SECURITY:RESOURCE:ACTION` matrix + admin role seed assignment.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Coarse SECURITY:MANAGE; Reuse auth permissions only

## Historical Source

- Doc 15 — subagent draft ADR-087

**Phase 2 draft cross-ref:** subagent draft ADR-087

