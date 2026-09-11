# ADR-245: Ledger balance derived from entries, never stored

**Status:** Active  
**Confidence:** Strongly inferred  
**Modules:** finance

---

## Problem / Context

COA balances must stay consistent with immutable ledger entries.

## Question Discussed

Should Ledger rows store a running balance column?

## Options Considered

1. Derive from LedgerEntry sums
2. Store balance on Ledger

## Decision Selected

Ledger balance is never stored — derived from LedgerEntry sums at read time.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Store balance on Ledger

## Historical Source

- Doc 20 — finance-module.md golden rules

