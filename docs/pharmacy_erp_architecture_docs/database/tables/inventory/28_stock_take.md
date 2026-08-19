# StockTake

## Purpose

The StockTake table represents a physical inventory counting session.

It is the **header/master document** for stock verification. During a stock take, the system records the expected quantities from inventory, while users enter the physical quantities counted. Any differences are reconciled through StockAdjustment after approval.

Typical scenarios include:

- Daily cycle count
- Weekly stock verification
- Monthly stock audit
- Annual inventory audit
- Surprise inventory inspection

---

## Business Rules

- Every Stock Take must have one or more StockTakeItems.
- A Stock Take is performed for a Branch/Warehouse.
- Only one active Stock Take can exist for the same location at a time.
- Once completed, Stock Take becomes read-only.
- Inventory is **not** updated directly from Stock Take.
- Approved variances generate StockAdjustment records.
- StockTake records must never be deleted for audit purposes.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Branch / Warehouse
        │
        ▼
   StockTake
        │
        ├──────< StockTakeItem
        │
        └────────► StockAdjustment
                       │
                       ▼
                 StockMovement
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Business | stockTakeNumber | TEXT | VARCHAR(30) | No | Unique stock take document number |
| Foreign Key | branchId | INTEGER | BIGINT | No | Branch or warehouse being counted |
| Business | stockTakeDate | DATETIME | TIMESTAMP | No | Date of physical stock count |
| Business | countType | TEXT | VARCHAR(20) | No | FULL, CYCLE, RANDOM |
| Status | status | TEXT | VARCHAR(20) | No | DRAFT, IN_PROGRESS, COMPLETED, APPROVED, CANCELLED |
| Foreign Key | countedByEmployeeId | INTEGER | BIGINT | No | Employee performing count |
| Foreign Key | approvedByEmployeeId | INTEGER | BIGINT | Yes | Employee approving stock take |
| Business | approvedAt | DATETIME | TIMESTAMP | Yes | Approval timestamp |
| Business | remarks | TEXT | TEXT | Yes | General remarks |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Normally unused |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- Unique (stockTakeNumber)
- Foreign Key (branchId → Branch.id)
- Foreign Key (countedByEmployeeId → Employee.id)
- Foreign Key (approvedByEmployeeId → Employee.id)
- CHECK (countType IN ('FULL','CYCLE','RANDOM'))
- CHECK (status IN ('DRAFT','IN_PROGRESS','COMPLETED','APPROVED','CANCELLED'))
- CHECK (version >= 1)

---

## Indexes

- PK_StockTake (id)
- UK_StockTake_UUID
- UK_StockTake_Number
- IDX_StockTake_Branch
- IDX_StockTake_Date
- IDX_StockTake_Status
- IDX_StockTake_CountType

---

## Sample Records

| id | stockTakeNumber | branchId | stockTakeDate | countType | status |
|----|-----------------|----------|---------------|-----------|--------|
| 1 | STK000001 | 1 | 2026-08-01 | FULL | APPROVED |
| 2 | STK000002 | 1 | 2026-08-10 | CYCLE | IN_PROGRESS |
| 3 | STK000003 | 2 | 2026-08-15 | RANDOM | DRAFT |

---

## Prisma Model

```prisma
model StockTake {
  id                    BigInt   @id @default(autoincrement())

  uuid                  String   @unique 

  stockTakeNumber       String   @unique

  branchId              BigInt

  stockTakeDate         DateTime

  countType             String
  status                String

  countedByEmployeeId   BigInt
  approvedByEmployeeId  BigInt?

  approvedAt            DateTime?

  remarks               String?

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  deletedAt             DateTime?

  version               Int      @default(1)

  countedBy             Employee  @relation("StockTakeCounter", fields: [countedByEmployeeId], references: [id])
  approvedBy            Employee? @relation("StockTakeApprover", fields: [approvedByEmployeeId], references: [id])

  items                 StockTakeItem[]

  @@index([branchId])
  @@index([stockTakeDate])
  @@index([status])
  @@index([countType])
}
```

---

## Notes

- This is the **header table** for physical inventory counting.
- Individual medicine counts are stored in the **StockTakeItem** table.
- Completing a Stock Take does **not** directly modify inventory.
- Inventory differences should be converted into **StockAdjustment** documents after approval.
- Historical stock take records should be retained permanently for audit and compliance.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
