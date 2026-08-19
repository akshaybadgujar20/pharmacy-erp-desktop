# SyncConflict

## Purpose

The SyncConflict table records data conflicts detected during synchronization between the local SQLite database and the cloud PostgreSQL server.

A conflict occurs when the same business record (identified by **`entityUuid`**) has been modified on both the client and the server before synchronization.

The table preserves both versions of the data and records how the conflict was resolved.

---

## Business Rules

- Every conflict belongs to one synchronization session (`syncLogId`).
- Every conflict references one business entity by **`entityUuid`** (not local `entityId`).
- Both local and server versions must be preserved until resolution.
- Resolved conflicts become read-only.
- Conflicts may be resolved automatically or manually.
- Conflict history must never be deleted.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
SyncLog
    │
    └────────< SyncConflict (entityUuid)
                    │
                    └────────► Business Entity (by uuid)
```

---

## Columns

| Category | Column | SQLite | PostgreSQL (JPA) | Nullable | Description |
|----------|--------|---------|------------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID/TEXT | No | Global unique identifier |
| Foreign Key | syncLogId | INTEGER | BIGINT | No | References SyncLog.id |
| Business | entityType | TEXT | VARCHAR(100) | No | Entity name (Medicine, SalesInvoice, etc.) |
| Business | entityUuid | TEXT | UUID/TEXT | No | Global entity UUID |
| Business | conflictType | TEXT | VARCHAR(30) | No | UPDATE_UPDATE, DELETE_UPDATE, etc. (String) |
| Business | localPayload | TEXT | JSONB | No | Local version (TEXT in SQLite; JSONB in cloud JPA) |
| Business | serverPayload | TEXT | JSONB | No | Server version (TEXT in SQLite; JSONB in cloud JPA) |
| Status | resolutionStatus | TEXT | VARCHAR(20) | No | PENDING, AUTO_RESOLVED, etc. (String) |
| Business | resolutionStrategy | TEXT | VARCHAR(30) | Yes | SERVER_WINS, CLIENT_WINS, MERGED, MANUAL |
| Business | resolvedBy | TEXT | VARCHAR(100) | Yes | User or process resolving the conflict |
| Business | resolvedAt | DATETIME | TIMESTAMP | Yes | Resolution timestamp |
| Business | remarks | TEXT | TEXT | Yes | Resolution notes |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Conflict detection timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- Foreign Key (syncLogId → SyncLog.id)
- CHECK (version >= 1)

---

## Indexes

- PK_SyncConflict
- UK_SyncConflict_UUID
- IDX_SyncConflict_SyncLog
- IDX_SyncConflict_Entity (entityType, entityUuid)
- IDX_SyncConflict_Status
- IDX_SyncConflict_Type
- IDX_SyncConflict_ResolvedAt

---

## Sample Records

| id | entityType | entityUuid | conflictType | resolutionStatus | resolutionStrategy |
|----|------------|------------|--------------|------------------|--------------------|
| 1 | Customer | a1b2-... | UPDATE_UPDATE | AUTO_RESOLVED | SERVER_WINS |
| 2 | SalesInvoice | c3d4-... | VERSION_MISMATCH | PENDING | NULL |
| 3 | Stock | e5f6-... | UPDATE_UPDATE | MANUAL_RESOLVED | CLIENT_WINS |

---

## Prisma Model

```prisma
model SyncConflict {
  id   BigInt @id @default(autoincrement())
  uuid String @unique @default(uuid())

  syncLogId BigInt @map("sync_log_id")

  entityType String @map("entity_type")
  entityUuid String @map("entity_uuid")

  conflictType String @map("conflict_type")

  localPayload  Json @map("local_payload")
  serverPayload Json @map("server_payload")

  resolutionStatus   String  @map("resolution_status")
  resolutionStrategy String? @map("resolution_strategy")

  resolvedBy String?   @map("resolved_by")
  resolvedAt DateTime? @map("resolved_at")

  remarks String?

  createdAt DateTime @default(now()) @map("created_at")

  version Int @default(1)

  syncLog SyncLog @relation(fields: [syncLogId], references: [id])

  @@index([syncLogId])
  @@index([entityType, entityUuid])
  @@index([resolutionStatus])
  @@index([conflictType])
  @@index([resolvedAt])
}
```

> **PostgreSQL (JPA) note:** Map `localPayload` and `serverPayload` to `JSONB` in the cloud entity. Prisma uses `Json` (TEXT in SQLite). Do not use `@db.JsonB` in the shared Prisma schema.

---

## Notes

- Stores only **conflicted synchronization records**.
- Sync identity uses **`entityUuid`**, never local autoincrement `id`.
- Both payloads should remain unchanged until the conflict is resolved.
- Manual conflict resolution should be available for business-critical entities such as SalesInvoice, Stock, and Payment.
- Every conflict resolution should be fully auditable.
- Historical conflict records should never be deleted.
