# PriceListItem

## Purpose

The PriceListItem table stores the pricing information for individual medicines within a Price List.

Each record defines the selling price, discount policy, tax, and validity for a specific medicine under a particular Price List.

This enables the ERP to maintain multiple pricing strategies without modifying the Medicine or Batch master data.

---

## Business Rules

- Every PriceListItem belongs to exactly one PriceList.
- Every PriceListItem references one Medicine.
- A Medicine can appear only once in a PriceList.
- Selling Price must be greater than zero.
- MRP cannot be less than Selling Price unless explicitly permitted.
- Effective dates must fall within the parent PriceList validity period.
- Inactive PriceListItems cannot be used during billing.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
PriceList (1)
      │
      └──────< PriceListItem (Many)
                    │
                    ├────────► Medicine
                    ├────────► Tax
                    └────────► SalesInvoiceItem
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Foreign Key | priceListId | INTEGER | BIGINT | No | References PriceList.id |
| Foreign Key | medicineId | INTEGER | BIGINT | No | References Medicine.id |
| Business | sellingPrice | REAL | NUMERIC(12,2) | No | Selling price |
| Business | mrp | REAL | NUMERIC(12,2) | No | Maximum Retail Price |
| Business | minimumSellingPrice | REAL | NUMERIC(12,2) | Yes | Lowest allowed selling price |
| Pricing | discountPercent | REAL | NUMERIC(5,2) | Yes | Default discount percentage |
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
- CHECK (mrp >= sellingPrice)
- CHECK (minimumSellingPrice IS NULL OR minimumSellingPrice <= sellingPrice)
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

---

## Prisma Model

```prisma
model PriceListItem {
  id                   BigInt   @id @default(autoincrement())

  uuid                 String   @unique @db.Uuid

  priceListId          BigInt
  medicineId           BigInt

  sellingPrice         Decimal  @db.Decimal(12,2)
  mrp                  Decimal  @db.Decimal(12,2)

  minimumSellingPrice  Decimal? @db.Decimal(12,2)

  discountPercent      Decimal? @db.Decimal(5,2)

  taxId                BigInt?

  effectiveFrom        DateTime
  effectiveTo          DateTime?

  isActive             Boolean  @default(true)

  remarks              String?

  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
  deletedAt            DateTime?

  version              Int      @default(1)

  priceList            PriceList @relation(fields: [priceListId], references: [id])
  medicine             Medicine  @relation(fields: [medicineId], references: [id])
  tax                  Tax?      @relation(fields: [taxId], references: [id])

  @@unique([priceListId, medicineId])

  @@index([priceListId])
  @@index([medicineId])
  @@index([taxId])
  @@index([isActive])
}
```

---

## Notes

- This is the **detail (line item)** table for the Price List.
- Each medicine should appear only once within a Price List.
- The billing engine should determine the applicable Price List first and then retrieve the corresponding PriceListItem.
- Historical prices should never be modified after becoming effective. Instead, create a new Price List or a new effective period.
- If `minimumSellingPrice` is configured, the system should prevent billing below that value unless the user has the required authorization.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
