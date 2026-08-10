# SyncConflict

## Purpose

The SyncConflict table records data conflicts detected during synchronization between the local SQLite database and the cloud PostgreSQL server.

A conflict occurs when the same business record has been modified on both the client and the server before synchronization.

The table preserves both versions of the data and records how the conflict was resolved.

---

## Business Rules

- Every conflict belongs to one synchronization session.
- Every conflict references one business entity.
- Both Local and Server versions must be preserved until resolution.
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
    └────────< SyncConflict
                    │
                    ├────────► Outbox
                    └────────► Business Entity
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Foreign Key | syncLogId | INTEGER | BIGINT | No | References SyncLog.id |
| Business | entityType | TEXT | VARCHAR(100) | No | Entity name (Medicine, Customer, SalesInvoice, etc.) |
| Business | entityId | INTEGER | BIGINT | No | Business entity ID |
| Business | conflictType | TEXT | VARCHAR(30) | No | UPDATE_UPDATE, DELETE_UPDATE, DELETE_DELETE, VERSION_MISMATCH |
| Business | localPayload | TEXT | JSONB | No | Local version of the record |
| Business | serverPayload | TEXT | JSONB | No | Server version of the record |
| Status | resolutionStatus | TEXT | VARCHAR(20) | No | PENDING, AUTO_RESOLVED, MANUAL_RESOLVED, IGNORED |
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
- CHECK (conflictType IN ('UPDATE_UPDATE','DELETE_UPDATE','DELETE_DELETE','VERSION_MISMATCH'))
- CHECK (resolutionStatus IN ('PENDING','AUTO_RESOLVED','MANUAL_RESOLVED','IGNORED'))
- CHECK (resolutionStrategy IS NULL OR resolutionStrategy IN ('SERVER_WINS','CLIENT_WINS','MERGED','MANUAL'))
- CHECK (version >= 1)

---

## Indexes

- PK_SyncConflict
- UK_SyncConflict_UUID
- IDX_SyncConflict_SyncLog
- IDX_SyncConflict_Entity
- IDX_SyncConflict_Status
- IDX_SyncConflict_Type
- IDX_SyncConflict_ResolvedAt

---

## Sample Records

| id | entityType | entityId | conflictType | resolutionStatus | resolutionStrategy |
|----|------------|---------:|--------------|------------------|--------------------|
| 1 | Customer | 125 | UPDATE_UPDATE | AUTO_RESOLVED | SERVER_WINS |
| 2 | SalesInvoice | 502 | VERSION_MISMATCH | PENDING | NULL |
| 3 | Medicine | 45 | DELETE_UPDATE | MANUAL_RESOLVED | CLIENT_WINS |

---

## Prisma Model

```prisma
model SyncConflict {
  id                   BigInt   @id @default(autoincrement())

  uuid                 String   @unique @db.Uuid

  syncLogId            BigInt

  entityType           String
  entityId             BigInt

  conflictType         String

  localPayload         Json
  serverPayload        Json

  resolutionStatus     String

  resolutionStrategy   String?

  resolvedBy           String?
  resolvedAt           DateTime?

  remarks              String?

  createdAt            DateTime @default(now())

  version              Int      @default(1)

  syncLog              SyncLog @relation(fields: [syncLogId], references: [id])

  @@index([syncLogId])
  @@index([entityType, entityId])
  @@index([resolutionStatus])
  @@index([conflictType])
  @@index([resolvedAt])
}
```

---

## Notes

- Stores only **conflicted synchronization records**.
- Both local and server payloads should remain unchanged until the conflict is resolved.
- Automatic resolution rules should handle common cases (e.g., Last Modified Wins or Server Wins).
- Manual conflict resolution should be available for business-critical entities such as SalesInvoice, Stock, and Payment.
- Every conflict resolution should be fully auditable.
- Historical conflict records should never be deleted.
- Supports offline-first synchronization using SQLite clients and PostgreSQL servers.
- Compatible with both SQLite and PostgreSQL.
