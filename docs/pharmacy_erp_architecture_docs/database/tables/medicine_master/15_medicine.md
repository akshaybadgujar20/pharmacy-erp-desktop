# Medicine

## Purpose

The Medicine table stores the master information for all medicines sold, purchased, and stocked in the Pharmacy ERP.

This table contains the product identity and business attributes, while inventory, pricing, taxation, and batches are maintained in their respective modules.

A Medicine can have multiple batches, prices, and stock records.

---

## Business Rules

- Every medicine must have a unique Medicine Code.
- Medicine Name should be unique within a manufacturer.
- Every medicine belongs to one Category.
- Every medicine belongs to one Manufacturer.
- Every medicine has one primary Unit of Measure.
- Every medicine may contain multiple salts through the MedicineSalt table.
- Schedule drugs should reference MedicineSchedule.
- Medicine can be discontinued without deleting the record.
- Soft delete should be used.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Manufacturer (1)
      │
      ▼
 Medicine
      │
      ├──────────────► MedicineCategory
      ├──────────────► MedicineSchedule
      ├──────────────► UnitOfMeasure
      │
      ├──────< MedicineSalt >────── MedicineGeneric
      │
      ├──────< Batch
      ├──────< Stock
      ├──────< PurchaseInvoiceItem
      ├──────< SalesInvoiceItem
      └──────< PriceListItem
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Business | medicineCode | TEXT | VARCHAR(30) | No | Unique medicine code |
| Business | medicineName | TEXT | VARCHAR(200) | No | Medicine name |
| Foreign Key | manufacturerId | INTEGER | BIGINT | No | References Manufacturer.id |
| Foreign Key | categoryId | INTEGER | BIGINT | No | References MedicineCategory.id |
| Foreign Key | scheduleId | INTEGER | BIGINT | Yes | References MedicineSchedule.id |
| Foreign Key | unitId | INTEGER | BIGINT | No | References UnitOfMeasure.id |
| Product | brandName | TEXT | VARCHAR(150) | Yes | Brand name |
| Product | strength | TEXT | VARCHAR(50) | Yes | 500 mg, 250 mg, etc. |
| Product | dosageForm | TEXT | VARCHAR(50) | No | Tablet, Capsule, Syrup, Injection |
| Product | packSize | TEXT | VARCHAR(50) | Yes | 10 Tablets, 100 ml, etc. |
| Product | hsnCode | TEXT | VARCHAR(20) | Yes | GST HSN Code |
| Product | barcode | TEXT | VARCHAR(50) | Yes | Product barcode |
| Product | requiresPrescription | INTEGER | BOOLEAN | No | Prescription required |
| Product | narcoticDrug | INTEGER | BOOLEAN | No | Narcotic medicine |
| Product | refrigerated | INTEGER | BOOLEAN | No | Cold storage required |
| Status | discontinued | INTEGER | BOOLEAN | No | Product discontinued |
| Status | isActive | INTEGER | BOOLEAN | No | Active medicine |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- Unique (medicineCode)
- Foreign Key (manufacturerId → Manufacturer.id)
- Foreign Key (categoryId → MedicineCategory.id)
- Foreign Key (scheduleId → MedicineSchedule.id)
- Foreign Key (unitId → UnitOfMeasure.id)
- CHECK version >= 1

---

## Indexes

- PK_Medicine (id)
- UK_Medicine_UUID
- UK_Medicine_Code
- IDX_Medicine_Name
- IDX_Medicine_Manufacturer
- IDX_Medicine_Category
- IDX_Medicine_Barcode
- IDX_Medicine_Active

---

## Sample Records

| id | medicineCode | medicineName | dosageForm | strength | manufacturerId |
|----|--------------|--------------|------------|----------|----------------|
| 1 | MED000001 | Crocin 500 | Tablet | 500 mg | 1 |
| 2 | MED000002 | Augmentin 625 | Tablet | 625 mg | 3 |
| 3 | MED000003 | Benadryl | Syrup | 100 ml | 5 |

---

## Prisma Model

```prisma
model Medicine {
  id                     BigInt   @id @default(autoincrement())

  uuid                   String   @unique 

  medicineCode           String   @unique
  medicineName           String

  manufacturerId         BigInt
  categoryId             BigInt
  scheduleId             BigInt?
  unitId                 BigInt

  brandName              String?
  strength               String?
  dosageForm             String
  packSize               String?

  hsnCode                String?
  barcode                String?

  requiresPrescription   Boolean  @default(false)
  narcoticDrug           Boolean  @default(false)
  refrigerated           Boolean  @default(false)

  discontinued           Boolean  @default(false)
  isActive               Boolean  @default(true)

  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt
  deletedAt              DateTime?

  version                Int      @default(1)

  manufacturer           Manufacturer      @relation(fields: [manufacturerId], references: [id])
  category               MedicineCategory  @relation(fields: [categoryId], references: [id])
  schedule               MedicineSchedule? @relation(fields: [scheduleId], references: [id])
  unit                   UnitOfMeasure     @relation(fields: [unitId], references: [id])

  medicineSalts          MedicineSalt[]
  batches                Batch[]

  @@index([medicineName])
  @@index([manufacturerId])
  @@index([categoryId])
  @@index([barcode])
  @@index([isActive])
}
```

---

## Notes

- This is the central master table for all pharmaceutical products.
- Chemical composition should **not** be stored here; use **MedicineSalt** to support combination medicines.
- Inventory quantities are maintained in **Stock**.
- Batch-specific information (MRP, expiry date, manufacturing date, purchase rate, sale rate) belongs in the **Batch** table.
- Pricing rules belong in **PriceListItem**.
- Tax information should be maintained in the **Tax** module.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
