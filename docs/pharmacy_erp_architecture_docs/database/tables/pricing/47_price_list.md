# PriceList

## Purpose

The PriceList table defines **branch-scoped selling price policies** for medicines and healthcare products.

It allows the ERP to maintain multiple selling prices for different customer groups, branches, schemes, or time periods without modifying the Medicine or Batch master data.

**Sale pricing lives here (PriceListItem), not on Batch.** Batch stores lot cost (`purchaseRate`) and statutory MRP only.

Typical Price Lists include:

- Retail Price (branch default)
- Wholesale Price
- Hospital Price
- Distributor Price
- Corporate Price
- Government Scheme Price
- Promotional Price

Individual medicine prices are maintained in the **PriceListItem** table.

---

## Business Rules

- Every Price List contains one or more PriceListItems.
- Price List Name must be unique.
- Only one Default Price List can exist for a Branch.
- A Price List can have an Effective Date and Expiry Date.
- Expired Price Lists cannot be used for billing.
- Price Lists may be branch-specific via `branchId` (null = company-wide default).
- Billing selects branch PriceList → PriceListItem.sellingPrice (not Batch.saleRate).
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Branch (optional)
   │
   ▼
PriceList
   │
   └────────< PriceListItem
                    │
                    ▼
                Medicine
```

Batch (org-global) is **not** the source of sale price — only lot cost and MRP.

---

## Columns

| Category | Column | SQLite | PostgreSQL (JPA) | Nullable | Description |
|----------|--------|---------|------------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID/TEXT | No | Global unique identifier |
| Business | priceListCode | TEXT | VARCHAR(20) | No | Unique price list code |
| Business | priceListName | TEXT | VARCHAR(100) | No | Price list name |
| Foreign Key | branchId | INTEGER | BIGINT | Yes | Applicable branch (null = org-wide) |
| Business | priceListType | TEXT | VARCHAR(30) | No | RETAIL, WHOLESALE, etc. (String) |
| Business | effectiveFrom | DATE | DATE | No | Effective date |
| Business | effectiveTo | DATE | DATE | Yes | Expiry date |
| Status | isDefault | INTEGER | BOOLEAN | No | Default price list for branch |
| Status | isActive | INTEGER | BOOLEAN | No | Active status |
| Business | remarks | TEXT | TEXT | Yes | Additional remarks |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- Unique (priceListCode)
- Unique (priceListName)
- Foreign Key (branchId → Branch.id)
- CHECK (effectiveTo IS NULL OR effectiveTo >= effectiveFrom)
- CHECK (version >= 1)

---

## Indexes

- PK_PriceList
- UK_PriceList_UUID
- UK_PriceList_Code
- UK_PriceList_Name
- IDX_PriceList_Branch
- IDX_PriceList_Type
- IDX_PriceList_Effective
- IDX_PriceList_Active

---

## Sample Records

| id | priceListCode | priceListName | branchId | priceListType | effectiveFrom | isDefault |
|----|---------------|---------------|----------|---------------|---------------|-----------|
| 1 | RETAIL-PUN | Pune Retail Price | 2 | RETAIL | 2026-04-01 | Yes |
| 2 | RETAIL-MUM | Mumbai Retail Price | 3 | RETAIL | 2026-04-01 | Yes |
| 3 | WHOLE | Wholesale Price | NULL | WHOLESALE | 2026-04-01 | No |

---

## Prisma Model

```prisma
model PriceList {
  id   BigInt @id @default(autoincrement())
  uuid String @unique @default(uuid())

  priceListCode String @unique @map("price_list_code")
  priceListName String @unique @map("price_list_name")

  branchId BigInt? @map("branch_id")

  priceListType String @map("price_list_type")

  effectiveFrom DateTime  @map("effective_from")
  effectiveTo   DateTime? @map("effective_to")

  isDefault Boolean @default(false) @map("is_default")
  isActive  Boolean @default(true) @map("is_active")

  remarks String?

  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  version Int @default(1)

  branch Branch? @relation(fields: [branchId], references: [id])

  items PriceListItem[]

  @@index([branchId])
  @@index([priceListType])
  @@index([effectiveFrom, effectiveTo])
  @@index([isActive])
}
```

---

## Notes

- This is the **header table** for branch-scoped medicine pricing.
- Individual selling prices are in **PriceListItem** — not on Batch.
- The billing engine selects PriceList by branch + customer type + effective date, then reads `sellingPrice`.
- Sales line items snapshot final price/MRP at transaction time.
- Historical Price Lists should never be modified after they become effective.
- Supports offline-first synchronization using UUID.
