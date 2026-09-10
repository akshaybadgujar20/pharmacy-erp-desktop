# ADR-136: Sales invoice post is stock outbound boundary

**Status:** Active  
**Confidence:** Explicit  
**Modules:** Sales, inventory

---

## Problem / Context

Draft invoices must not decrement stock.

## Question Discussed

When does stock OUT occur for sales?

## Options Considered

1. At post only
2. At draft create
3. At payment

## Decision Selected

Stock OUT and FEFO at POST; draft lines do not affect stock.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

See options not selected above; reasons not explicitly recorded.

## Historical Source

- Doc 14 — sales plan + developer guide
