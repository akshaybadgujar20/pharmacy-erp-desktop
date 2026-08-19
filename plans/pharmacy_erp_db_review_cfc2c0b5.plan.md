---
name: Pharmacy ERP DB Review
overview: Deliver a principal-architect-level review of the Pharmacy ERP SQLite-first/offline-first data model as a versioned markdown doc, then apply the corrective Prisma schema changes, regenerate the init migration, and update the impacted database/workflow docs so schema and docs agree.
todos:
  - id: review-doc
    content: Write architecture-review.md covering all 24 sections with ranked findings, scorecard, and verdict (no source edits).
    status: pending
  - id: provider-strategy
    content: "Fix datasource block: url via env + SQLite/Postgres provider strategy; establish no-enum / no-@db.* rule."
    status: pending
  - id: stock-batch
    content: "Fix Stock/Batch multi-branch: drop batchId @unique, add Branch FK, Batch.stocks Stock[], correct batch uniqueness scope."
    status: pending
  - id: pricing
    content: Move batch pricing to correct layer (lot cost vs branch/price-list sale price) per review.
    status: pending
  - id: enums-string
    content: Replace all enums with String status fields, delete unused enum blocks, fix salesType default.
    status: pending
  - id: sync-identity
    content: Standardize uuid defaults; outbox/sync-conflict reference entityUuid; add deviceId/origin, idempotency/operation id, ordering.
    status: pending
  - id: doc-numbering
    content: Scope invoice/transfer/adjustment/movement numbers per-branch instead of global @unique.
    status: pending
  - id: fks-indexes-audit
    content: Add missing FKs/indexes, standardize audit columns, rename typo file stock-transferI-iem.prisma.
    status: pending
  - id: migration
    content: Regenerate init migration replacing the stale Store migration; document Postgres CHECK constraints.
    status: pending
  - id: docs-sync
    content: Update impacted database table docs, overview, multi-store, and workflow docs to match corrected schema; remove @db.* from SQLite docs.
    status: pending
  - id: verify
    content: Run prisma format/validate on SQLite; spot-check doc snippets vs models.
    status: pending
isProject: false
---

# Pharmacy ERP - Architecture & Database Review + Corrective Update

## Context confirmed from the repo
- Prisma uses a **multi-file schema** ([backend/prisma/schema.prisma](backend/prisma/schema.prisma) has `provider = "sqlite"`, **no `url`**, no `previewFeatures`) with 73 model files under `backend/prisma/**`.
- Intended architecture (docs) = offline-first, SQLite local + PostgreSQL cloud, Prisma, multi-branch, "keep SQLite and PostgreSQL schemas compatible" ([database_overview.md](docs/pharmacy_erp_architecture_docs/database/database_overview.md)).
- Identity pattern: `BigInt @id @default(autoincrement())` + `uuid String @unique` (uuid default is **inconsistently** applied).

