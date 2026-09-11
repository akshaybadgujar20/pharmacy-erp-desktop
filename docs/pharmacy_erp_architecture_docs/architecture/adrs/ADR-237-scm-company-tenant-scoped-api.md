# ADR-237: Company API tenant-scoped to JWT companyId

**Status:** Active  
**Confidence:** Explicit  
**Modules:** configuration

---

## Problem / Context

Company list was org-global inconsistent with Branch pattern.

## Question Discussed

Company API tenant scoping?

## Options Considered

1. Scope to JWT companyId
2. Keep org-global admin

## Decision Selected

Scope Company list/get/update/delete to JWT `companyId` (match Branch/FY pattern).

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Keep Company org-global single-tenant admin

## Historical Source

- Doc 18 — subagent draft ADR-128

**Phase 2 draft cross-ref:** subagent draft ADR-128

