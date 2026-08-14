# Tax

## Purpose

The Tax table defines all tax configurations used throughout the Pharmacy ERP.

It centralizes GST and other tax rules so they can be referenced by Purchase, Sales, and Pricing modules.

Typical taxes include:

- GST 0%
- GST 5%
- GST 12%
- GST 18%
- GST 28%
- IGST
- CGST
- SGST
- CESS (if applicable)

The table stores only tax definitions. Tax amounts are calculated and stored in transactional tables.

---

## Business Rules

- Every Tax Code must be unique.
- Tax rates may change over time using effective dates.
- Historical tax records must never be modified after use.
- Inactive taxes cannot be selected for new transactions.
- A PriceListItem references one Tax.
- PurchaseInvoiceItem and SalesInvoiceItem calculate tax using the selected Tax.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Tax
 │
 ├────────► PriceListItem
 ├────────► PurchaseInvoiceItem
 └────────► SalesInvoiceItem
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Business | taxCode | TEXT | VARCHAR(20) | No | Unique tax code |
| Business | taxName | TEXT | VARCHAR(100) | No | Tax name |
| Business | taxType | TEXT | VARCHAR(20) | No | GST, CGST, SGST, IGST, CESS |
| Business | taxRate | REAL | NUMERIC(5,2) | No | Percentage rate |
| Business | effectiveFrom | DATE | DATE | No | Effective date |
| Business | effectiveTo | DATE | DATE | Yes | Expiry date |
| Status | isActive | INTEGER | BOOLEAN | No | Active tax |
| Business | description | TEXT | TEXT | Yes | Description |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- Unique (taxCode)
- CHECK (taxRate >= 0)
- CHECK (taxRate <= 100)
- CHECK (taxType IN ('GST','CGST','SGST','IGST','CESS'))
- CHECK (effectiveTo IS NULL OR effectiveTo >= effectiveFrom)
- CHECK (version >= 1)

---

## Indexes

- PK_Tax
- UK_Tax_UUID
- UK_Tax_Code
- IDX_Tax_Type
- IDX_Tax_Rate
- IDX_Tax_Effective
- IDX_Tax_Active

---

## Sample Records

| id | taxCode | taxName | taxType | taxRate | isActive |
|----|---------|----------|----------|---------:|----------|
| 1 | GST0 | GST 0% | GST | 0.00 | Yes |
| 2 | GST5 | GST 5% | GST | 5.00 | Yes |
| 3 | GST12 | GST 12% | GST | 12.00 | Yes |
| 4 | GST18 | GST 18% | GST | 18.00 | Yes |

---

## Prisma Model

```prisma
model Tax {
  id              BigInt   @id @default(autoincrement())

  uuid            String   @unique @db.Uuid

  taxCode         String   @unique
  taxName         String

  taxType         String
  taxRate         Decimal  @db.Decimal(5,2)

  effectiveFrom   DateTime
  effectiveTo     DateTime?

  isActive        Boolean  @default(true)

  description     String?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  deletedAt       DateTime?

  version         Int      @default(1)

  priceListItems        PriceListItem[]
  purchaseInvoiceItems  PurchaseInvoiceItem[]
  salesInvoiceItems     SalesInvoiceItem[]

  @@index([taxType])
  @@index([taxRate])
  @@index([effectiveFrom, effectiveTo])
  @@index([isActive])
}
```

---

## Notes

- This table contains **tax master definitions only**.
- Tax amounts should be calculated during transaction processing and stored in PurchaseInvoiceItem and SalesInvoiceItem for audit purposes.
- Existing Tax records should never be edited after transactions exist; create a new Tax record with a new effective period instead.
- Supports multiple GST rates and future tax revisions.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
