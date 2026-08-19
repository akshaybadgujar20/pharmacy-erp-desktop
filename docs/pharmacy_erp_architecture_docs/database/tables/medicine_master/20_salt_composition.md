# SaltComposition

## Purpose

The SaltComposition table defines the composition details of pharmaceutical salts used in medicines.

It stores standardized information about the strength, unit of measure, and composition characteristics of active pharmaceutical ingredients (APIs). This table is referenced by the MedicineSalt table to support both single-salt and combination medicines.

Examples:

- Paracetamol 500 mg
- Amoxicillin 500 mg
- Clavulanic Acid 125 mg
- Cetirizine 10 mg

---

## Business Rules

- Every Salt Composition must have a unique Composition Code.
- Every composition references one Generic Medicine.
- The same Generic + Strength + Unit combination cannot be duplicated.
- Composition information should be standardized and reusable.
- Combination medicines are created by associating multiple SaltComposition records through MedicineSalt.
- Soft delete should be used.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
MedicineGeneric (1)
        │
        └──────< SaltComposition (Many)
                        │
                        └──────< MedicineSalt (Many)
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Foreign Key | genericId | INTEGER | BIGINT | No | References MedicineGeneric.id |
| Foreign Key | unitId | INTEGER | BIGINT | No | References UnitOfMeasure.id |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Business | compositionCode | TEXT | VARCHAR(30) | No | Unique composition code |
| Medical | strength | REAL | NUMERIC(10,3) | No | Salt strength |
| Medical | strengthUnit | TEXT | VARCHAR(20) | No | mg, mcg, g, ml, IU |
| Medical | description | TEXT | TEXT | Yes | Additional composition details |
| Status | isActive | INTEGER | BOOLEAN | No | Active composition |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Foreign Key (genericId → MedicineGeneric.id)
- Foreign Key (unitId → UnitOfMeasure.id)
- Unique (uuid)
- Unique (genericId, strength, strengthUnit)
- Unique (compositionCode)
- CHECK strength > 0
- CHECK version >= 1

---

## Indexes

- PK_SaltComposition (id)
- UK_SaltComposition_UUID
- UK_SaltComposition_Code
- UK_SaltComposition_Generic_Strength
- IDX_SaltComposition_Generic
- IDX_SaltComposition_Unit
- IDX_SaltComposition_Active

---

## Sample Records

| id | genericId | strength | strengthUnit | compositionCode |
|----|-----------|----------|--------------|-----------------|
| 1 | 1 | 500 | mg | COMP00001 |
| 2 | 2 | 500 | mg | COMP00002 |
| 3 | 3 | 125 | mg | COMP00003 |

---

## Prisma Model

```prisma
model SaltComposition {
  id                BigInt   @id @default(autoincrement())

  uuid              String   @unique 

  genericId         BigInt
  unitId            BigInt

  compositionCode   String   @unique

  strength          Decimal  
  strengthUnit      String

  description       String?

  isActive          Boolean  @default(true)

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  deletedAt         DateTime?

  version           Int      @default(1)

  generic           MedicineGeneric @relation(fields: [genericId], references: [id])
  unit              UnitOfMeasure   @relation(fields: [unitId], references: [id])

  medicineSalts     MedicineSalt[]

  @@unique([genericId, strength, strengthUnit])

  @@index([genericId])
  @@index([unitId])
  @@index([isActive])
}
```

---

## Notes

- Standardizes pharmaceutical salt strengths across the ERP.
- Eliminates duplication of identical salt-strength combinations.
- Supports single-ingredient and multi-ingredient medicines.
- Medicines should reference compositions through the MedicineSalt table rather than storing strength directly.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
