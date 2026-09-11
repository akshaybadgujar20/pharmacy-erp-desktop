# ADR-177: Strict financial year validation on posts

**Status:** Active  
**Confidence:** Explicit  
**Modules:** finance

---

## Problem / Context

Transactions must land in an open FY.

## Question Discussed

Enforce open FinancialYear on payment/receipt post?

## Options Considered

1. Yes strict reject
2. Validate with warning only
3. Defer validation

## Decision Selected

Strict — reject posts outside current open financial year date range.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Validate with warning only; Defer validation

## Historical Source

- Doc 13 — subagent draft ADR-060

**Phase 2 draft cross-ref:** subagent draft ADR-060

