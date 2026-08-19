# MedicineCategory

## Purpose

The MedicineCategory table classifies medicines into logical business groups for inventory management, reporting, pricing, taxation, and user navigation.

Categories help pharmacists and store managers organize medicines efficiently and generate meaningful reports.

Examples:

- Antibiotics
- Analgesics
- Antipyretics
- Vitamins
- Syrups
- Injections
- Surgical Items
- Ayurvedic Medicines

---

## Business Rules

- Every category must have a unique Category Code.
- Category Name must be unique.
- Categories may have a parent category to support hierarchical classification.
- A medicine belongs to exactly one category.
- Categories can be disabled without deleting them.
- Parent categories cannot create circular references.
- Soft delete should be used.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
MedicineCategory
       │
       ├──────< Child Categories
       │
       └──────< Medicine
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Foreign Key | parentCategoryId | INTEGER | BIGINT | Yes | References parent category |
| Business | categoryCode | TEXT | VARCHAR(30) | No | Unique category code |
| Business | categoryName | TEXT | VARCHAR(100) | No | Category name |
| Business | description | TEXT | TEXT | Yes | Category description |
| Display | displayOrder | INTEGER | INTEGER | No | Display order |
| Status | isActive | INTEGER | BOOLEAN | No | Active category |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Foreign Key (parentCategoryId → MedicineCategory.id)
- Unique (uuid)
- Unique (categoryCode)
- Unique (categoryName)
- CHECK displayOrder >= 0
- CHECK version >= 1
- CHECK parentCategoryId <> id

---

## Indexes

- PK_MedicineCategory (id)
- UK_MedicineCategory_UUID
- UK_MedicineCategory_Code
- UK_MedicineCategory_Name
- IDX_MedicineCategory_Parent
- IDX_MedicineCategory_DisplayOrder
- IDX_MedicineCategory_Active

---

## Sample Records

| id | categoryCode | categoryName | parentCategoryId |
|----|--------------|--------------|------------------|
| 1 | CAT001 | Tablets | NULL |
| 2 | CAT002 | Antibiotics | 1 |
| 3 | CAT003 | Pain Killers | 1 |
| 4 | CAT004 | Syrups | NULL |

---

## Prisma Model

```prisma
model MedicineCategory {
  id                BigInt   @id @default(autoincrement())

  uuid              String   @unique 

  parentCategoryId  BigInt?

  categoryCode      String   @unique
  categoryName      String   @unique

  description       String?

  displayOrder      Int      @default(0)

  isActive          Boolean  @default(true)

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  deletedAt         DateTime?

  version           Int      @default(1)

  parentCategory    MedicineCategory?  @relation("CategoryHierarchy", fields: [parentCategoryId], references: [id])
  childCategories   MedicineCategory[] @relation("CategoryHierarchy")

  medicines         Medicine[]

  @@index([parentCategoryId])
  @@index([displayOrder])
  @@index([isActive])
}
```

---

## Notes

- Supports unlimited category hierarchy using self-referencing relationships.
- Categories are intended for business classification and reporting, not pharmaceutical composition.
- Every medicine should belong to one category.
- Categories should remain stable over time to preserve reporting consistency.
- Parent categories should never be deleted while child categories exist.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
