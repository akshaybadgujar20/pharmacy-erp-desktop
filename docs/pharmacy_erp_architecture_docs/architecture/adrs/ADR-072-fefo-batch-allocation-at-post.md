# ADR-072: FEFO batch allocation at sales invoice post

**Status:** Active  
**Confidence:** Explicit  
**Modules:** Sales, inventory

---

## Problem / Context

Expired/near-expiry stock must be sold first.

## Question Discussed

Batch selection for invoice lines?

## Options Considered

1. FEFO at post
2. User picks batch
3. FEFO with override

## Decision Selected

FEFO at post; draft may suggest batch; post re-allocates.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

See options not selected above; reasons not explicitly recorded.

## Historical Source

- Doc 14 — transcript 8fc361a6 AskQuestion batch-allocation
