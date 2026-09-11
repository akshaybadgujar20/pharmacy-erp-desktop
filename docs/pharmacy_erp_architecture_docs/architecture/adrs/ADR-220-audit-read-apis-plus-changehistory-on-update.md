# ADR-220: Audit read APIs plus ChangeHistory on UPDATE

**Status:** Active  
**Confidence:** Explicit  
**Modules:** audit, pricing, prescription

---

## Problem / Context

ChangeHistory never written today.

## Question Discussed

Audit module scope?

## Options Considered

1. Read-only APIs
2. Read APIs + ChangeHistory on UPDATE
3. Skip audit module

## Decision Selected

Read APIs for AuditLog/ChangeHistory + extend AuditService to write ChangeHistory on UPDATE (pricing/prescription v1).

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Read-only APIs no ChangeHistory writes; Skip audit module defer

## Historical Source

- Doc 17 — subagent draft ADR-111

**Phase 2 draft cross-ref:** subagent draft ADR-111

