# ADR-002: String status fields instead of Prisma enums on SQLite

**Status:** Active  
**Confidence:** Explicit  
**Modules:** Infrastructure, all domain modules

---

## Problem / Context

Prisma `enum` types were used in multiple model files, but the SQLite connector does not support enums — schema would not generate.

## Question Discussed

How should status/type fields (party type, invoice status, transfer status, etc.) be modeled on SQLite-first schema?

## Options Considered

1. Replace all enums with `String` columns; validate in application + Postgres CHECK constraints
2. Keep enums and abandon SQLite
3. Use integer codes without string labels

## Decision Selected

**Replace all `enum`s with `String` status columns**; delete unused enum blocks; validate in app layer.

## Rationale

Required for SQLite provider compatibility while keeping a single shared schema (see ADR-001).

## Trade-offs

- No database-level enum enforcement on SQLite
- Constants files per module (`*.constants.ts`) become the canonical allowed values
- Postgres migration can add CHECK constraints for cloud

## Architectural Impact

- Every workflow guard uses string constants from module `constants/` files
- DTOs use `@IsIn([...])` or equivalent validation
- Seed data uses string values matching constants

## Affected Modules / Components

- All Prisma models that had enums
- All module `constants/*.constants.ts` files

## Constraints / Assumptions

- Forbid `@db.*` native attributes in shared schema (paired decision in ADR-001 plan)

## Rejected Alternatives

- **Prisma enums** — rejected (SQLite connector does not support)
- **Integer-only codes** — not chosen; strings preferred for readability and doc alignment

## Historical Source

- [`plans/pharmacy_erp_db_review_cfc2c0b5.plan.md`](../../../../plans/pharmacy_erp_db_review_cfc2c0b5.plan.md) — enums task + cross-cutting decision
