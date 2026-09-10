# ADR-056: Finance full hooks: PI AP, supplier payment, customer receipt

**Status:** Active  
**Confidence:** Explicit  
**Modules:** Finance, purchase, sales

---

## Problem / Context

Invoices and payments must update ledgers and allocations.

## Question Discussed

How much cross-module integration in v1?

## Options Considered

1. Full hooks
2. Standalone finance
3. Supplier payment only

## Decision Selected

PI AP on post + supplier payment allocation + customer receipt stub.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

See options not selected above; reasons not explicitly recorded.

## Historical Source

- Doc 13 — transcript 8fc361a6 Finance AskQuestion integration
