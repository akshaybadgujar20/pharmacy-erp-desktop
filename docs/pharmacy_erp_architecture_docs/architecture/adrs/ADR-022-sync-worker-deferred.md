# ADR-022: Cloud sync worker not implemented in v1

**Status:** Active  
**Confidence:** Explicit  
**Modules:** Sync

---

## Problem / Context

Outbox enqueue exists; upload worker does not.

## Question Discussed

Implement cloud sync worker now?

## Options Considered

1. Defer worker; admin read/retry only
2. Build worker now

## Decision Selected

Sync admin APIs only; cloud worker future.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

See options not selected above; reasons not explicitly recorded.

## Historical Source

- Doc 07 — data-and-sync.md; developer guide Known gaps
