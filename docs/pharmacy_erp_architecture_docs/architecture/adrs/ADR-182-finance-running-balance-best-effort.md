# ADR-182: Ledger running balance left best-effort in bug-fix pass

**Status:** Active  
**Confidence:** Explicit  
**Modules:** finance

---

## Problem / Context

Running balance correctness vs delivery scope.

## Question Discussed

Fix running balance locking in bug-fix pass?

## Options Considered

1. Leave best-effort document only
2. Add locking work

## Decision Selected

Leave running balance as best-effort (document only); no locking work in bug-fix pass.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Add locking work in bug-fix pass

## Historical Source

- Doc 13 — subagent draft ADR-067

**Phase 2 draft cross-ref:** subagent draft ADR-067

