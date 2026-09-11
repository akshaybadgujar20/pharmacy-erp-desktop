# ADR-253: Outbox retry only from FAILED or PROCESSING to PENDING

**Status:** Active  
**Confidence:** Strongly inferred  
**Modules:** sync

---

## Problem / Context

Admin retry must not reset successfully synced or in-flight outbox rows incorrectly.

## Question Discussed

Which outbox statuses may be retried via `POST /outbox/:id/retry`?

## Options Considered

1. Any status → PENDING
2. Only FAILED or PROCESSING → PENDING
3. FAILED only

## Decision Selected

Retry transitions only `FAILED` or `PROCESSING` → `PENDING`; version-checked update; audited via `OutboxAdminService`.

## Rationale

Prevents accidental re-queue of completed sync work while allowing recovery from stuck or failed rows.

## Rejected Alternatives

Retry from any status; FAILED only

## Historical Source

- Module memory doc — sync-module.md business rules (outbox retry)
