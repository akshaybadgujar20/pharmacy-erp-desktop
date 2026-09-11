# ADR-221: Audit lists default-filter by JWT branchId

**Status:** Active  
**Confidence:** Explicit  
**Modules:** audit

---

## Problem / Context

Audit data is branch-sensitive.

## Question Discussed

AuditLog / ChangeHistory list filtering?

## Options Considered

1. Default JWT branchId + optional filters
2. Org-wide read no default branch
3. Entity-scoped trail primary

## Decision Selected

Default filter by JWT `branchId`; optional entityType/entityUuid/userId/date range/correlationId.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Org-wide read for authorized users; Entity-scoped trail as primary API only

## Historical Source

- Doc 17 — subagent draft ADR-112

**Phase 2 draft cross-ref:** subagent draft ADR-112

