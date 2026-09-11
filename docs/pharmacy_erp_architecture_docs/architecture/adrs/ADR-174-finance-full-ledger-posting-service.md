# ADR-174: Full LedgerPostingService with balance validation and reversal

**Status:** Active  
**Confidence:** Explicit  
**Modules:** finance, persistence

---

## Problem / Context

Payment/Receipt COMPLETE needs shared double-entry logic.

## Question Discussed

LedgerPostingService — required for v1?

## Options Considered

1. Full shared service
2. Minimal post/reverse
3. Inline ledger writes in services only

## Decision Selected

Full shared `LedgerPostingService` (balance validation, reversal helper, optional running balance).

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Minimal post/reverse only; Inline ledger writes in services only

## Historical Source

- Doc 13 — subagent draft ADR-057

**Phase 2 draft cross-ref:** subagent draft ADR-057

