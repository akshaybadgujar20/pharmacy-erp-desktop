# ADR-001: SQLite local + PostgreSQL cloud from one Prisma schema

**Status:** Active  
**Confidence:** Explicit  
**Modules:** Infrastructure, persistence, sync

---

## Problem / Context

The pharmacy ERP is offline-first (local SQLite) with a future cloud PostgreSQL target. The schema and docs must stay aligned so sync and migration are feasible.

## Question Discussed

How should we support SQLite (desktop) and PostgreSQL (cloud) without maintaining two divergent schemas?

## Options Considered

1. Single Prisma schema with `provider`/`url` via env — structurally identical on both databases
2. Separate SQLite and PostgreSQL schemas
3. SQLite-only with manual cloud migration later

## Decision Selected

**Single schema, `provider`/`url` via env** — SQLite (local) + PostgreSQL (cloud) from one Prisma schema.

## Rationale

Stated in plan as "the least-complex option and is used throughout the corrective phase" for sync-safe structural identity.

## Trade-offs

- PostgreSQL-specific CHECK constraints documented separately in migration notes
- App-layer validation required where SQLite lacks native enum/check support

## Architectural Impact

- All models must avoid provider-specific Prisma attributes
- `prisma validate` must pass for SQLite provider
- Cloud migration path preserved without schema fork

## Affected Modules / Components

- `backend/prisma/**`
- All feature modules (read/write same models)
- Sync/outbox (future cloud ingest)

## Constraints / Assumptions

- Desktop runs SQLite via `@prisma/adapter-better-sqlite3`
- Structural parity is mandatory for offline-first sync

## Rejected Alternatives

- **Separate schemas per provider** — rejected (sync and maintenance cost)
- **SQLite-only indefinitely** — rejected (cloud target in architecture docs)

## Historical Source

- [`plans/pharmacy_erp_db_review_cfc2c0b5.plan.md`](../../../../plans/pharmacy_erp_db_review_cfc2c0b5.plan.md) — "Cross-cutting decision baked into this plan"
