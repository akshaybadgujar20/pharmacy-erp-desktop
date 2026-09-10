# ADR-049: GRN full inspection workflow before stock accept

**Status:** Active  
**Confidence:** Explicit  
**Modules:** Purchase, inventory

---

## Problem / Context

Quality inspection may reject goods before stock IN.

## Question Discussed

Goods Receipt posting workflow complexity in v1?

## Options Considered

1. Full inspection
2. DRAFT→POST
3. Minimal ACCEPT only

## Decision Selected

DRAFT → UNDER_INSPECTION → ACCEPTED/PARTIALLY_ACCEPTED/REJECTED; stock on accept.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

See options not selected above; reasons not explicitly recorded.

## Historical Source

- Doc 12 — transcript 8fc361a6 AskQuestion grn_workflow
