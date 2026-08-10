# StockAdjustment

## Purpose

The StockAdjustment table records manual corrections made to inventory when the physical stock differs from the system stock.

Adjustments are required for situations such as:

- Damaged medicines
- Expired medicines
- Lost or stolen stock
- Physical stock count differences
- Opening stock entry
- System correction
- Free samples
- Internal consumption

Every Stock Adjustment automatically generates one or more StockMovement records.

---

## Business Rules

- Every adjustment must contain at least one adjustment item.
- Every adjustment requires a valid adjustment reason.
- Adjustments should be approved according to company policy.
- Approved adjustments cannot be modified.
- Cancelling an adjustment should create a reversal StockMovement instead of deleting records.
- Every adjustment updates the Stock table through StockMovement.
- Soft delete should not be used for approved adjustments.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Employee
    │
    ▼
StockAdjustment
    │
    ├──────< StockAdjustmentItem
    │
    └────────────► StockMovement
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Business | adjustmentNumber | TEXT | VARCHAR(30) | No | Unique adjustment document number |
| Business | adjustmentType | TEXT | VARCHAR(30) | No | DAMAGE, EXPIRED, LOST, FOUND, OPENING, CORRECTION |
| Business | adjustmentDate | DATETIME | TIMESTAMP | No | Adjustment date |
| Business | reason | TEXT | TEXT | No | Reason for adjustment |
| Foreign Key | approvedByEmployeeId | INTEGER | BIGINT | Yes | Approving employee |
| Business | approvedAt | DATETIME | TIMESTAMP | Yes | Approval date |
| Status | status | TEXT | VARCHAR(20) | No | DRAFT, APPROVED, CANCELLED |
| Status | isActive | INTEGER | BOOLEAN | No | Active record |
| Audit | createdBy | INTEGER | BIGINT | Yes | Employee creating adjustment |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Normally unused |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- Unique (adjustmentNumber)
- Foreign Key (approvedByEmployeeId → Employee.id)
- CHECK (status IN ('DRAFT','APPROVED','CANCELLED'))
- CHECK (adjustmentType IN ('DAMAGE','EXPIRED','LOST','FOUND','OPENING','CORRECTION'))
- CHECK (version >= 1)

---

## Indexes

- PK_StockAdjustment (id)
- UK_StockAdjustment_UUID
- UK_StockAdjustment_Number
- IDX_StockAdjustment_Date
- IDX_StockAdjustment_Status
- IDX_StockAdjustment_Type
- IDX_StockAdjustment_ApprovedBy

---

## Sample Records

| id | adjustmentNumber | adjustmentType | adjustmentDate | status |
|----|------------------|----------------|----------------|---------|
| 1 | ADJ000001 | DAMAGE | 2026-08-01 | APPROVED |
| 2 | ADJ000002 | EXPIRED | 2026-08-02 | APPROVED |
| 3 | ADJ000003 | STOCK_COUNT | 2026-08-03 | DRAFT |

---

## Prisma Model

```prisma
model StockAdjustment {
  id                     BigInt   @id @default(autoincrement())

  uuid                   String   @unique @db.Uuid

  adjustmentNumber       String   @unique

  adjustmentType         String
  adjustmentDate         DateTime

  reason                 String

  approvedByEmployeeId   BigInt?
  approvedAt             DateTime?

  status                 String

  isActive               Boolean  @default(true)

  createdBy              BigInt?

  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt
  deletedAt              DateTime?

  version                Int      @default(1)

  approvedBy             Employee? @relation(fields: [approvedByEmployeeId], references: [id])

  items                  StockAdjustmentItem[]

  @@index([adjustmentDate])
  @@index([status])
  @@index([adjustmentType])
}
```

---

## Notes

- This is the **header table** for stock adjustments.
- Individual medicine adjustments should be stored in a separate **StockAdjustmentItem** table.
- Approval workflow should be enforced before inventory is updated.
- Every approved adjustment must automatically generate corresponding **StockMovement** records.
- Stock should never be updated directly from this table.
- Historical adjustments should be preserved for audit and compliance purposes.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
