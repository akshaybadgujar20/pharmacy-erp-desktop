# SyncLog

## Purpose

The SyncLog table records the execution history of every synchronization session between the local SQLite database and the cloud PostgreSQL server.

Unlike the Outbox table, which stores pending changes, SyncLog records synchronization metadata, performance statistics, execution status, and errors for monitoring and troubleshooting.

Each synchronization attempt creates one SyncLog record.

---

## Business Rules

- Every synchronization session creates one SyncLog record.
- A SyncLog may process multiple Outbox records.
- Sync status is updated throughout the synchronization lifecycle (String field, not enum).
- Completed logs are immutable.
- Failed synchronizations retain complete error details.
- `deviceId` identifies the client device that initiated the session.
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
          └────────< SyncConflict
```

---

## Columns

| Category | Column | SQLite | PostgreSQL (JPA) | Nullable | Description |
|----------|--------|---------|------------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID/TEXT | No | Unique synchronization session identifier |
| Business | syncType | TEXT | VARCHAR(20) | No | FULL, INCREMENTAL, MANUAL, STARTUP (String) |
| Business | syncDirection | TEXT | VARCHAR(20) | No | UPLOAD, DOWNLOAD, BIDIRECTIONAL (String) |
| Business | startedAt | DATETIME | TIMESTAMP | No | Synchronization start time |
| Business | completedAt | DATETIME | TIMESTAMP | Yes | Synchronization completion time |
| Statistics | recordsUploaded | INTEGER | INTEGER | No | Number of uploaded records |
| Statistics | recordsDownloaded | INTEGER | INTEGER | No | Number of downloaded records |
| Statistics | conflictsDetected | INTEGER | INTEGER | No | Number of conflicts detected |
| Statistics | failedRecords | INTEGER | INTEGER | No | Number of failed records |
| Status | status | TEXT | VARCHAR(20) | No | RUNNING, SUCCESS, PARTIAL_SUCCESS, FAILED (String) |
| Business | errorMessage | TEXT | TEXT | Yes | Error details if synchronization fails |
| Business | deviceId | TEXT | VARCHAR(100) | Yes | Client device identifier |
| Business | appVersion | TEXT | VARCHAR(30) | Yes | Client application version |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
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

| id | syncType | syncDirection | status | deviceId | recordsUploaded | recordsDownloaded |
|----|----------|---------------|---------|----------|----------------:|------------------:|
| 1 | INCREMENTAL | BIDIRECTIONAL | SUCCESS | DESK-001 | 15 | 22 |
| 2 | STARTUP | DOWNLOAD | SUCCESS | DESK-001 | 0 | 350 |
| 3 | MANUAL | UPLOAD | FAILED | DESK-002 | 5 | 0 |

---

## Prisma Model

```prisma
model SyncLog {
  id   BigInt @id @default(autoincrement())
  uuid String @unique @default(uuid())

  syncType      String @map("sync_type")
  syncDirection String @map("sync_direction")

  startedAt   DateTime  @map("started_at")
  completedAt DateTime? @map("completed_at")

  recordsUploaded   Int @default(0) @map("records_uploaded")
  recordsDownloaded Int @default(0) @map("records_downloaded")

  conflictsDetected Int @default(0) @map("conflicts_detected")
  failedRecords     Int @default(0) @map("failed_records")

  status String

  errorMessage String? @map("error_message")

  deviceId   String? @map("device_id")
  appVersion String? @map("app_version")

  createdAt DateTime @default(now()) @map("created_at")

  version Int @default(1)

  syncConflicts SyncConflict[]

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
- Related SyncConflict records reference `syncLogId`.
- Error messages should contain only technical details; sensitive business data should not be stored.
- Supports offline-first synchronization using SQLite clients and PostgreSQL servers.
