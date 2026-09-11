# ADR-254: Sync admin mutations audit only, no outbox enqueue

**Status:** Active  
**Confidence:** Strongly inferred  
**Modules:** sync

---

## Problem / Context

Outbox retry and conflict resolve are local admin operations, not business-entity changes to sync upstream.

## Question Discussed

Should sync module mutations enqueue outbox events?

## Options Considered

1. Audit + outbox like other modules
2. Audit only, no outbox
3. No audit

## Decision Selected

Sync admin mutations (outbox retry, conflict resolve) write audit logs only; no `outboxService.enqueue`.

## Rationale

Avoids recursive or meaningless outbox entries for sync housekeeping actions.

## Rejected Alternatives

Audit + outbox on retry/resolve; no audit

## Historical Source

- Module memory doc — sync-module.md business rules (sync admin mutations)
