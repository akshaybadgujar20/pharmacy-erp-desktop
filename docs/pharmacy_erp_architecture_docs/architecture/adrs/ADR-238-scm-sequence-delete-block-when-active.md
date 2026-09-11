# ADR-238: Block SequenceGenerator DELETE when isActive=true

**Status:** Active  
**Confidence:** Explicit  
**Modules:** configuration, sequence

---

## Problem / Context

Hard delete of active sequences is dangerous.

## Question Discussed

SequenceGenerator hard delete risk?

## Options Considered

1. Block when isActive=true
2. Keep hard delete as-is
3. Remove DELETE endpoint

## Decision Selected

Block hard-delete when `isActive=true` — admin must deactivate first.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Keep hard delete document danger only; Remove DELETE — isActive=false only

## Historical Source

- Doc 18 — subagent draft ADR-129

**Phase 2 draft cross-ref:** subagent draft ADR-129

