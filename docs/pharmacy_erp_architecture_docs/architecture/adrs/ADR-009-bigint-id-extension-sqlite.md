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

1. Shared `$extends` hook (in-memory sequence) — same as seed client
2. Require explicit `id` on every create
3. Switch to autoincrement Int ids

## Decision Selected

**Extract shared `createPrismaClient` factory** with BIGINT id extension; use in `PrismaService` and seed.

## Rationale

Discovered during seed/integration work; keeps BigInt PK + uuid pattern from ADR-001 schema without schema change.

## Trade-offs

- In-memory allocator per process (desktop single-writer acceptable)
- Must sync sequence on startup from max(id) in tables
- Cloud Postgres may use native sequences later

## Affected Modules / Components

- `prisma.service.ts`, `persistence/prisma/bigint-id-sequence.ts`
- `backend/seed/lib/prisma-client.ts`

## Historical Source

- [`plans/persistence_foundation_patterns_3af5df7a.plan.md`](../../../../plans/persistence_foundation_patterns_3af5df7a.plan.md) — Known SQLite prerequisite
