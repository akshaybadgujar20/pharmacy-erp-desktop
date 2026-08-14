# SalesInvoiceItem

## Purpose

The SalesInvoiceItem table stores the individual medicines sold in a Sales Invoice.

Each record represents one line item in the invoice and references the specific **Batch** from which the medicine was dispensed. This enables complete inventory traceability, FEFO compliance, expiry tracking, and accurate cost calculations.

Posting a Sales Invoice Item creates an **OUT StockMovement** and updates the Stock balance.

---

## Business Rules

- Every SalesInvoiceItem belongs to exactly one SalesInvoice.
- Every SalesInvoiceItem references one Medicine.
- Every SalesInvoiceItem references one Batch.
- Every SalesInvoiceItem references one Unit of Measure.
- Sold Quantity must be greater than zero.
- Sold Quantity cannot exceed available stock.
- Batch must not be expired unless explicitly permitted.
- Sale price is captured at the time of sale and remains immutable after posting.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
SalesInvoice (1)
      │
      └──────< SalesInvoiceItem (Many)
                    │
                    ├────────► Medicine
                    ├────────► Batch
                    ├────────► UnitOfMeasure
                    ├────────► StockMovement
                    └────────► Tax
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Foreign Key | salesInvoiceId | INTEGER | BIGINT | No | References SalesInvoice.id |
| Foreign Key | medicineId | INTEGER | BIGINT | No | References Medicine.id |
| Foreign Key | batchId | INTEGER | BIGINT | No | References Batch.id |
| Foreign Key | unitId | INTEGER | BIGINT | No | References UnitOfMeasure.id |
| Business | lineNumber | INTEGER | INTEGER | No | Line sequence number |
| Quantity | soldQuantity | REAL | NUMERIC(14,3) | No | Quantity sold |
| Pricing | unitPrice | REAL | NUMERIC(12,2) | No | Selling price per unit |
| Pricing | discountPercent | REAL | NUMERIC(5,2) | Yes | Discount percentage |
| Pricing | discountAmount | REAL | NUMERIC(12,2) | No | Discount amount |
| Pricing | taxPercent | REAL | NUMERIC(5,2) | Yes | Tax percentage |
| Pricing | taxAmount | REAL | NUMERIC(12,2) | No | Tax amount |
| Financial | lineAmount | REAL | NUMERIC(14,2) | No | Net line amount |
| Business | remarks | TEXT | TEXT | Yes | Item remarks |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Foreign Key (salesInvoiceId → SalesInvoice.id)
- Foreign Key (medicineId → Medicine.id)
- Foreign Key (batchId → Batch.id)
- Foreign Key (unitId → UnitOfMeasure.id)
- Unique (uuid)
- CHECK (soldQuantity > 0)
- CHECK (unitPrice >= 0)
- CHECK (discountAmount >= 0)
- CHECK (taxAmount >= 0)
- CHECK (lineAmount >= 0)
- CHECK (version >= 1)

---

## Indexes

- PK_SalesInvoiceItem
- UK_SalesInvoiceItem_UUID
- IDX_SalesInvoiceItem_Invoice
- IDX_SalesInvoiceItem_Medicine
- IDX_SalesInvoiceItem_Batch
- IDX_SalesInvoiceItem_LineNumber

---

## Sample Records

| id | salesInvoiceId | lineNumber | medicineId | batchId | soldQuantity | unitPrice | lineAmount |
|----|---------------:|-----------:|-----------:|--------:|-------------:|----------:|-----------:|
| 1 | 1 | 1 | 101 | 501 | 2.000 | 15.00 | 30.00 |
| 2 | 1 | 2 | 205 | 612 | 1.000 | 145.00 | 145.00 |
| 3 | 2 | 1 | 310 | 730 | 5.000 | 18.50 | 92.50 |

---

## Prisma Model

```prisma
model SalesInvoiceItem {
  id                BigInt   @id @default(autoincrement())

  uuid              String   @unique @db.Uuid

  salesInvoiceId    BigInt

  medicineId        BigInt
  batchId           BigInt
  unitId            BigInt

  lineNumber        Int

  soldQuantity      Decimal  @db.Decimal(14,3)

  unitPrice         Decimal  @db.Decimal(12,2)

  discountPercent   Decimal? @db.Decimal(5,2)
  discountAmount    Decimal  @default(0) @db.Decimal(12,2)

  taxPercent        Decimal? @db.Decimal(5,2)
  taxAmount         Decimal  @default(0) @db.Decimal(12,2)

  lineAmount        Decimal  @db.Decimal(14,2)

  remarks           String?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  deletedAt         DateTime?

  version           Int      @default(1)

  salesInvoice      SalesInvoice  @relation(fields: [salesInvoiceId], references: [id])
  medicine          Medicine      @relation(fields: [medicineId], references: [id])
  batch             Batch         @relation(fields: [batchId], references: [id])
  unit              UnitOfMeasure @relation(fields: [unitId], references: [id])

  @@index([salesInvoiceId])
  @@index([medicineId])
  @@index([batchId])
  @@index([lineNumber])
}
```

---

## Notes

- This is the **detail (line item)** table for the Sales Invoice document.
- Every item should reference the exact **Batch** from which stock was issued.
- Posting a Sales Invoice Item should:
  - Validate available stock.
  - Prevent sale of expired batches unless permitted by policy.
  - Create an **OUT** StockMovement.
  - Update the Stock table.
  - Record the selling price used for the transaction.
- The application should select batches using the **FEFO (First Expiry First Out)** rule by default.
- Historical Sales Invoice Items should never be deleted after posting.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
