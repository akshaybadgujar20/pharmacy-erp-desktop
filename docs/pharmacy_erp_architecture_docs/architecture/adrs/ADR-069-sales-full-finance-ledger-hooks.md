# ADR-069: Sales full finance ledger hooks on post/payment/return/cancel

**Status:** Active  
**Confidence:** Explicit  
**Modules:** Sales, finance

---

## Problem / Context

Sales must post AR, revenue, GST, and payment vouchers.

## Question Discussed

Finance integration on sales workflows?

## Options Considered

1. Full hooks
2. Invoice post only
3. No ledger

## Decision Selected

Full hooks: invoice AR, payment ledger, return reversal, cancel reversal.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

See options not selected above; reasons not explicitly recorded.

## Historical Source

- Doc 14 — transcript 8fc361a6 AskQuestion finance-integration
