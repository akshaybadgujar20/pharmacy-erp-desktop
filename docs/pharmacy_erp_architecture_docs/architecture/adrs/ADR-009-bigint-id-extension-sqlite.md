# ADR-009: Prisma client extension for BIGINT PK assignment on SQLite

**Status:** Active  
**Confidence:** Explicit  
**Modules:** Infrastructure (Prisma)

---

## Problem / Context

SQLite `db push` creates BIGINT PK columns without AUTOINCREMENT; creates without explicit `id` fail with P2011.

## Question Discussed

How should BIGINT primary keys be assigned when inserting rows on SQLite?

## Options Considered

1. DB-backed per-row allocation via singleton `IdSequence` table + Prisma extension (selected)
2. Buffered DB allocator (reserve id blocks in memory)
3. In-memory counter + startup `MAX(id)` scan
4. Require explicit `id` on every create
5. Switch to autoincrement Int ids

## Decision Selected

**Shared `createPrismaClient` factory** with Prisma `$extends` hook that allocates BIGINT ids from a singleton **`IdSequence`** table (per-row DB update with optimistic `version` lock). Bootstrap on startup reconciles `currentValue` with existing business data for legacy DBs.

## Rationale

- Single global id space across all tables (device-local PK performance; sync uses `uuid`)
- DB is the source of truth — no in-memory counter drift or startup table scan on every allocation
- Per-row allocation is simple and sufficient for desktop ERP insert volume
- Same factory used by `PrismaService` and seed scripts

## Trade-offs

- One DB round-trip per `create` (acceptable for business-app throughput)
- Id allocation and row insert are separate steps in the extension — failed inserts can leave id gaps
- Bootstrap still scans peak id once per process start to heal legacy DBs missing `id_sequence`
- Cloud Postgres may use native sequences later; local SQLite uses `IdSequence`

## Affected Modules / Components

- `prisma.service.ts`, `persistence/prisma/id-sequence.service.ts`, `persistence/prisma/prisma-client.factory.ts`
- `backend/seed/lib/prisma-client.ts`

## Historical Source

- [`plans/persistence_foundation_patterns_3af5df7a.plan.md`](../../../../plans/persistence_foundation_patterns_3af5df7a.plan.md) — Known SQLite prerequisite
- Supersedes in-memory `bigint-id-sequence.ts` approach (2026)
