# ADR-249: Finance Receipt allocation to sales invoice deferred

**Status:** Active  
**Confidence:** Strongly inferred  
**Modules:** finance, sales

---

## Problem / Context

Full receipt-to-invoice allocation may need dedicated workflow.

## Question Discussed

Is Finance Receipt SALES_INVOICE allocation in v1?

## Options Considered

1. Full allocation in v1
2. Stub validation only
3. Deferred

## Decision Selected

Receipt validates balance via sales settlement helpers; full allocation workflow listed as not implemented.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Full allocation in v1

## Historical Source

- Doc 20 — finance-module.md not implemented section