## Confirmed high-impact findings (grounding for the review)
- **Multi-branch stock is broken (Critical).** [inventory/stock.prisma](backend/prisma/inventory/stock.prisma) has BOTH `batchId BigInt @unique` and `@@unique([branchId, batchId])`, and [inventory/batch.prisma](backend/prisma/inventory/batch.prisma) declares `stock Stock?` (one-to-one). A batch/lot can therefore hold stock in only ONE branch, making per-branch stock and inter-branch transfers impossible. The docs enshrine the same flaw ("Each Batch has exactly one Stock record", `Unique (batchId)`) in [24_stock.md](docs/pharmacy_erp_architecture_docs/database/tables/inventory/24_stock.md).
- **`Stock.branchId` has no relation/FK** to `Branch` (dangling column, no referential integrity); `Batch` has no branch relation either.
- **Pricing conflated into Batch.** [batch.prisma](backend/prisma/inventory/batch.prisma) carries `purchaseRate/mrp/saleRate/discountPercent` at org level, so branch-specific pricing is impossible and lot identity is mixed with pricing.
- **Enums on a SQLite datasource (Critical, will not generate).** `enum` is used in [party.prisma](backend/prisma/party_management/party.prisma), [customer.prisma](backend/prisma/party_management/customer.prisma), [stock-transfer.prisma](backend/prisma/inventory/stock-transfer.prisma), [sales-invoice.prisma](backend/prisma/sales/sales-invoice.prisma), etc. Prisma's SQLite connector does not support enums.
- **Invalid default.** [sales-invoice.prisma](backend/prisma/sales/sales-invoice.prisma): `salesType String @default(RETAIL_OTC)` (bare enum identifier as a String default) is invalid; `SalesType` enum is defined but unused.
- **PostgreSQL-only leakage in docs.** [24_stock.md](docs/pharmacy_erp_architecture_docs/database/tables/inventory/24_stock.md) sample Prisma uses `@db.Uuid` and `@db.Decimal(14,3)` on the SQLite-first model.
- **Sync identity uses local ids.** [synchronization/outbox.prisma](backend/prisma/synchronization/outbox.prisma) and [sync-conflict.prisma](backend/prisma/synchronization/sync-conflict.prisma) reference `entityId BigInt` (per-device autoincrement) instead of the global `uuid`; there is no `deviceId`/`branchId` origin, `operationId`/idempotency key, or causal ordering column on outbox.
- **Global human-readable document numbers.** `invoiceNumber/transferNumber/adjustmentNumber/movementNumber` are `@unique` globally while generated per-branch offline via [sequence-generator.prisma](backend/prisma/configuration/sequence-generator.prisma) -> guaranteed collisions on multi-device/multi-branch sync.
- **Migration drift (Critical).** The only migration [20251220151923_init/migration.sql](backend/prisma/migrations/20251220151923_init/migration.sql) creates a single unrelated `Store` table; the 73-model schema has never been migrated.
- **Inconsistent `uuid` defaults / soft-delete / audit** columns across models (some have `@default(uuid())`, most don't; ledgers correctly omit `deletedAt` but master tables vary).

## Cross-cutting decision baked into this plan
SQLite (local) + PostgreSQL (cloud) from one Prisma schema. Recommended approach: **single schema, `provider`/`url` via env**, **replace all `enum`s with `String` status columns** (validated in app + CHECK constraints in the Postgres migration), and **forbid `@db.*` native attributes** in the shared schema. This keeps local SQLite and cloud PostgreSQL structurally identical and sync-safe. This is the least-complex option and is used throughout the corrective phase.

## Deliverable 1 - Review document (new file)
Create `docs/pharmacy_erp_architecture_docs/database/architecture-review.md` covering all 24 requested sections (Executive Summary -> Final Architect Verdict), opinionated and critical, with each major problem framed as **why it is a problem -> real-world pharmacy scenario -> recommended solution -> trade-off**, ranked red/orange/yellow/green, ending with the scorecard table and a YES / YES-WITH-CHANGES / NO verdict. No source files are modified while producing this document.

## Deliverable 2 - Corrective Prisma changes (after review is reviewed)
Apply the schema fixes derived from the review, including at minimum:
- Split **Stock** from Batch: remove `batchId @unique`, keep `@@unique([branchId, batchId])`, add real `branch Branch @relation` (+ inverse on Branch), change `Batch.stock Stock?` -> `stocks Stock[]`.
- Move batch-level **pricing** to the appropriate layer (batch cost as lot cost snapshot vs branch/price-list sale price) per review recommendation.
- Replace all **enums** with `String` status fields; delete unused enum blocks; fix `salesType` default.
- Add **sync-safe identity**: consistent `uuid String @unique @default(uuid())` everywhere; change outbox/sync-conflict to reference `entityUuid`; add `deviceId`/origin + idempotency/operation id + ordering to outbox.
- Rework **document numbering** uniqueness to `@@unique([branchId, documentType-number])` scope instead of global `@unique`.
- Add missing FKs/indexes (e.g. `Stock.branchId` FK, batch uniqueness scope `organization+medicine+manufacturer+batchNumber` as recommended), and standardize audit columns.
- Fix datasource block (`url = env(...)`, provider strategy) and rename typo file `inventory/stock-transferI-iem.prisma`.

## Deliverable 3 - Migration + docs sync
- Regenerate the init migration to match the corrected schema (replace the stale `Store` migration) for the SQLite provider, and note the PostgreSQL CHECK-constraint additions.
- Update impacted docs so they match the corrected model: [24_stock.md](docs/pharmacy_erp_architecture_docs/database/tables/inventory/24_stock.md), [23_batch.md](docs/pharmacy_erp_architecture_docs/database/tables/inventory/23_batch.md), `25_stock_movement.md`, `26_stock_adjustment.md`, `27_stock_transfer.md`, `72_stock-transfer-item.md`, sync docs (`56_sync_log.md`, `57_sync_conflict.md`, add an outbox table doc), [database_overview.md](docs/pharmacy_erp_architecture_docs/database/database_overview.md), the multi-store architecture doc, and affected `workflows/*` (inventory/purchase/sales/stock-transfer/stock-adjustment). Remove `@db.*` examples from SQLite-first docs.

## Verification
- `prisma format` + `prisma validate` against the SQLite provider must pass (proves enums/native-type issues resolved).
- Spot-check that each corrected table doc's Prisma snippet matches the actual `.prisma` model.