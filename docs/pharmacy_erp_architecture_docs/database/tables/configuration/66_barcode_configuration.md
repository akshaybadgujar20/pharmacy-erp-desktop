# BarcodeConfiguration

## Purpose

The BarcodeConfiguration table stores barcode generation and label printing settings used throughout the Pharmacy ERP.

It defines barcode formats, label dimensions, encoding standards, and printing options for medicines, batches, shelves, invoices, and other business entities.

Barcode configurations may be defined globally for a Company or overridden for individual Branches.

---

## Business Rules

- Every Barcode Configuration belongs to one Company.
- A configuration may optionally belong to one Branch.
- Configuration Name must be unique within a Company and Branch.
- Only one default configuration may exist for each barcode type.
- Only active configurations can be used for barcode generation.
- Barcode format changes should not invalidate previously printed labels.
- Changes should be audited.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Company
    │
    ▼
BarcodeConfiguration
    ▲
    │
 Branch
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Foreign Key | companyId | INTEGER | BIGINT | No | References Company.id |
| Foreign Key | branchId | INTEGER | BIGINT | Yes | References Branch.id (NULL = Company-wide) |
| Business | configurationName | TEXT | VARCHAR(100) | No | Configuration name |
| Business | barcodeType | TEXT | VARCHAR(30) | No | CODE128, CODE39, EAN13, EAN8, QR_CODE, DATA_MATRIX |
| Business | appliesTo | TEXT | VARCHAR(30) | No | MEDICINE, BATCH, SHELF, INVOICE, CUSTOMER |
| Business | labelWidth | REAL | NUMERIC(8,2) | No | Label width (mm) |
| Business | labelHeight | REAL | NUMERIC(8,2) | No | Label height (mm) |
| Business | dpi | INTEGER | INTEGER | No | Printer DPI |
| Business | showHumanReadableText | INTEGER | BOOLEAN | No | Display barcode text below symbol |
| Business | template | TEXT | TEXT | Yes | Label template or JSON layout |
| Status | isDefault | INTEGER | BOOLEAN | No | Default configuration |
| Status | isActive | INTEGER | BOOLEAN | No | Active configuration |
| Business | remarks | TEXT | TEXT | Yes | Additional remarks |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- Foreign Key (companyId → Company.id)
- Foreign Key (branchId → Branch.id)
- Unique (companyId, branchId, configurationName)
- CHECK (barcodeType IN ('CODE128','CODE39','EAN13','EAN8','QR_CODE','DATA_MATRIX'))
- CHECK (appliesTo IN ('MEDICINE','BATCH','SHELF','INVOICE','CUSTOMER'))
- CHECK (labelWidth > 0)
- CHECK (labelHeight > 0)
- CHECK (dpi > 0)
- CHECK (version >= 1)

---

## Indexes

- PK_BarcodeConfiguration
- UK_BarcodeConfiguration_UUID
- UK_BarcodeConfiguration_Name
- IDX_BarcodeConfiguration_Company
- IDX_BarcodeConfiguration_Branch
- IDX_BarcodeConfiguration_Type
- IDX_BarcodeConfiguration_Default
- IDX_BarcodeConfiguration_Active

---

## Sample Records

| id | configurationName | barcodeType | appliesTo | labelWidth | labelHeight | isDefault |
|----|-------------------|-------------|-----------|-----------:|------------:|-----------|
| 1 | Medicine Label | CODE128 | MEDICINE | 50.00 | 25.00 | Yes |
| 2 | Batch Label | QR_CODE | BATCH | 60.00 | 40.00 | Yes |
| 3 | Shelf Label | CODE39 | SHELF | 80.00 | 30.00 | Yes |

---

## Prisma Model

```prisma
model BarcodeConfiguration {
  id                     BigInt   @id @default(autoincrement())

  uuid                   String   @unique @db.Uuid

  companyId              BigInt
  branchId               BigInt?

  configurationName      String

  barcodeType            String
  appliesTo              String

  labelWidth             Decimal  @db.Decimal(8,2)
  labelHeight            Decimal  @db.Decimal(8,2)

  dpi                    Int      @default(203)

  showHumanReadableText  Boolean  @default(true)

  template               String?

  isDefault              Boolean  @default(false)
  isActive               Boolean  @default(true)

  remarks                String?

  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt
  deletedAt              DateTime?

  version                Int      @default(1)

  company                Company @relation(fields: [companyId], references: [id])
  branch                 Branch? @relation(fields: [branchId], references: [id])

  @@unique([companyId, branchId, configurationName])

  @@index([companyId])
  @@index([branchId])
  @@index([barcodeType])
  @@index([isDefault])
  @@index([isActive])
}
```

---

## Notes

- Stores barcode and label configuration only; barcode images are generated dynamically.
- Company-level configurations act as defaults.
- Branch-level configurations override Company defaults.
- Different barcode formats may be configured for different business entities.
- Label templates should support custom layouts, logos, pricing, batch number, expiry date, and QR codes.
- Changes should be tracked using AuditLog and ChangeHistory.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
