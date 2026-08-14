# PriceList

## Purpose

The PriceList table defines pricing policies for medicines and healthcare products.

It allows the ERP to maintain multiple selling prices for different customer groups, branches, schemes, or time periods without modifying the Medicine or Batch master data.

Typical Price Lists include:

- Retail Price
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
- Price Lists may be Branch-specific.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Branch
   │
   ▼
PriceList
   │
   └────────< PriceListItem
                    │
                    ▼
                Medicine
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Business | priceListCode | TEXT | VARCHAR(20) | No | Unique price list code |
| Business | priceListName | TEXT | VARCHAR(100) | No | Price list name |
| Foreign Key | branchId | INTEGER | BIGINT | Yes | Applicable branch |
| Business | priceListType | TEXT | VARCHAR(30) | No | RETAIL, WHOLESALE, HOSPITAL, CORPORATE, PROMOTIONAL |
| Business | effectiveFrom | DATE | DATE | No | Effective date |
| Business | effectiveTo | DATE | DATE | Yes | Expiry date |
| Status | isDefault | INTEGER | BOOLEAN | No | Default price list |
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
- CHECK (priceListType IN ('RETAIL','WHOLESALE','HOSPITAL','CORPORATE','PROMOTIONAL','GOVERNMENT'))
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

| id | priceListCode | priceListName | priceListType | effectiveFrom | isDefault |
|----|---------------|---------------|---------------|---------------|-----------|
| 1 | RETAIL | Retail Price | RETAIL | 2026-04-01 | Yes |
| 2 | WHOLE | Wholesale Price | WHOLESALE | 2026-04-01 | No |
| 3 | HOSP | Hospital Price | HOSPITAL | 2026-04-01 | No |

---

## Prisma Model

```prisma
model PriceList {
  id              BigInt   @id @default(autoincrement())

  uuid            String   @unique @db.Uuid

  priceListCode   String   @unique
  priceListName   String   @unique

  branchId        BigInt?

  priceListType   String

  effectiveFrom   DateTime
  effectiveTo     DateTime?

  isDefault       Boolean  @default(false)
  isActive        Boolean  @default(true)

  remarks         String?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  deletedAt       DateTime?

  version         Int      @default(1)

  branch          Branch? @relation(fields: [branchId], references: [id])

  items           PriceListItem[]

  @@index([branchId])
  @@index([priceListType])
  @@index([effectiveFrom, effectiveTo])
  @@index([isActive])
}
```

---

## Notes

- This is the **header table** for medicine pricing.
- Individual medicine prices are maintained in **PriceListItem**.
- Multiple Price Lists may exist simultaneously for different customer categories.
- The billing engine should automatically select the appropriate Price List based on customer type, branch, and effective date.
- Historical Price Lists should never be modified after they become effective; create a new Price List for price revisions.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
