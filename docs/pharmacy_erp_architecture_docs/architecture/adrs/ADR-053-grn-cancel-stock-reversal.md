# ADR-053: Posted GRN cancel reverses stock via OUT movements

**Status:** Active  
**Confidence:** Explicit  
**Modules:** Purchase, inventory

---

## Problem / Context

Cancelled receipts must undo inventory.

## Question Discussed

GRN cancellation in v1?

## Options Considered

1. Cancel with reversal
2. DRAFT only
3. No cancel

## Decision Selected

CANCEL on posted GRN with reversing OUT via InventoryLedgerService.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

See options not selected above; reasons not explicitly recorded.

## Historical Source

- Doc 12 — transcript 8fc361a6 AskQuestion grn_cancel
