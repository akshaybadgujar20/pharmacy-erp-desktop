# ADR-175: LedgerEntry HTTP API read-only

**Status:** Active  
**Confidence:** Explicit  
**Modules:** finance

---

## Problem / Context

Journal is immutable; entries created by posting flows.

## Question Discussed

LedgerEntry HTTP API in v1?

## Options Considered

1. Read-only list/get/filter
2. Read-only + manual journal create
3. No HTTP endpoints

## Decision Selected

Read-only list/get/filter by ledgerId, voucherType, date range.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Read-only + manual journal create; No HTTP endpoints

## Historical Source

- Doc 13 — subagent draft ADR-058

**Phase 2 draft cross-ref:** subagent draft ADR-058

