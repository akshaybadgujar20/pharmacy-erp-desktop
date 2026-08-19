# Prisma (SQLite) ↔ JPA (PostgreSQL) Alignment

This document describes how the Pharmacy ERP keeps the **local Prisma/SQLite** schema and **cloud JPA/PostgreSQL** schema logically aligned while respecting each platform's native types.

---

## Architecture split

```text
Electron Desktop
  Angular UI
       ↓
  NestJS API
       ↓
  Prisma ORM
       ↓
  SQLite (offline-first operational DB)
       ↓ sync (Outbox / UUID)
  Spring Boot API
       ↓
  JPA/Hibernate
       ↓
  PostgreSQL (cloud authoritative store)
```

---

## Identity strategy

| Field | Local (Prisma) | Cloud (JPA) | Sync rule |
|-------|----------------|---------------|-----------|
| `id` | `BigInt @id @default(autoincrement())` | `Long @GeneratedValue` | **Never sync** — device-local only |
| `uuid` | `String @unique @default(uuid())` | `UUID` or `String(36)` | **Always sync** — global entity key |
| Outbox `entityUuid` | `String` | `String` / UUID column | References business entity by uuid |
| Outbox `operationId` | `String @unique` | `String @unique` | Idempotent replay key |

Never key sync on local autoincrement `id` or Outbox `entityId` (removed).

---

## Type mapping

| Prisma (shared schema) | SQLite storage | JPA / PostgreSQL |
|------------------------|----------------|------------------|
| `String` | TEXT | `VARCHAR` / `TEXT` |
| `BigInt` | INTEGER | `BIGINT` |
| `Int` | INTEGER | `INTEGER` |
| `Boolean` | INTEGER (0/1) | `BOOLEAN` |
| `DateTime` | DATETIME | `TIMESTAMP WITH TIME ZONE` |
| `Decimal` | REAL | `NUMERIC(p,s)` — specify in `@Column` |
| `Json` | TEXT (JSON string) | `JSONB` via `@Column(columnDefinition = "jsonb")` |

### Rules

1. **No `@db.*` attributes** in Prisma schema files.
2. **No Prisma `enum`** — use `String` with documented allowed values.
3. **JSONB is cloud-only** — Prisma uses `Json`; JPA maps the same logical column to JSONB in PostgreSQL.
4. **UUID** — Prisma uses `String @default(uuid())`; JPA may use `java.util.UUID` or `String`.

---

## Inventory model alignment

Both sides must implement the same cardinality:

```text
Medicine (org)
  └── Batch (org-global: lot + purchaseRate + mrp)
        └── Stock (many: one per branchId + batchId)
              └── StockMovement (ledger per branch)
```

| Concept | Prisma constraint | JPA equivalent |
|---------|-------------------|----------------|
| Lot identity | `Batch @@unique([medicineId, batchNumber])` | `@Table(uniqueConstraints=...)` |
| Branch stock | `Stock @@unique([branchId, batchId])` | Same composite unique |
| Movement number | `StockMovement @@unique([branchId, movementNumber])` | Same |
| Transfer number | `StockTransfer @@unique([sourceBranchId, transferNumber])` | Same |
| Adjustment number | `StockAdjustment @@unique([branchId, adjustmentNumber])` | Same |

**Batch does not carry `saleRate`.** Branch sale pricing is in `PriceListItem.sellingPrice`.

---

## Synchronization model alignment

### Outbox (local → cloud)

| Field | Purpose |
|-------|---------|
| `entityType` | Entity class name |
| `entityUuid` | Global entity reference |
| `operation` | CREATE / UPDATE / DELETE |
| `payload` | Full entity JSON |
| `deviceId` | Originating device |
| `branchId` | Branch context (nullable) |
| `operationId` | Idempotency key |
| `sequenceNo` | Per-device ordering |

Cloud ingest API must deduplicate on `operationId` and merge on `entityUuid`.

### SyncConflict

- Keys conflicts by `(entityType, entityUuid)`.
- `localPayload` / `serverPayload`: Prisma `Json` locally; JPA `JSONB` in PostgreSQL.

---

## Status and type fields

All status, type, and direction fields are **String** in Prisma:

```prisma
status String  // e.g. "DRAFT", "APPROVED" — not enum Status
```

JPA:

```java
@Column(nullable = false, length = 20)
private String status;
```

Optional PostgreSQL CHECK constraints can be added in cloud-only Flyway/Liquibase migrations — not in the shared Prisma schema.

---

## Document numbering

Document numbers are **branch-scoped** (or source-branch-scoped for transfers):

| Entity | Unique constraint |
|--------|-------------------|
| SalesInvoice | `(branchId, invoiceNumber)` |
| StockMovement | `(branchId, movementNumber)` |
| StockAdjustment | `(branchId, adjustmentNumber)` |
| StockTransfer | `(sourceBranchId, transferNumber)` |

`SequenceGenerator` is scoped by `(companyId, branchId, documentType)`.

---

## Checklist for new entities

- [ ] `uuid String @unique @default(uuid())` on syncable entities
- [ ] Status/type as `String`, not enum
- [ ] No `@db.*` in Prisma
- [ ] Branch FK where transaction is branch-scoped
- [ ] Document numbers scoped to branch
- [ ] Outbox writes `entityUuid` in same transaction
- [ ] JPA entity mirrors field names via `@Column(name = "...")`
- [ ] JSONB only in JPA `@Column(columnDefinition = "jsonb")`

---

## Related documents

- [[database_overview]]
- [[architecture-review]]
- [[multi-store]]
- Table specs: `23_batch.md`, `24_stock.md`, `55_outbox.md`
