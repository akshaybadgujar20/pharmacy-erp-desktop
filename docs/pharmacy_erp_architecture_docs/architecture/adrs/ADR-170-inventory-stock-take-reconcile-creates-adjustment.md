# ADR-170: Stock-take reconcile creates adjustment and ledger postings

**Status:** Active  
**Confidence:** Strongly inferred  
**Modules:** inventory

---

## Problem / Context

Variances after stock-take must post to stock atomically.

## Question Discussed

How should reconcile apply variances?

## Options Considered

1. Manual adjustment only
2. Auto-create approved adjustment on reconcile

## Decision Selected

Reconcile creates StockAdjustment + InventoryLedger movements for non-zero variances.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Manual adjustment only

## Historical Source

- Doc 11 — inventory-module.md workflow section

