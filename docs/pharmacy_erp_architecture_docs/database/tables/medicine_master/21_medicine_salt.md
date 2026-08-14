# MedicineSalt

## Purpose

Maps Medicines to one or more Salt Compositions.

Supports combination medicines by allowing multiple active ingredients.

## Business Rules

- One Medicine can have multiple salts.
- Sequence determines display order.
- Strength percentage is optional.
- Combination must be unique.

## Relationships

Medicine (1)
│
└──────< MedicineSalt >────── SaltComposition (1)

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| PK | id | INTEGER | BIGINT | No | Primary Key |
| FK | medicineId | INTEGER | BIGINT | No | Medicine |
| FK | saltCompositionId | INTEGER | BIGINT | No | Salt Composition |
| Business | sequenceNo | INTEGER | INTEGER | No | Display sequence |
| Business | percentage | REAL | NUMERIC(5,2) | Yes | Percentage composition |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Created time |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Updated time |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete |
| Audit | version | INTEGER | INTEGER | No | Version |

## Constraints

- Unique (medicineId, saltCompositionId)

## Indexes

- IDX_MedicineSalt_Medicine
- IDX_MedicineSalt_Salt

## Sample Records

Paracetamol 500 mg

Amoxicillin 500 mg

Clavulanic Acid 125 mg

## Prisma Model

```prisma
model MedicineSalt {
  id                BigInt @id @default(autoincrement())

  medicineId        BigInt
  saltCompositionId BigInt

  sequenceNo        Int
  percentage        Decimal?

  medicine          Medicine
  saltComposition   SaltComposition

  @@unique([medicineId, saltCompositionId])
}
```

## Notes

Supports single-salt and combination medicines.
