# ADR-258: Stock-take variance fields server-computed on item write

**Status:** Active  
**Confidence:** Strongly inferred  
**Modules:** inventory

---

## Problem / Context

Stock-take items track physical vs system quantities; variance drives reconcile adjustments.

## Question Discussed

Should clients supply variance fields on stock-take item create/update?

## Options Considered

1. Client supplies variance fields
2. Server computes variance from physicalQuantity and batch cost
3. Variance only at reconcile time

## Decision Selected

Do not expose `systemQuantity`, `varianceQuantity`, `varianceValue`, or `varianceType` in create DTOs; server computes on item create/update (`varianceQuantity = physicalQuantity - systemQuantity`, value from batch `purchaseRate`, type via `computeVarianceType`).

## Rationale

Keeps variance consistent with ledger snapshot and prevents client tampering with derived fields.

## Rejected Alternatives

Client-supplied variance; compute only at reconcile

## Historical Source

- Module memory doc — inventory-module.md §8 stock-take item variance
