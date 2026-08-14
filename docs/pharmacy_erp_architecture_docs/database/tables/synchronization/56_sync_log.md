# SyncLog

## Purpose

The SyncLog table records the execution history of every synchronization session between the local SQLite database and the cloud PostgreSQL server.

Unlike the Outbox table, which stores pending changes, SyncLog records synchronization metadata, performance statistics, execution status, and errors for monitoring and troubleshooting.

Each synchronization attempt creates one SyncLog record.

---

## Business Rules

- Every synchronization session creates one SyncLog record.
- A SyncLog may process multiple Outbox records.
- Sync status is updated throughout the synchronization lifecycle.
- Completed logs are immutable.
- Failed synchronizations retain complete error details.
- Sync logs are retained for audit and troubleshooting.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.

---

## Relationships

```
Synchronization Service
          │
          ▼
      SyncLog
          │
          ├────────► Outbox
          └────────► SyncConflict
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Unique synchronization session identifier |
| Business | syncType | TEXT | VARCHAR(20) | No | FULL, INCREMENTAL, MANUAL, STARTUP |
| Business | syncDirection | TEXT | VARCHAR(20) | No | UPLOAD, DOWNLOAD, BIDIRECTIONAL |
| Business | startedAt | DATETIME | TIMESTAMP | No | Synchronization start time |
| Business | completedAt | DATETIME | TIMESTAMP | Yes | Synchronization completion time |
| Statistics | recordsUploaded | INTEGER | INTEGER | No | Number of uploaded records |
| Statistics | recordsDownloaded | INTEGER | INTEGER | No | Number of downloaded records |
| Statistics | conflictsDetected | INTEGER | INTEGER | No | Number of conflicts detected |
| Statistics | failedRecords | INTEGER | INTEGER | No | Number of failed records |
| Status | status | TEXT | VARCHAR(20) | No | RUNNING, SUCCESS, PARTIAL_SUCCESS, FAILED |
| Business | errorMessage | TEXT | TEXT | Yes | Error details if synchronization fails |
| Business | deviceId | TEXT | VARCHAR(100) | Yes | Client device identifier |
| Business | appVersion | TEXT | VARCHAR(30) | Yes | Client application version |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- CHECK (syncType IN ('FULL','INCREMENTAL','MANUAL','STARTUP'))
- CHECK (syncDirection IN ('UPLOAD','DOWNLOAD','BIDIRECTIONAL'))
- CHECK (status IN ('RUNNING','SUCCESS','PARTIAL_SUCCESS','FAILED'))
- CHECK (recordsUploaded >= 0)
- CHECK (recordsDownloaded >= 0)
- CHECK (conflictsDetected >= 0)
- CHECK (failedRecords >= 0)
- CHECK (version >= 1)

---

## Indexes

- PK_SyncLog
- UK_SyncLog_UUID
- IDX_SyncLog_Status
- IDX_SyncLog_StartedAt
- IDX_SyncLog_Type
- IDX_SyncLog_Direction
- IDX_SyncLog_Device

---

## Sample Records

| id | syncType | syncDirection | status | recordsUploaded | recordsDownloaded |
|----|----------|---------------|---------|----------------:|------------------:|
| 1 | INCREMENTAL | BIDIRECTIONAL | SUCCESS | 15 | 22 |
| 2 | STARTUP | DOWNLOAD | SUCCESS | 0 | 350 |
| 3 | MANUAL | UPLOAD | FAILED | 5 | 0 |

---

## Prisma Model

```prisma
model SyncLog {
  id                   BigInt   @id @default(autoincrement())

  uuid                 String   @unique @db.Uuid

  syncType             String
  syncDirection        String

  startedAt            DateTime
  completedAt          DateTime?

  recordsUploaded      Int      @default(0)
  recordsDownloaded    Int      @default(0)

  conflictsDetected    Int      @default(0)
  failedRecords        Int      @default(0)

  status               String

  errorMessage         String?

  deviceId             String?
  appVersion           String?

  createdAt            DateTime @default(now())

  version              Int      @default(1)

  @@index([status])
  @@index([startedAt])
  @@index([syncType])
  @@index([syncDirection])
  @@index([deviceId])
}
```

---

## Notes

- Stores synchronization **session history**, not business data.
- One SyncLog represents one synchronization execution.
- The Synchronization Service should update this record as synchronization progresses.
- Error messages should contain only technical details; sensitive business data should not be stored.
- SyncLog should reference related SyncConflict records through the synchronization session.
- Old logs may be archived according to retention policies.
- Supports offline-first synchronization using SQLite clients and PostgreSQL servers.
- Compatible with both SQLite and PostgreSQL.
