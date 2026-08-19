# PriceListItem

## Purpose

The PriceListItem table stores the **branch-scoped selling price** for individual medicines within a Price List.

Each record defines the selling price, discount policy, tax, and validity for a specific medicine under a particular Price List. This is the authoritative source of **saleRate** — it is **not** stored on Batch.

Batch retains lot cost (`purchaseRate`) and statutory MRP; PriceListItem defines what the branch charges at the counter.

---

## Business Rules

- Every PriceListItem belongs to exactly one PriceList (optionally branch-scoped via header).
- Every PriceListItem references one Medicine.
- A Medicine can appear only once in a PriceList.
- `sellingPrice` is the branch sale rate for billing (replaces former Batch.saleRate).
- Selling Price must be greater than zero.
- MRP on this row is the commercial MRP ceiling for pricing rules (Batch.mrp is statutory pack MRP).
- Effective dates must fall within the parent PriceList validity period.
- Inactive PriceListItems cannot be used during billing.
- SalesInvoiceItem snapshots rate/MRP at sale time.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
PriceList (optional branchId)
      │
      └──────< PriceListItem (Many)
                    │
                    ├────────► Medicine
                    ├────────► Tax
                    └────────► SalesInvoiceItem (price snapshot)

Batch ── purchaseRate, mrp (lot)     PriceListItem ── sellingPrice (branch sale)
```

---

## Columns

| Category | Column | SQLite | PostgreSQL (JPA) | Nullable | Description |
|----------|--------|---------|------------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID/TEXT | No | Global unique identifier |
| Foreign Key | priceListId | INTEGER | BIGINT | No | References PriceList.id |
| Foreign Key | medicineId | INTEGER | BIGINT | No | References Medicine.id |
| Business | sellingPrice | REAL | NUMERIC | No | Branch selling price (sale rate) |
| Business | mrp | REAL | NUMERIC | No | Commercial MRP ceiling |
| Business | minimumSellingPrice | REAL | NUMERIC | Yes | Lowest allowed selling price |
| Pricing | discountPercent | REAL | NUMERIC | Yes | Default discount percentage |
| Pricing | taxId | INTEGER | BIGINT | Yes | References Tax.id |
| Business | effectiveFrom | DATE | DATE | No | Effective start date |
| Business | effectiveTo | DATE | DATE | Yes | Effective end date |
| Status | isActive | INTEGER | BOOLEAN | No | Active status |
| Business | remarks | TEXT | TEXT | Yes | Remarks |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- Foreign Key (priceListId → PriceList.id)
- Foreign Key (medicineId → Medicine.id)
- Foreign Key (taxId → Tax.id)
- Unique (priceListId, medicineId)
- CHECK (sellingPrice > 0)
- CHECK (effectiveTo IS NULL OR effectiveTo >= effectiveFrom)
- CHECK (version >= 1)

---

## Indexes

- PK_PriceListItem
- UK_PriceListItem_UUID
- UK_PriceListItem_PriceList_Medicine
- IDX_PriceListItem_PriceList
- IDX_PriceListItem_Medicine
- IDX_PriceListItem_Tax
- IDX_PriceListItem_Active

---

## Sample Records

| id | priceListId | medicineId | sellingPrice | mrp | discountPercent | isActive |
|----|------------:|-----------:|-------------:|----:|----------------:|----------|
| 1 | 1 | 101 | 15.00 | 18.00 | 0.00 | Yes |
| 2 | 1 | 205 | 145.00 | 160.00 | 5.00 | Yes |
| 3 | 2 | 101 | 13.50 | 18.00 | 10.00 | Yes |

Same medicine (101) can have different `sellingPrice` in branch-scoped price lists.

---

## Prisma Model

```prisma
model PriceListItem {
  id   BigInt @id @default(autoincrement())
  uuid String @unique @default(uuid())

  priceListId BigInt @map("price_list_id")
  medicineId  BigInt @map("medicine_id")

  sellingPrice        Decimal  @map("selling_price")
  mrp                 Decimal
  minimumSellingPrice Decimal? @map("minimum_selling_price")

  discountPercent Decimal? @map("discount_percent")

  taxId BigInt? @map("tax_id")

  effectiveFrom DateTime  @map("effective_from")
  effectiveTo   DateTime? @map("effective_to")

  isActive Boolean @default(true) @map("is_active")

  remarks String?

  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  version Int @default(1)

  priceList PriceList @relation(fields: [priceListId], references: [id])
  medicine  Medicine  @relation(fields: [medicineId], references: [id])
  tax       Tax?      @relation(fields: [taxId], references: [id])

  @@unique([priceListId, medicineId])
  @@index([priceListId])
  @@index([medicineId])
  @@index([taxId])
  @@index([isActive])
}
```

---

## Notes

- This is the **detail table** for branch-scoped sale pricing.
- **Batch does not carry saleRate** — use this table for billing lookups.
- The billing engine resolves branch PriceList first, then PriceListItem.
- Line items snapshot prices at sale time for historical accuracy.
- Supports offline-first synchronization using UUID.
