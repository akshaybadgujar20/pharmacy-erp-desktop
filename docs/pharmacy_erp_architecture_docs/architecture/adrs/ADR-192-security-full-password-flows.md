# ADR-192: Admin reset, self change-password, and unlock flows

**Status:** Active  
**Confidence:** Explicit  
**Modules:** auth, security

---

## Problem / Context

Password management spans self-service and admin.

## Question Discussed

Which password flows in v1?

## Options Considered

1. Admin reset + self change + unlock
2. Admin reset only
3. Defer password admin

## Decision Selected

Admin reset + unlock in security; self change-password in auth.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Admin reset only; Defer password admin

## Historical Source

- Doc 15 — subagent draft ADR-081

**Phase 2 draft cross-ref:** subagent draft ADR-081

