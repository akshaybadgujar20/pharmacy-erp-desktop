# ADR-231: Sync admin: outbox read+retry, conflict resolve; no cloud worker

**Status:** Active  
**Confidence:** Explicit  
**Modules:** sync

---

## Problem / Context

Outbox write exists; admin needs visibility and retry.

## Question Discussed

Synchronization module HTTP scope?

## Options Considered

1. Read + retry + resolve; no worker
2. Read-only sync tables
3. Read + local /sync/run stub

## Decision Selected

Outbox read + `POST :id/retry`; SyncLog read-only; SyncConflict read + `POST :id/resolve` — no cloud worker.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Read-only Outbox/SyncLog/SyncConflict; Read APIs + POST /sync/run local stub

## Historical Source

- Doc 18 — subagent draft ADR-121

**Phase 2 draft cross-ref:** subagent draft ADR-121

