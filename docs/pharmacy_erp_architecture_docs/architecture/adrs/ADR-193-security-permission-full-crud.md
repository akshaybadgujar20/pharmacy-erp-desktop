# ADR-193: Permission full CRUD including system permissions

**Status:** Active  
**Confidence:** Explicit  
**Modules:** security

---

## Problem / Context

Permission catalog must be admin-manageable.

## Question Discussed

Permission CRUD scope?

## Options Considered

1. Full CRUD incl. isSystemPermission
2. Read-only Permission list
3. Create custom only

## Decision Selected

Full CRUD on Permission rows including `isSystemPermission`.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Read-only Permission list; Create custom permissions only

## Historical Source

- Doc 15 — subagent draft ADR-082

**Phase 2 draft cross-ref:** subagent draft ADR-082

