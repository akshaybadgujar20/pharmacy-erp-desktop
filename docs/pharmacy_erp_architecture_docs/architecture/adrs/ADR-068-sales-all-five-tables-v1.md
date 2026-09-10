# ADR-068: Sales v1 all five tables (invoice, payment, return)

**Status:** Active  
**Confidence:** Explicit  
**Modules:** Sales

---

## Problem / Context

Retail pharmacy needs invoice, collections, returns.

## Question Discussed

Which sales documents in v1?

## Options Considered

1. All 5 tables
2. Invoice+payment
3. Invoice only

## Decision Selected

SalesInvoice, items, SalesPayment, SalesReturn, return items.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

See options not selected above; reasons not explicitly recorded.

## Historical Source

- Doc 14 — transcript 8fc361a6 Sales AskQuestion scope
