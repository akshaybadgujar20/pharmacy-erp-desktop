# ADR-004: Outbox and sync reference entityUuid (not local BigInt id)

**Status:** Active  
**Confidence:** Explicit  
**Modules:** Sync, persistence (outbox), all mutation modules

---

## Problem / Context

Outbox and sync-conflict rows referenced `entityId BigInt` (per-device autoincrement), which collides across devices after sync. Global identity must use `uuid`.

## Question Discussed

What identifier should outbox and conflict resolution use to reference business entities across devices?

## Options Considered

1. `entityUuid` + `deviceId` + `operationId` + per-device `sequenceNo` ordering
2. Local `entityId` BigInt only
3. Composite key of company + branch + document number

## Decision Selected

**entityUuid** as sync reference; add `deviceId`/origin, idempotency `operationId`, and ordering on outbox.

## Rationale

BigInt PKs are local to each SQLite file; UUIDs are globally unique for offline-first merge.

## Trade-offs

- Every syncable entity must have `uuid String @unique`
- Mutation services must pass `entityUuid` to `outboxService.enqueue`
- Cloud worker not implemented yet — contract is established

## Architectural Impact

- `OutboxService.enqueue(tx, { entityUuid, ... })` mandatory in mutations
- `entity-type.constants.ts` registry for payload typing
- Sync admin APIs read by uuid; conflict resolve is metadata-only today

## Affected Modules / Components

- `persistence/outbox/outbox.service.ts`
- `sync/` admin module
- All mutation services

## Constraints / Assumptions

- Consistent `uuid @default(uuid())` on syncable tables
- `deviceId` required in `RequestContext` for outbox ordering

## Rejected Alternatives

- **entityId BigInt** — rejected (not globally unique across devices)

## Historical Source

- [`plans/pharmacy_erp_db_review_cfc2c0b5.plan.md`](../../../../plans/pharmacy_erp_db_review_cfc2c0b5.plan.md) — sync-identity task
