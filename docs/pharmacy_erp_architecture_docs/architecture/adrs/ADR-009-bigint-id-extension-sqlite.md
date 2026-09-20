# ADR-009: Prisma client extension for BIGINT PK assignment on SQLite

**Status:** Active (amended 2026)  
**Confidence:** Explicit  
**Modules:** Infrastructure (Prisma)

---

## Problem / Context

SQLite `db push` creates BIGINT PK columns without AUTOINCREMENT; creates without explicit `id` fail with P2011.

## Question Discussed

How should BIGINT primary keys be assigned when inserting rows on SQLite?

## Options Considered

1. DB-backed per-row allocation via **`IdSequence`** table + Prisma extension (selected; evolved to per-table rows)
2. Buffered DB allocator (reserve id blocks in memory)
3. In-memory counter + startup `MAX(id)` scan
4. Require explicit `id` on every create
5. Switch to autoincrement Int ids

## Decision Selected

**Shared `createPrismaClient` factory** with Prisma `$extends` hook that allocates BIGINT ids from the **`IdSequence`** table — **one row per Prisma model name** (`model_name` PK), each with its own `current_value` and optimistic **`version` (BigInt)** lock. Bootstrap on startup upserts/reconciles each row with `MAX(id)` for that model’s table.

## Rationale

- Per-table id space (Customer ids independent of Medicine ids); sync still uses `uuid`
- DB is the source of truth — no in-memory counter drift
- Per-row allocation is simple and sufficient for desktop ERP insert volume
- Same factory used by `PrismaService` and seed scripts

## Trade-offs

- One DB round-trip per `create` (acceptable for business-app throughput)
- Id allocation and row insert are separate steps — failed inserts can leave id gaps
- Bootstrap scans `MAX(id)` per allocatable model on startup (or lazy row create on first allocate)
- Cloud Postgres may use native sequences later; local SQLite uses `IdSequence`

## Related

- Entity optimistic `version` type: [ADR-010](./ADR-010-entity-version-bigint.md)

## Affected Modules / Components

- `prisma.service.ts`, `persistence/prisma/id-sequence.service.ts`, `persistence/prisma/id-sequence-models.util.ts`, `persistence/prisma/prisma-client.factory.ts`
- `backend/seed/lib/prisma-client.ts`

## Historical Source

- [`plans/persistence_foundation_patterns_3af5df7a.plan.md`](../../../../plans/persistence_foundation_patterns_3af5df7a.plan.md) — Known SQLite prerequisite
- Supersedes in-memory `bigint-id-sequence.ts` approach (2026)
