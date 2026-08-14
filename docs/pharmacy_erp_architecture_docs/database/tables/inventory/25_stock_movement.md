# StockMovement

## Purpose

The StockMovement table is the **inventory transaction ledger** of the Pharmacy ERP.

Every inventory change must create exactly one StockMovement record.

This table provides a complete audit trail of inventory transactions and is the source of truth for stock reconciliation.

Typical transactions include:

- Purchase Receipt
- Sales
- Sales Return
- Purchase Return
- Stock Adjustment
- Stock Transfer
- Stock Take
- Expired Stock Disposal
- Damaged Stock

---

## Business Rules

- Every StockMovement belongs to exactly one Batch.
- Every inventory transaction must generate one StockMovement record.
- StockMovement records are immutable and must never be edited or deleted.
- Stock balances are derived by applying StockMovements.
- Movement Quantity must always be positive.
- IN and OUT direction determines whether quantity is added or deducted.
- Reference Table and Reference Id must identify the originating business transaction.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Batch (1)
     │
     └──────< StockMovement (Many)
                    │
                    ├── PurchaseInvoiceItem
                    ├── SalesInvoiceItem
                    ├── PurchaseReturnItem
                    ├── SalesReturnItem
                    ├── StockAdjustment
                    ├── StockTransfer
                    └── StockTakeItem
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Foreign Key | batchId | INTEGER | BIGINT | No | References Batch.id |
| Business | movementNumber | TEXT | VARCHAR(30) | No | Unique movement number |
| Business | movementType | TEXT | VARCHAR(30) | No | PURCHASE, SALE, RETURN, ADJUSTMENT, TRANSFER, STOCK_TAKE |
| Business | movementDirection | TEXT | VARCHAR(10) | No | IN or OUT |
| Quantity | quantity | REAL | NUMERIC(14,3) | No | Movement quantity |
| Quantity | balanceAfter | REAL | NUMERIC(14,3) | No | Stock balance after transaction |
| Reference | referenceTable | TEXT | VARCHAR(50) | No | Source table name |
| Reference | referenceId | INTEGER | BIGINT | No | Source record ID |
| Business | movementDate | DATETIME | TIMESTAMP | No | Transaction date/time |
| Business | remarks | TEXT | TEXT | Yes | Additional remarks |
| Audit | createdBy | INTEGER | BIGINT | Yes | Employee/User performing transaction |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Normally unused |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Foreign Key (batchId → Batch.id)
- Unique (uuid)
- Unique (movementNumber)
- CHECK (quantity > 0)
- CHECK (movementDirection IN ('IN','OUT'))
- CHECK (movementType IN ('PURCHASE','SALE','SALES_RETURN','PURCHASE_RETURN','ADJUSTMENT','TRANSFER_IN','TRANSFER_OUT','STOCK_TAKE','EXPIRED','DAMAGED'))
- CHECK (version >= 1)

---

## Indexes

- PK_StockMovement (id)
- UK_StockMovement_UUID
- UK_StockMovement_Number
- IDX_StockMovement_Batch
- IDX_StockMovement_Type
- IDX_StockMovement_Date
- IDX_StockMovement_Reference

---

## Sample Records

| id | movementNumber | batchId | movementType | movementDirection | quantity | balanceAfter |
|----|----------------|---------|--------------|-------------------|---------:|-------------:|
| 1 | SM000001 | 1 | PURCHASE | IN | 100.000 | 100.000 |
| 2 | SM000002 | 1 | SALE | OUT | 12.000 | 88.000 |
| 3 | SM000003 | 1 | SALES_RETURN | IN | 2.000 | 90.000 |
| 4 | SM000004 | 1 | ADJUSTMENT | OUT | 1.000 | 89.000 |

---

## Prisma Model

```prisma
model StockMovement {
  id                 BigInt   @id @default(autoincrement())

  uuid               String   @unique @db.Uuid

  batchId            BigInt

  movementNumber     String   @unique

  movementType       String
  movementDirection  String

  quantity           Decimal  @db.Decimal(14,3)
  balanceAfter       Decimal  @db.Decimal(14,3)

  referenceTable     String
  referenceId        BigInt

  movementDate       DateTime

  remarks            String?

  createdBy          BigInt?

  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  deletedAt          DateTime?

  version            Int      @default(1)

  batch              Batch    @relation(fields: [batchId], references: [id])

  @@index([batchId])
  @@index([movementType])
  @@index([movementDate])
  @@index([referenceTable, referenceId])
}
```

---

## Notes

- This is the **inventory ledger** and the source of truth for all inventory transactions.
- Records should be **append-only**; corrections must be made using new StockMovement entries rather than updating existing records.
- The Stock table should always be updated based on StockMovement records.
- Supports complete inventory traceability for audits, recalls, and statutory compliance.
- Enables reconstruction of stock balances at any historical point in time.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
