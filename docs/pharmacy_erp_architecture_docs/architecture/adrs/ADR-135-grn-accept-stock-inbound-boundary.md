# ADR-135: GRN accept is stock inbound boundary; PO and invoice never touch stock

**Status:** Active  
**Confidence:** Explicit  
**Modules:** Purchase, inventory, finance

---

## Problem / Context

Procure-to-pay must separate physical receipt from AP invoice.

## Question Discussed

Which document posts stock IN?

## Options Considered

1. GRN accept only
2. Purchase invoice post
3. Both

## Decision Selected

GRN accept = stock IN; purchase invoice post = AP ledger only; PO never touches stock.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

See options not selected above; reasons not explicitly recorded.

## Historical Source

- Doc 12 — purchase plan + developer guide Purchase capsule
