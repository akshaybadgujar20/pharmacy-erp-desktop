# ADR-005: Document numbers unique per branch (not globally unique)

**Status:** Active  
**Confidence:** Explicit  
**Modules:** Configuration (sequence), persistence (sequence), purchase, sales, inventory, finance

---

## Problem / Context

Human-readable document numbers (`invoiceNumber`, `transferNumber`, etc.) were `@unique` globally while sequences generate per-branch offline — guaranteed collisions on multi-device/multi-branch sync.

## Question Discussed

What uniqueness scope should human-readable document numbers have?

## Options Considered

1. `@@unique([branchId, documentNumber])` (or equivalent composite) per document type
2. Global `@unique` on document number column
3. UUID-only external reference (no human numbers)

## Decision Selected

**Rework document numbering uniqueness to branch scope** instead of global `@unique`.

## Rationale

Sequence generator is branch-scoped; global uniqueness contradicts offline per-branch allocation.

## Trade-offs

- Same formatted number can exist in two branches (by design)
- Sequence config rows are per `(companyId, branchId, documentType)`
- Format templates include branch code (e.g. `SI-{BR}-{SEQ}`)

## Architectural Impact

- `SequenceGeneratorService.next(tx, { branchId, documentType })` inside UoW
- Document numbers assigned at workflow post/create inside transaction
- Seed `sequence-generator.json` per branch

## Affected Modules / Components

- `persistence/sequence/sequence-generator.service.ts`
- `configuration/services/sequence-generator.service.ts` (admin CRUD on config rows)
- Purchase, sales, inventory, finance workflow services

## Constraints / Assumptions

- `DocumentType` enum in constants maps to config rows
- Optimistic lock on sequence config `version` column

## Rejected Alternatives

- **Global unique invoice numbers** — rejected (offline collision)

## Historical Source

- [`plans/pharmacy_erp_db_review_cfc2c0b5.plan.md`](../../../../plans/pharmacy_erp_db_review_cfc2c0b5.plan.md) — doc-numbering task
