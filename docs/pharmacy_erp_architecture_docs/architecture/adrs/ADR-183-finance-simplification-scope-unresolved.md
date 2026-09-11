# ADR-183: Finance simplification refactor scope unresolved

**Status:** Deferred  
**Confidence:** Explicit  
**Modules:** finance

---

## Problem / Context

After finance bug-fix pass, optional DRY simplifications were proposed but user never locked scope.

## Question Discussed

How broad should the simplification pass be?

## Options Considered

1. Finance + ledger layer only — dedupe types/helpers, DRY receipt customer resolution
2. Finance + sales ledger integration — also unify cash/bank method resolution
3. Minimal — only fix clear duplicates; skip structural refactors

## Decision Selected

**Not pursued** — finance bug-fix pass completed; optional simplification refactor will not be done in v1.

## Rationale

User close-out decision (2026-09-11): bug-fix plan was sufficient; no simplification scope will be locked in or implemented.

## Rejected Alternatives

All three AskQuestion options — none selected; work deferred indefinitely.

## Historical Source

- Doc 13 — transcript 4ff29b60 Simplification scope AskQuestion

## Evolution / Notes

Originally filed as Needs Confirmation during Phase 2 recovery. Closed as Deferred during Phase 2 closeout.
