# ADR-176: Ledger COA full CRUD with hierarchy guards

**Status:** Active  
**Confidence:** Explicit  
**Modules:** finance

---

## Problem / Context

Chart of accounts must be admin-manageable.

## Question Discussed

Ledger (COA) API in v1?

## Options Considered

1. Full CRUD with parent hierarchy
2. Read + update only
3. Read-only seed-managed

## Decision Selected

Full CRUD with parent hierarchy; block delete on system ledgers and circular parent.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Read + update only; Read-only seed-managed

## Historical Source

- Doc 13 — subagent draft ADR-059

**Phase 2 draft cross-ref:** subagent draft ADR-059

