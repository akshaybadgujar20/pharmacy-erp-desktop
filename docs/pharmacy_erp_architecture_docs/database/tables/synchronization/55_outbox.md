# Outbox

## Purpose

The Outbox table stores all local database changes that need to be synchronized with the cloud/server.

It is the foundation of the **Outbox Pattern**, ensuring reliable offline-first synchronization. Whenever a business transaction is committed locally, an Outbox record is created in the same database transaction.

The synchronization service processes pending Outbox records and sends them to the server.

---

## Business Rules

- Every local CREATE, UPDATE, and DELETE operation generates an Outbox record.
- Business transactions and Outbox records must be committed atomically.
- Records are processed in `sequenceNo` order (per device).
- Successfully synchronized records are marked as completed.
- Failed synchronization attempts are retried using the same `operationId` (idempotent).
- Records are never physically deleted immediately.
- Payload should contain the complete business object or delta.
- **`entityUuid`** (not local `entityId`) identifies the business entity across devices.
- `deviceId`, `branchId`, `operationId`, and `sequenceNo` support attribution, ordering, and idempotent replay.
- UUID is used for synchronization across devices.
- BIGINT is used as the internal primary key.

---

## Relationships

```
Business Tables (uuid)
     │
     ├── Medicine
     ├── Customer
     ├── SalesInvoice
     ├── StockMovement
     └── ...
          │
          ▼
       Outbox (entityUuid)
          │
          ▼
Synchronization Service
          │
          ▼
Cloud API (Spring Boot + JPA + PostgreSQL)
```

---

## Columns

| Category | Column | SQLite | PostgreSQL (JPA) | Nullable | Description |
|----------|--------|---------|------------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key (local only) |
| Identifier | uuid | TEXT | UUID/TEXT | No | Unique synchronization identifier |
| Business | entityType | TEXT | VARCHAR(100) | No | Entity name (Medicine, SalesInvoice, etc.) |
| Business | entityUuid | TEXT | UUID/TEXT | No | Global entity UUID (never local BigInt id) |
| Business | operation | TEXT | VARCHAR(10) | No | CREATE, UPDATE, DELETE |
| Business | payload | TEXT | JSONB | No | Serialized entity payload (TEXT in SQLite; JSONB in cloud JPA) |
| Business | payloadVersion | INTEGER | INTEGER | No | Schema version of payload |
| Sync | deviceId | TEXT | VARCHAR(100) | No | Client device identifier |
| Sync | branchId | INTEGER | BIGINT | Yes | Origin branch for branch-scoped entities |
| Sync | operationId | TEXT | UUID/TEXT | No | Idempotency key (unique) |
| Sync | sequenceNo | INTEGER | BIGINT | No | Monotonic ordering per device |
| Status | syncStatus | TEXT | VARCHAR(20) | No | PENDING, PROCESSING, SYNCED, FAILED (String) |
| Business | retryCount | INTEGER | INTEGER | No | Number of retry attempts |
| Business | lastError | TEXT | TEXT | Yes | Last synchronization error |
| Business | createdAt | DATETIME | TIMESTAMP | No | Local transaction timestamp |
| Business | processedAt | DATETIME | TIMESTAMP | Yes | Server synchronization timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- Unique (operationId)
- Foreign Key (branchId → Branch.id) when present
- CHECK (retryCount >= 0)
- CHECK (payloadVersion >= 1)
- CHECK (version >= 1)

---

## Indexes

- PK_Outbox
- UK_Outbox_UUID
- UK_Outbox_OperationId
- IDX_Outbox_Status
- IDX_Outbox_CreatedAt
- IDX_Outbox_Entity (entityType, entityUuid)
- IDX_Outbox_Operation
- IDX_Outbox_Retry
- IDX_Outbox_SequenceNo
- IDX_Outbox_DeviceId

---

## Sample Records

| id | entityType | entityUuid | operation | deviceId | sequenceNo | syncStatus |
|----|------------|------------|-----------|----------|------------|------------|
| 1 | SalesInvoice | a1b2-... | CREATE | DESK-001 | 1001 | PENDING |
| 2 | Customer | c3d4-... | UPDATE | DESK-001 | 1002 | PROCESSING |
| 3 | StockMovement | e5f6-... | CREATE | DESK-002 | 501 | FAILED |

---

## Prisma Model

```prisma
model Outbox {
  id   BigInt @id @default(autoincrement())
  uuid String @unique @default(uuid())

  entityType String @map("entity_type")
  entityUuid String @map("entity_uuid")

  operation String

  payload Json

  payloadVersion Int @default(1) @map("payload_version")

  deviceId    String  @map("device_id")
  branchId    BigInt? @map("branch_id")
  operationId String  @unique @map("operation_id")
  sequenceNo  BigInt  @map("sequence_no")

  syncStatus String @default("PENDING") @map("sync_status")

  retryCount Int @default(0) @map("retry_count")

  lastError String? @map("last_error")

  createdAt   DateTime  @default(now()) @map("created_at")
  processedAt DateTime? @map("processed_at")

  version Int @default(1)

  branch Branch? @relation(fields: [branchId], references: [id])

  @@index([syncStatus])
  @@index([createdAt])
  @@index([entityType, entityUuid])
  @@index([operation])
  @@index([retryCount])
  @@index([sequenceNo])
  @@index([deviceId])
}
```

> **PostgreSQL (JPA) note:** Map `payload` to `JSONB` in the cloud entity. Prisma uses `Json` (TEXT in SQLite). Do not use `@db.JsonB` in the shared Prisma schema.

---

## Notes

- Implements the **Transactional Outbox Pattern**.
- Outbox records must be inserted in the **same database transaction** as the business data.
- Sync keys on **`entityUuid`**, never on local autoincrement `id`.
- The Synchronization Service polls pending records ordered by `sequenceNo`.
- Failed records remain until successfully synchronized or manually resolved.
- Supports offline-first architecture with SQLite clients and PostgreSQL cloud servers.
