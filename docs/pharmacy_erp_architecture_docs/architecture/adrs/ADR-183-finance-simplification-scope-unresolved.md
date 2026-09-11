# ADR-183: Finance simplification refactor scope unresolved

**Status:** Needs Confirmation  
**Confidence:** Needs Confirmation  
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

No locked-in user answer recorded.

## Rationale

Bug-fix plan completed; simplification was optional. AskQuestion in transcript 4ff29b60 has no persisted selection.

## Rejected Alternatives



## Historical Source

- Doc 13 — transcript 4ff29b60 Simplification scope AskQuestion

