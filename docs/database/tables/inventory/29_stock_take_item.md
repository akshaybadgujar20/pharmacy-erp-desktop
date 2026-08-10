# StockTakeItem

## Purpose

The StockTakeItem table stores the individual medicine batches counted during a Stock Take.

Each record compares the **system quantity** with the **physically counted quantity** and calculates the inventory variance. After approval, variances are converted into Stock Adjustment transactions.

---

## Business Rules

- Every StockTakeItem belongs to exactly one StockTake.
- Every StockTakeItem references exactly one Batch.
- A Batch can appear only once in a StockTake.
- System Quantity is captured when the Stock Take begins.
- Physical Quantity is entered by the employee performing the count.
- Variance is automatically calculated.
- Approved variances generate StockAdjustment records.
- StockTakeItems become read-only after StockTake approval.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
StockTake (1)
      │
      └──────< StockTakeItem (Many)
                     │
                     ├────────► Batch
                     ├────────► Stock
                     └────────► StockAdjustmentItem
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Foreign Key | stockTakeId | INTEGER | BIGINT | No | References StockTake.id |
| Foreign Key | batchId | INTEGER | BIGINT | No | References Batch.id |
| Quantity | systemQuantity | REAL | NUMERIC(14,3) | No | Quantity recorded in the system |
| Quantity | physicalQuantity | REAL | NUMERIC(14,3) | No | Quantity counted physically |
| Quantity | varianceQuantity | REAL | NUMERIC(14,3) | No | Physical - System quantity |
| Business | varianceType | TEXT | VARCHAR(20) | No | SHORTAGE, EXCESS, MATCH |
| Business | remarks | TEXT | TEXT | Yes | Counting remarks |
| Status | isReconciled | INTEGER | BOOLEAN | No | Indicates adjustment has been generated |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Normally unused |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Foreign Key (stockTakeId → StockTake.id)
- Foreign Key (batchId → Batch.id)
- Unique (uuid)
- Unique (stockTakeId, batchId)
- CHECK (systemQuantity >= 0)
- CHECK (physicalQuantity >= 0)
- CHECK (varianceType IN ('MATCH','SHORTAGE','EXCESS'))
- CHECK (version >= 1)

---

## Indexes

- PK_StockTakeItem (id)
- UK_StockTakeItem_UUID
- UK_StockTakeItem_StockTake_Batch
- IDX_StockTakeItem_StockTake
- IDX_StockTakeItem_Batch
- IDX_StockTakeItem_VarianceType
- IDX_StockTakeItem_Reconciled

---

## Sample Records

| id | stockTakeId | batchId | systemQuantity | physicalQuantity | varianceQuantity | varianceType |
|----|-------------|---------|---------------:|-----------------:|-----------------:|---------------|
| 1 | 1 | 101 | 120.000 | 120.000 | 0.000 | MATCH |
| 2 | 1 | 102 | 75.000 | 72.000 | -3.000 | SHORTAGE |
| 3 | 1 | 103 | 50.000 | 55.000 | 5.000 | EXCESS |

---

## Prisma Model

```prisma
model StockTakeItem {
  id                 BigInt   @id @default(autoincrement())

  uuid               String   @unique @db.Uuid

  stockTakeId        BigInt
  batchId            BigInt

  systemQuantity     Decimal  @db.Decimal(14,3)
  physicalQuantity   Decimal  @db.Decimal(14,3)
  varianceQuantity   Decimal  @db.Decimal(14,3)

  varianceType       String

  remarks            String?

  isReconciled       Boolean  @default(false)

  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  deletedAt          DateTime?

  version            Int      @default(1)

  stockTake          StockTake @relation(fields: [stockTakeId], references: [id])
  batch              Batch     @relation(fields: [batchId], references: [id])

  @@unique([stockTakeId, batchId])

  @@index([stockTakeId])
  @@index([batchId])
  @@index([varianceType])
  @@index([isReconciled])
}
```

---

## Notes

- This is the **detail (line item) table** for the StockTake document.
- `systemQuantity` should be captured when the stock take begins to prevent changes caused by later inventory transactions.
- `varianceQuantity` should be calculated automatically as:

  `varianceQuantity = physicalQuantity - systemQuantity`

- A positive variance indicates **EXCESS** stock.
- A negative variance indicates **SHORTAGE** stock.
- A zero variance indicates **MATCH**.
- Once approved, each non-zero variance should generate a corresponding **StockAdjustmentItem**, which in turn creates the required **StockMovement** records.
- Historical stock take details should never be deleted.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
