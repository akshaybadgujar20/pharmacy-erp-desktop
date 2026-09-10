# ADR-065: Ledger reversal scoped by voucherNumber with -REV suffix

**Status:** Active  
**Confidence:** Explicit  
**Modules:** Finance, persistence

---

## Problem / Context

Double reversal bugs when scoping by voucherType only.

## Question Discussed

Reversal design without Prisma migration?

## Options Considered

1. Scope by voucherNumber + -REV
2. Reversal flag column

## Decision Selected

Scope originals by exact voucherNumber; reversals use -REV voucher number.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

See options not selected above; reasons not explicitly recorded.

## Historical Source

- Doc 13 — transcript 4ff29b60 Finance Bug Fixes
