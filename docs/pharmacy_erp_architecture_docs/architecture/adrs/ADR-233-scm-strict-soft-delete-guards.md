# ADR-233: Strict soft-delete reference checks for config and masters

**Status:** Active  
**Confidence:** Explicit  
**Modules:** configuration, masters

---

## Problem / Context

Deleting referenced geo/org rows breaks FK integrity.

## Question Discussed

Soft-delete guards?

## Options Considered

1. Strict reference checks
2. Geo soft-delete freely
3. Always allow soft-delete

## Decision Selected

Strict — block soft-delete when referenced (PartyAddress, Branch, transactions, child geo rows, etc.).

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Strict for Company/Branch/FY; geo soft-delete freely; Always allow soft-delete

## Historical Source

- Doc 18 — subagent draft ADR-123

**Phase 2 draft cross-ref:** subagent draft ADR-123

