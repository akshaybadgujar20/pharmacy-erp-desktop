# Synchronization Strategy

> Source: Original Architecture Handbook

## Delta Sync

Send only changed records.

Never upload the whole database.

---

## Push

Local → Cloud

---

## Pull

Cloud → Local

---

## Background Sync

Runs

- App Start
- Every few minutes
- Manual Sync
- Network Reconnect

---

## Outbox Pattern

Every change is recorded in an Outbox table.

Background worker processes:

1. Read outbox
2. Send to server
3. Mark success
4. Retry failures

This guarantees reliable delivery even after crashes.

---

## Idempotency

Every transaction gets a unique UUID.

If the same request is received twice, the server safely ignores duplicates.

---

## Conflict Resolution

Different entities require different rules.

Examples:

- Inventory → Transaction-based, never overwrite stock.
- Customer details → Last write wins may be acceptable.
- Medicine master → Prefer server authority.

Keep version numbers or timestamps for conflict detection.

---
