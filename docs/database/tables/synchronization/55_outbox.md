# Outbox

## Purpose

The Outbox table stores all local database changes that need to be synchronized with the cloud/server.

It is the foundation of the **Outbox Pattern**, ensuring reliable offline-first synchronization. Whenever a business transaction is committed locally, an Outbox record is created in the same database transaction.

The synchronization service processes pending Outbox records and sends them to the server.

---

## Business Rules

- Every local CREATE, UPDATE, and DELETE operation generates an Outbox record.
- Business transactions and Outbox records must be committed atomically.
- Records are processed in creation order.
- Successfully synchronized records are marked as completed.
- Failed synchronization attempts are retried.
- Records are never physically deleted immediately.
- Payload should contain the complete business object or delta.
- UUID is used for synchronization across devices.
- BIGINT is used as the internal primary key.

---

## Relationships

```
Business Tables
     │
     │
     ├── Medicine
     ├── Customer
     ├── SalesInvoice
     ├── PurchaseInvoice
     ├── StockMovement
     └── ...
          │
          ▼
       Outbox
          │
          ▼
Synchronization Service
          │
          ▼
Cloud API
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Unique synchronization identifier |
| Business | entityType | TEXT | VARCHAR(100) | No | Entity name (Medicine, Customer, SalesInvoice, etc.) |
| Business | entityId | INTEGER | BIGINT | No | Local entity primary key |
| Business | operation | TEXT | VARCHAR(10) | No | CREATE, UPDATE, DELETE |
| Business | payload | TEXT | JSONB | No | Serialized entity payload |
| Business | payloadVersion | INTEGER | INTEGER | No | Schema version of payload |
| Status | syncStatus | TEXT | VARCHAR(20) | No | PENDING, PROCESSING, SYNCED, FAILED |
| Business | retryCount | INTEGER | INTEGER | No | Number of retry attempts |
| Business | lastError | TEXT | TEXT | Yes | Last synchronization error |
| Business | createdAt | DATETIME | TIMESTAMP | No | Local transaction timestamp |
| Business | processedAt | DATETIME | TIMESTAMP | Yes | Server synchronization timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- CHECK (operation IN ('CREATE','UPDATE','DELETE'))
- CHECK (syncStatus IN ('PENDING','PROCESSING','SYNCED','FAILED'))
- CHECK (retryCount >= 0)
- CHECK (payloadVersion >= 1)
- CHECK (version >= 1)

---

## Indexes

- PK_Outbox
- UK_Outbox_UUID
- IDX_Outbox_Status
- IDX_Outbox_CreatedAt
- IDX_Outbox_Entity
- IDX_Outbox_Operation
- IDX_Outbox_Retry

---

## Sample Records

| id | entityType | entityId | operation | syncStatus | retryCount |
|----|------------|---------:|-----------|------------|-----------:|
| 1 | SalesInvoice | 105 | CREATE | PENDING | 0 |
| 2 | Customer | 210 | UPDATE | PROCESSING | 1 |
| 3 | Medicine | 35 | DELETE | FAILED | 3 |

---

## Prisma Model

```prisma
model Outbox {
  id              BigInt   @id @default(autoincrement())

  uuid            String   @unique @db.Uuid

  entityType      String
  entityId        BigInt

  operation       String

  payload         Json

  payloadVersion  Int      @default(1)

  syncStatus      String   @default("PENDING")

  retryCount      Int      @default(0)

  lastError       String?

  createdAt       DateTime @default(now())
  processedAt     DateTime?

  version         Int      @default(1)

  @@index([syncStatus])
  @@index([createdAt])
  @@index([entityType, entityId])
  @@index([operation])
  @@index([retryCount])
}
```

---

## Notes

- Implements the **Transactional Outbox Pattern**.
- Outbox records must be inserted in the **same database transaction** as the business data.
- The Synchronization Service continuously polls pending records.
- Failed records remain in the Outbox until successfully synchronized or manually resolved.
- Payload should contain all information required by the server to reproduce the change.
- Supports offline-first architecture with SQLite clients and PostgreSQL cloud servers.
- Compatible with both SQLite and PostgreSQL.
