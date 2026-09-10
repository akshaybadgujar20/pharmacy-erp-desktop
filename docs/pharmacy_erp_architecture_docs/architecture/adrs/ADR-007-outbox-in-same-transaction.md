# ADR-007: Outbox enqueue in same transaction as business mutation

**Status:** Active  
**Confidence:** Explicit  
**Modules:** Persistence (outbox), sync, all mutation modules

---

## Problem / Context

Offline-first sync requires that cloud never sees a business change without a matching outbox event (or vice versa).

## Question Discussed

When should outbox rows be written relative to business table updates?

## Options Considered

1. `outboxService.enqueue(tx, …)` inside the same `UnitOfWorkService.run` transaction
2. Outbox written after transaction commits (async)
3. No outbox until cloud sync phase

## Decision Selected

**Never write outbox outside `UnitOfWorkService.run()`** — enqueue in same `tx` as mutation.

## Rationale

Docs mandate outbox-in-transaction; integration test proves rollback removes both business row and outbox row.

## Trade-offs

- `deviceId` required in `RequestContext` before enqueue
- One outbox row per syncable entity per operation (multi-entity workflows may enqueue multiple rows in one tx)
- Cloud sync worker not built — contract established for future

## Architectural Impact

- Depends on ADR-004 (entityUuid)
- `operationId` = `crypto.randomUUID()` per enqueue (idempotency)
- `sequenceNo` = MAX+1 per deviceId inside same tx

## Affected Modules / Components

- `persistence/outbox/outbox.service.ts`
- All mutation services
- `sync/services/outbox.service.ts` (read/admin only — separate service)

## Rejected Alternatives

- **Post-commit outbox** — rejected (atomicity risk)

## Historical Source

- [`plans/persistence_foundation_patterns_3af5df7a.plan.md`](../../../../plans/persistence_foundation_patterns_3af5df7a.plan.md) — Pattern 2
