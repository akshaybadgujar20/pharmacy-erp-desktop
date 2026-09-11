# ADR-188: Posted sales invoice cancel with stock and ledger reversal (initial v1)

**Status:** Superseded  
**Confidence:** Explicit  
**Modules:** sales

---

## Problem / Context

Exception workflow for posted invoices.

## Question Discussed

Cancel posted sales invoice?

## Options Considered

1. Implement cancel with reversals
2. Returns only — no posted cancel
3. Cancel stock only no ledger

## Decision Selected

Implement `cancel` on posted invoice with stock reversal + ledger reversal.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Returns only — no posted cancel; Cancel stock only no ledger

## Historical Source

- Doc 14 — subagent draft ADR-075

**Phase 2 draft cross-ref:** subagent draft ADR-075

