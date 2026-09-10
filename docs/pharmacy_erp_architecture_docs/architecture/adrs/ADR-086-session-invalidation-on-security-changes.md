# ADR-086: Invalidate sessions on role/permission/password changes

**Status:** Active  
**Confidence:** Explicit  
**Modules:** Security, auth

---

## Problem / Context

Stale JWT may retain old permissions after RBAC change.

## Question Discussed

When to force-logout sessions?

## Options Considered

1. On sensitive security changes
2. Manual only

## Decision Selected

Invalidate sessions on deactivate, password reset, role/permission replace.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

See options not selected above; reasons not explicitly recorded.

## Historical Source

- Doc 15 — transcript 8fc361a6 Security CreatePlan
