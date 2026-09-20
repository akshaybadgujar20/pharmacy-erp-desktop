# ADR-010: Optimistic `version` column as BigInt (local SQLite)

**Status:** Active  
**Confidence:** Explicit  
**Modules:** Infrastructure (Prisma), all feature modules with optimistic locking

---

## Decision

Local Prisma models use **`version BigInt @default(1)`** for optimistic concurrency on business entities. REST APIs accept `version` as a numeric string (coerced to `bigint` in DTOs) and return `version` as a **string** in JSON responses.

**Exception:** [`SequenceGenerator`](../../../../backend/prisma/configuration/sequence-generator.prisma) keeps **`version Int`** (document-number config only); its admin API and Angular screen remain `number`.

## Rationale

- Aligns optimistic-lock counters with BIGINT PK scale where allocation frequency tracks updates (e.g. `IdSequence` per model).
- Consistent JSON handling with other BigInt fields (string on the wire).
- Sync identity remains **`uuid`** (ADR-004); `version` is not a sync key.

## Trade-offs

- Cross-cutting backend and Angular changes; SequenceGenerator is intentionally excluded.
- Mixed types: most entities `version` BigInt, SequenceGenerator `version` Int.

## Affected components

- All `update-*.dto.ts` / workflow DTOs (except sequence-generator update DTO)
- [`DeleteEntityQueryDto`](../../../../backend/src/common/dto/delete-entity-query.dto.ts)
- Feature mappers (`version.toString()`)
- Angular feature models (`version: string`), except `sequence-generators/`
