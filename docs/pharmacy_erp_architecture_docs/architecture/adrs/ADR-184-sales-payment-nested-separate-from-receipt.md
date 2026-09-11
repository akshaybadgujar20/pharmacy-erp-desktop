# ADR-184: SalesPayment nested API; Finance Receipt stays separate

**Status:** Active  
**Confidence:** Explicit  
**Modules:** sales, finance

---

## Problem / Context

Two paths can record customer collections.

## Question Discussed

How should customer payments be recorded in v1?

## Options Considered

1. SalesPayment nested; Receipt separate
2. Finance Receipt only
3. Both auto-linked

## Decision Selected

`SalesPayment` nested under invoice; Finance `Receipt` with SALES_INVOICE allocation stays separate.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Finance Receipt only; Both auto-linked on complete

## Historical Source

- Doc 14 — subagent draft ADR-070

**Phase 2 draft cross-ref:** subagent draft ADR-070

