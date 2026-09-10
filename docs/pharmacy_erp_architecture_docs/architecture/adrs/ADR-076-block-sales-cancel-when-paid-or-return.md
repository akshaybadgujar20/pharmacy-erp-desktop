# ADR-076: Block sales cancel when paid or completed return exists

**Status:** Active  
**Confidence:** Explicit  
**Modules:** Sales, finance

---

## Problem / Context

Cancel with payments/returns left inconsistent ledger rows.

## Question Discussed

Sales invoice cancel simplification?

## Options Considered

1. Block when paid or COMPLETED return
2. Block payments only
3. Keep current cancel

## Decision Selected

Block when paidAmount > 0 or any COMPLETED return (match purchase).

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

See options not selected above; reasons not explicitly recorded.

## Historical Source

- Doc 14 — transcript d76cce43 AskQuestion cancel_strategy

## Evolution

```text
Supersedes permissive cancel in initial sales plan (ADR-075 implicit)
```
