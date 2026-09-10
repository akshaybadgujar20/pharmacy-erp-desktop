# ADR-052: GRN without PO gated by ALLOW_GRN_WITHOUT_PO setting

**Status:** Active  
**Confidence:** Explicit  
**Modules:** Purchase, settings

---

## Problem / Context

Ad-hoc receipts may not have a PO.

## Question Discussed

Allow Goods Receipt without linked Purchase Order?

## Options Considered

1. Gated by setting
2. Always allowed
3. Never allowed

## Decision Selected

Allow when purchase.allow_grn_without_po setting is true.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

See options not selected above; reasons not explicitly recorded.

## Historical Source

- Doc 12 — transcript 8fc361a6 AskQuestion grn_without_po
