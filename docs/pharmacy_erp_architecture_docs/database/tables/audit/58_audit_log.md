# AuditLog

## Purpose

The AuditLog table records every significant action performed within the Pharmacy ERP.

It provides a complete audit trail of user activities, business transactions, security events, and system operations. Unlike **ChangeHistory**, which records field-level data changes, AuditLog records **who performed what action, when, where, and why**.

Typical audited events include:

- User Login / Logout
- Record Creation
- Record Update
- Record Deletion
- Approval / Rejection
- Stock Adjustment
- Sales Posting
- Purchase Posting
- Synchronization
- Configuration Changes

---

## Business Rules

- Every auditable action creates one AuditLog record.
- Audit records are immutable after creation.
- Audit records must never be physically deleted.
- Every audit record should identify the acting user.
- Every audit record should reference the affected business entity.
- Security events should always be audited.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
User
   │
   ▼
AuditLog
   │
   ├────────► Party
   ├────────► Medicine
   ├────────► SalesInvoice
   ├────────► PurchaseInvoice
   ├────────► StockMovement
   ├────────► Configuration
   └────────► ChangeHistory
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Foreign Key | userId | INTEGER | BIGINT | Yes | User performing the action |
| Business | entityType | TEXT | VARCHAR(100) | No | Business entity name |
| Business | entityId | INTEGER | BIGINT | Yes | Business entity ID |
| Business | action | TEXT | VARCHAR(30) | No | CREATE, UPDATE, DELETE, LOGIN, LOGOUT, APPROVE, POST |
| Business | module | TEXT | VARCHAR(50) | No | ERP module |
| Business | description | TEXT | TEXT | Yes | Human-readable description |
| Security | ipAddress | TEXT | VARCHAR(45) | Yes | Client IP address |
| Security | deviceId | TEXT | VARCHAR(100) | Yes | Client device identifier |
| Security | sessionId | TEXT | VARCHAR(100) | Yes | User session identifier |
| Audit | actionTimestamp | DATETIME | TIMESTAMP | No | Action timestamp |
| Audit | correlationId | TEXT | UUID | Yes | Request/transaction correlation ID |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- CHECK (action IN ('CREATE','UPDATE','DELETE','LOGIN','LOGOUT','APPROVE','REJECT','POST','SYNC'))
- CHECK (version >= 1)

---

## Indexes

- PK_AuditLog
- UK_AuditLog_UUID
- IDX_AuditLog_User
- IDX_AuditLog_Entity
- IDX_AuditLog_Action
- IDX_AuditLog_Module
- IDX_AuditLog_Timestamp
- IDX_AuditLog_Correlation

---

## Sample Records

| id | userId | entityType | entityId | action | module | actionTimestamp |
|----|-------:|------------|---------:|--------|--------|-----------------|
| 1 | 10 | SalesInvoice | 501 | CREATE | Sales | 2026-08-04 10:15 |
| 2 | 10 | SalesInvoice | 501 | POST | Sales | 2026-08-04 10:17 |
| 3 | 15 | User | 15 | LOGIN | Security | 2026-08-04 09:00 |

---

## Prisma Model

```prisma
model AuditLog {
  id                BigInt   @id @default(autoincrement())

  uuid              String   @unique @db.Uuid

  userId            BigInt?

  entityType        String
  entityId          BigInt?

  action            String
  module            String

  description       String?

  ipAddress         String?
  deviceId          String?
  sessionId         String?

  actionTimestamp   DateTime

  correlationId     String?  @db.Uuid

  createdAt         DateTime @default(now())

  version           Int      @default(1)

  user              User?    @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([entityType, entityId])
  @@index([action])
  @@index([module])
  @@index([actionTimestamp])
  @@index([correlationId])
}
```

---

## Notes

- Records **who performed the action**, **what action occurred**, **when it occurred**, and **where it originated**.
- Stores operational audit information rather than field-level value changes.
- Field-level modifications should be stored in **ChangeHistory**.
- AuditLog entries should be created automatically by middleware or interceptors rather than business logic.
- Audit records should be retained according to regulatory requirements.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
