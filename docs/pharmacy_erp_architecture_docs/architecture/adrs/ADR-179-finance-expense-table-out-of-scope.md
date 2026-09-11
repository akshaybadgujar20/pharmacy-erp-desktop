# ADR-179: Expense Prisma model out of scope; use Payment EXPENSE type

**Status:** Active  
**Confidence:** Explicit  
**Modules:** finance

---

## Problem / Context

Expense model exists but not in financial.md table list.

## Question Discussed

Include Expense table in v1?

## Options Considered

1. All 4 only
2. All 4 + Expense

## Decision Selected

Expense table out of scope; use `paymentType=EXPENSE` via Payment.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

All 4 + Expense table

## Historical Source

- Doc 13 — subagent draft ADR-062

**Phase 2 draft cross-ref:** subagent draft ADR-062

