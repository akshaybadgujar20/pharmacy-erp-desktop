# Batch

## Purpose

The Batch table stores batch-specific information for each medicine received through purchases.

A medicine can have multiple batches, each with different:

- Batch Number
- Manufacturing Date
- Expiry Date
- Purchase Rate
- MRP
- Selling Price

Inventory is always maintained at the **batch level**, enabling accurate expiry tracking, FIFO/FEFO dispensing, recalls, and statutory compliance.

---

## Business Rules

- Every Batch belongs to exactly one Medicine.
- Every Batch is received through a Purchase Invoice Item.
- Batch Number must be unique per Medicine.
- Expired batches cannot be sold.
- Stock is maintained separately in the Stock table.
- Batch prices remain fixed after purchase.
- Sale transactions must always reference a Batch.
- FEFO (First Expiry First Out) should be followed during dispensing.
- Soft delete should be avoided for historical batches.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Medicine (1)
      │
      └──────< Batch (Many)
                    │
                    ├──────< Stock
                    ├──────< StockMovement
                    ├──────< SalesInvoiceItem
                    ├──────< PurchaseReturnItem
                    ├──────< SalesReturnItem
                    └────── PurchaseInvoiceItem
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Foreign Key | medicineId | INTEGER | BIGINT | No | References Medicine.id |
| Foreign Key | purchaseInvoiceItemId | INTEGER | BIGINT | Yes | Source purchase invoice item |
| Business | batchNumber | TEXT | VARCHAR(50) | No | Manufacturer batch number |
| Product | manufacturingDate | DATE | DATE | Yes | Manufacturing date |
| Product | expiryDate | DATE | DATE | No | Expiry date |
| Pricing | purchaseRate | REAL | NUMERIC(12,2) | No | Purchase price |
| Pricing | mrp | REAL | NUMERIC(12,2) | No | Maximum Retail Price |
| Pricing | saleRate | REAL | NUMERIC(12,2) | No | Selling price |
| Pricing | discountPercent | REAL | NUMERIC(5,2) | Yes | Default discount |
| Product | barcode | TEXT | VARCHAR(100) | Yes | Batch barcode |
| Status | isExpired | INTEGER | BOOLEAN | No | Indicates expired batch |
| Status | isActive | INTEGER | BOOLEAN | No | Active batch |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Foreign Key (medicineId → Medicine.id)
- Foreign Key (purchaseInvoiceItemId → PurchaseInvoiceItem.id)
- Unique (uuid)
- Unique (medicineId, batchNumber)
- CHECK (purchaseRate >= 0)
- CHECK (mrp >= 0)
- CHECK (saleRate >= 0)
- CHECK (expiryDate >= manufacturingDate)
- CHECK (version >= 1)

---

## Indexes

- PK_Batch (id)
- UK_Batch_UUID
- UK_Batch_Medicine_BatchNumber
- IDX_Batch_Medicine
- IDX_Batch_ExpiryDate
- IDX_Batch_Barcode
- IDX_Batch_IsExpired
- IDX_Batch_IsActive

---

## Sample Records

| id | medicineId | batchNumber | expiryDate | purchaseRate | mrp | saleRate |
|----|------------|-------------|------------|-------------:|----:|---------:|
| 1 | 1 | PCM240101 | 2027-01-31 | 8.50 | 15.00 | 13.50 |
| 2 | 1 | PCM240205 | 2027-03-31 | 8.75 | 15.00 | 13.75 |
| 3 | 2 | AUG240110 | 2026-12-31 | 98.00 | 145.00 | 135.00 |

---

## Prisma Model

```prisma
model Batch {
  id                      BigInt   @id @default(autoincrement())

  uuid                    String   @unique @db.Uuid

  medicineId              BigInt
  purchaseInvoiceItemId   BigInt?

  batchNumber             String

  manufacturingDate       DateTime?
  expiryDate              DateTime

  purchaseRate            Decimal  @db.Decimal(12,2)
  mrp                     Decimal  @db.Decimal(12,2)
  saleRate                Decimal  @db.Decimal(12,2)

  discountPercent         Decimal? @db.Decimal(5,2)

  barcode                 String?

  isExpired               Boolean  @default(false)
  isActive                Boolean  @default(true)

  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt
  deletedAt               DateTime?

  version                 Int      @default(1)

  medicine                Medicine              @relation(fields: [medicineId], references: [id])
  purchaseInvoiceItem     PurchaseInvoiceItem?  @relation(fields: [purchaseInvoiceItemId], references: [id])

  stock                   Stock?
  stockMovements          StockMovement[]

  @@unique([medicineId, batchNumber])

  @@index([medicineId])
  @@index([expiryDate])
  @@index([barcode])
  @@index([isExpired])
  @@index([isActive])
}
```

---

## Notes

- This is the **most important inventory table** in the Pharmacy ERP.
- Every stock transaction must reference a Batch.
- MRP, purchase price, sale price, manufacturing date, and expiry date are **batch-specific** and must never be stored in the Medicine table.
- Inventory quantity should **not** be stored in this table; use the Stock table.
- Batch history must be preserved for regulatory compliance, product recalls, and audit purposes.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
