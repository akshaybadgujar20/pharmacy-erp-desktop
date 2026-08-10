# SalesReturnItem

## Purpose

The SalesReturnItem table stores the individual medicines returned by customers as part of a Sales Return document.

Each record represents one medicine batch being returned and contains the returned quantity, pricing, tax information, and inventory disposition.

After approval, the system determines whether the returned medicine should:

- Return to saleable inventory
- Be marked as damaged
- Be marked as expired
- Be quarantined
- Be held for manufacturer recall

---

## Business Rules

- Every SalesReturnItem belongs to exactly one SalesReturn.
- Every SalesReturnItem references exactly one SalesInvoiceItem.
- Every SalesReturnItem references exactly one Batch.
- Return Quantity must be greater than zero.
- Return Quantity cannot exceed the quantity originally sold.
- Returned Batch must match the original sold batch.
- Inventory disposition must be determined before stock update.
- Approved return items become read-only.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
SalesReturn (1)
      │
      └──────< SalesReturnItem (Many)
                     │
                     ├────────► SalesInvoiceItem
                     ├────────► Medicine
                     ├────────► Batch
                     ├────────► UnitOfMeasure
                     ├────────► StockMovement
                     └────────► StockAdjustment
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Foreign Key | salesReturnId | INTEGER | BIGINT | No | References SalesReturn.id |
| Foreign Key | salesInvoiceItemId | INTEGER | BIGINT | No | References SalesInvoiceItem.id |
| Foreign Key | medicineId | INTEGER | BIGINT | No | References Medicine.id |
| Foreign Key | batchId | INTEGER | BIGINT | No | References Batch.id |
| Foreign Key | unitId | INTEGER | BIGINT | No | References UnitOfMeasure.id |
| Business | lineNumber | INTEGER | INTEGER | No | Line sequence number |
| Quantity | returnQuantity | REAL | NUMERIC(14,3) | No | Returned quantity |
| Pricing | unitPrice | REAL | NUMERIC(12,2) | No | Original selling price |
| Pricing | discountAmount | REAL | NUMERIC(12,2) | No | Discount amount |
| Pricing | taxAmount | REAL | NUMERIC(12,2) | No | Tax amount |
| Financial | lineAmount | REAL | NUMERIC(14,2) | No | Return value |
| Business | returnReason | TEXT | TEXT | No | Reason for return |
| Business | disposition | TEXT | VARCHAR(20) | No | SALEABLE, DAMAGED, EXPIRED, RECALL, QUARANTINE |
| Business | remarks | TEXT | TEXT | Yes | Item remarks |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Foreign Key (salesReturnId → SalesReturn.id)
- Foreign Key (salesInvoiceItemId → SalesInvoiceItem.id)
- Foreign Key (medicineId → Medicine.id)
- Foreign Key (batchId → Batch.id)
- Foreign Key (unitId → UnitOfMeasure.id)
- Unique (uuid)
- CHECK (returnQuantity > 0)
- CHECK (unitPrice >= 0)
- CHECK (lineAmount >= 0)
- CHECK (disposition IN ('SALEABLE','DAMAGED','EXPIRED','RECALL','QUARANTINE'))
- CHECK (version >= 1)

---

## Indexes

- PK_SalesReturnItem
- UK_SalesReturnItem_UUID
- IDX_SalesReturnItem_Return
- IDX_SalesReturnItem_InvoiceItem
- IDX_SalesReturnItem_Batch
- IDX_SalesReturnItem_Medicine
- IDX_SalesReturnItem_Disposition
- IDX_SalesReturnItem_LineNumber

---

## Sample Records

| id | salesReturnId | lineNumber | medicineId | batchId | returnQuantity | disposition | lineAmount |
|----|--------------:|-----------:|-----------:|--------:|---------------:|-------------|-----------:|
| 1 | 1 | 1 | 101 | 501 | 2.000 | SALEABLE | 30.00 |
| 2 | 1 | 2 | 205 | 612 | 1.000 | DAMAGED | 145.00 |
| 3 | 2 | 1 | 310 | 730 | 5.000 | EXPIRED | 92.50 |

---

## Prisma Model

```prisma
model SalesReturnItem {
  id                  BigInt   @id @default(autoincrement())

  uuid                String   @unique @db.Uuid

  salesReturnId       BigInt
  salesInvoiceItemId  BigInt

  medicineId          BigInt
  batchId             BigInt
  unitId              BigInt

  lineNumber          Int

  returnQuantity      Decimal  @db.Decimal(14,3)

  unitPrice           Decimal  @db.Decimal(12,2)

  discountAmount      Decimal  @default(0) @db.Decimal(12,2)
  taxAmount           Decimal  @default(0) @db.Decimal(12,2)

  lineAmount          Decimal  @db.Decimal(14,2)

  returnReason        String
  disposition         String

  remarks             String?

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  deletedAt           DateTime?

  version             Int      @default(1)

  salesReturn         SalesReturn      @relation(fields: [salesReturnId], references: [id])
  salesInvoiceItem    SalesInvoiceItem @relation(fields: [salesInvoiceItemId], references: [id])
  medicine            Medicine         @relation(fields: [medicineId], references: [id])
  batch               Batch            @relation(fields: [batchId], references: [id])
  unit                UnitOfMeasure    @relation(fields: [unitId], references: [id])

  @@index([salesReturnId])
  @@index([salesInvoiceItemId])
  @@index([batchId])
  @@index([medicineId])
  @@index([disposition])
  @@index([lineNumber])
}
```

---

## Notes

- This is the **detail (line item)** table for the Sales Return document.
- Every return item should reference the original **SalesInvoiceItem** to ensure complete traceability.
- The returned **Batch** must match the batch originally sold to maintain regulatory compliance.
- Posting a Sales Return Item should:
  - Validate that the returned quantity does not exceed the remaining returnable quantity.
  - Determine the inventory disposition.
  - Create an **IN** StockMovement for saleable items.
  - Create a **StockAdjustment** for damaged, expired, recalled, or quarantined items.
  - Update the Stock table accordingly.
- Historical Sales Return Items should never be deleted after approval.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
