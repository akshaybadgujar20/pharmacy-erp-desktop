# ADR-212: PriceList branch-scoped list includes org-wide lists

**Status:** Active  
**Confidence:** Explicit  
**Modules:** pricing

---

## Problem / Context

Some price lists apply org-wide (null branchId).

## Question Discussed

PriceList branch scope for list API?

## Options Considered

1. Branch-scoped + org-wide null branchId
2. Strict branch only
3. Org-wide only

## Decision Selected

Default JWT branchId + include org-wide lists (`branchId` null); optional `branchId` query override for admin.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Strict branch only; Org-wide only

## Historical Source

- Doc 17 — subagent draft ADR-103

**Phase 2 draft cross-ref:** subagent draft ADR-103

