# ADR-150: Audit and outbox in same transaction as mutation

**Status:** Active  
**Confidence:** Strongly inferred  
**Modules:** persistence, audit, sync

---

## Problem / Context

Audit/outbox rows must not commit without the business change.

## Question Discussed

When should audit and outbox be written?

## Options Considered

1. Inside the same transaction as the mutation
2. After transaction commits
3. Audit only, no outbox

## Decision Selected

Every mutation calls `auditService.log(tx, …)` and `outboxService.enqueue(tx, …)` inside the same `tx`.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

After transaction commits; Audit only, no outbox

## Historical Source

- Doc 09 — subagent draft ADR-032

**Phase 2 draft cross-ref:** subagent draft ADR-032

