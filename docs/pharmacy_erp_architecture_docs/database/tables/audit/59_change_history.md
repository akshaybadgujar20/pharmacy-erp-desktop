# ChangeHistory

## Purpose

The ChangeHistory table stores **field-level changes** made to business entities within the Pharmacy ERP.

Unlike **AuditLog**, which records *who performed an action*, ChangeHistory records **exactly what data changed**, including old values and new values.

It enables:

- Regulatory compliance
- Complete audit trail
- Data recovery
- Troubleshooting
- Historical record reconstruction
- Forensic investigation

Every UPDATE operation may generate one or more ChangeHistory records.

---

## Business Rules

- Every ChangeHistory record belongs to one AuditLog.
- Every record references one business entity.
- Each record tracks exactly one field change.
- Old Value and New Value must be preserved.
- ChangeHistory records are immutable.
- Records must never be physically deleted.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
AuditLog
    │
    └────────< ChangeHistory
                    │
                    ├────────► Party
                    ├────────► Medicine
                    ├────────► Batch
                    ├────────► Stock
                    ├────────► SalesInvoice
                    ├────────► PurchaseInvoice
                    └────────► Configuration
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Foreign Key | auditLogId | INTEGER | BIGINT | No | References AuditLog.id |
| Business | entityType | TEXT | VARCHAR(100) | No | Entity name |
| Business | entityId | INTEGER | BIGINT | No | Local business entity ID (not synced) |
| Business | entityUuid | TEXT | UUID | Yes | Global business entity UUID (sync-safe reference) |
| Business | fieldName | TEXT | VARCHAR(100) | No | Modified field name |
| Business | oldValue | TEXT | TEXT | Yes | Previous value |
| Business | newValue | TEXT | TEXT | Yes | Updated value |
| Business | dataType | TEXT | VARCHAR(30) | Yes | STRING, NUMBER, DATE, BOOLEAN, JSON |
| Business | changeType | TEXT | VARCHAR(20) | No | CREATE, UPDATE, DELETE |
| Audit | changedAt | DATETIME | TIMESTAMP | No | Change timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- Foreign Key (auditLogId → AuditLog.id)
- CHECK (changeType IN ('CREATE','UPDATE','DELETE'))
- CHECK (dataType IN ('STRING','NUMBER','DATE','BOOLEAN','JSON') OR dataType IS NULL)
- CHECK (version >= 1)

---

## Indexes

- PK_ChangeHistory
- UK_ChangeHistory_UUID
- IDX_ChangeHistory_AuditLog
- IDX_ChangeHistory_Entity
- IDX_ChangeHistory_EntityUuid
- IDX_ChangeHistory_Field
- IDX_ChangeHistory_ChangedAt

---

## Sample Records

| id | entityType | entityId | fieldName | oldValue | newValue |
|----|------------|---------:|-----------|----------|----------|
| 1 | Medicine | 101 | salePrice | 145.00 | 150.00 |
| 2 | Customer | 205 | mobileNumber | 9876543210 | 9876543211 |
| 3 | Batch | 502 | expiryDate | 2027-06-30 | 2027-09-30 |

---

## Prisma Model

```prisma
model ChangeHistory {
  id            BigInt   @id @default(autoincrement())

  uuid          String   @unique @default(uuid())

  auditLogId    BigInt

  entityType    String
  entityId      BigInt
  entityUuid    String?

  fieldName     String

  oldValue      String?
  newValue      String?

  dataType      String?

  changeType    String

  changedAt     DateTime @default(now())

  version       Int      @default(1)

  auditLog      AuditLog @relation(fields: [auditLogId], references: [id])

  @@index([auditLogId])
  @@index([entityType, entityId])
  @@index([entityType, entityUuid])
  @@index([fieldName])
  @@index([changedAt])
}
```

---

## Notes

- Stores **field-level modifications** only.
- One UPDATE affecting multiple fields creates multiple ChangeHistory records.
- CREATE operations may store only `newValue`.
- DELETE operations may store only `oldValue`.
- Large JSON fields should be truncated or stored separately if required for performance.
- Historical records should never be updated or deleted.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
