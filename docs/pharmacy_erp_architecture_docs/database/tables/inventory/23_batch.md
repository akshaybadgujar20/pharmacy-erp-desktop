# Batch

## Purpose

The Batch table stores batch/lot identity for each medicine: batch number, expiry, lot cost, and statutory MRP.

A medicine can have multiple batches. **Branch-specific sale pricing** is maintained in branch-scoped `PriceList` / `PriceListItem`, not on Batch.

Inventory balances are in **Stock** (one row per batch per branch).

---

## Business Rules

- Every Batch belongs to exactly one Medicine.
- Batch Number must be unique per Medicine: `(medicineId, batchNumber)`.
- Batch stores **purchaseRate** (lot cost) and **mrp** (legal MRP on pack).
- **saleRate** and **discountPercent** are NOT on Batch — use PriceListItem (branch-scoped).
- Sale line items snapshot final price/MRP at transaction time.
- Expired batches cannot be sold.
- FEFO (First Expiry First Out) should be followed during dispensing.
- UUID is used for cloud synchronization.
- BIGINT is the local internal primary key only.

---

## Relationships

```
Medicine (1)
      │
      └──< Batch (Many)
                │
                ├──< Stock (Many — per branch)
                ├──< StockMovement
                └──< SalesInvoiceItem
```

---

## Columns

| Category | Column | SQLite | PostgreSQL (JPA) | Nullable | Description |
|----------|--------|---------|------------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Local PK (not synced) |
| Identifier | uuid | TEXT | UUID/TEXT | No | Global sync identifier |
| Foreign Key | medicineId | INTEGER | BIGINT | No | References Medicine.id |
| Business | batchNumber | TEXT | VARCHAR | No | Manufacturer batch number |
| Product | manufacturingDate | DATE | DATE | Yes | Manufacturing date |
| Product | expiryDate | DATE | DATE | No | Expiry date |
| Pricing | purchaseRate | REAL | NUMERIC | No | Lot cost at receipt |
| Pricing | mrp | REAL | NUMERIC | No | Statutory MRP |
| Product | barcode | TEXT | VARCHAR | Yes | Batch barcode |
| Status | isActive | INTEGER | BOOLEAN | No | Active batch |
| Audit | createdAt / updatedAt / deletedAt / version | — | — | — | Standard audit |

---

## Constraints

- Primary Key (id)
- Foreign Key (medicineId → Medicine.id)
- Unique (uuid)
- Unique (medicineId, batchNumber)

---

## Prisma Model

```prisma
model Batch {
  id   BigInt @id @default(autoincrement())
  uuid String @unique @default(uuid())

  medicineId BigInt @map("medicine_id")
  batchNumber String @map("batch_number")

  manufacturingDate DateTime? @map("manufacturing_date")
  expiryDate        DateTime  @map("expiry_date")

  purchaseRate Decimal @map("purchase_rate")
  mrp          Decimal

  barcode  String?
  isActive Boolean @default(true) @map("is_active")

  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")
  updatedBy BigInt?   @map("updated_by")
  deletedBy BigInt?   @map("deleted_by")
  version   Int       @default(1)

  medicine Medicine @relation(fields: [medicineId], references: [id])
  stocks   Stock[]

  @@unique([medicineId, batchNumber])
  @@index([medicineId, expiryDate])
  @@index([expiryDate])
}
```

---

## Notes

- Batch = lot identity + cost + MRP. Not a stock balance.
- Use **Stock** for per-branch quantities.
- Use **PriceListItem** for branch sale price/discount.
