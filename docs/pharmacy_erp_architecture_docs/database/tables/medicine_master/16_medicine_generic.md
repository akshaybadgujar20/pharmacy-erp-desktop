# MedicineGeneric

## Purpose

The MedicineGeneric table stores the generic (scientific) names of medicines.

A generic medicine represents the active pharmaceutical ingredient (API) independent of any manufacturer or brand. Multiple branded medicines may share the same generic.

Examples:

- Paracetamol
- Amoxicillin
- Cetirizine
- Pantoprazole

Combination medicines are handled through the MedicineSalt table.

---

## Business Rules

- Every generic medicine must have a unique Generic Code.
- Generic Name must be unique.
- A generic medicine can be associated with multiple branded medicines.
- Generic information should not contain manufacturer-specific details.
- Generic medicines may have one or more salts through MedicineSalt.
- Soft delete should be used.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
MedicineGeneric (1)
        │
        └──────< MedicineSalt >────── Medicine
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Business | genericCode | TEXT | VARCHAR(30) | No | Unique generic code |
| Business | genericName | TEXT | VARCHAR(150) | No | Scientific/generic medicine name |
| Medical | therapeuticClass | TEXT | VARCHAR(100) | Yes | Therapeutic class |
| Medical | pharmacologicalClass | TEXT | VARCHAR(100) | Yes | Pharmacological classification |
| Medical | description | TEXT | TEXT | Yes | Additional information |
| Status | isActive | INTEGER | BOOLEAN | No | Active generic |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- Unique (genericCode)
- Unique (genericName)
- CHECK version >= 1

---

## Indexes

- PK_MedicineGeneric (id)
- UK_MedicineGeneric_UUID
- UK_MedicineGeneric_Code
- UK_MedicineGeneric_Name
- IDX_MedicineGeneric_TherapeuticClass
- IDX_MedicineGeneric_Active

---

## Sample Records

| id | genericCode | genericName | therapeuticClass |
|----|-------------|-------------|------------------|
| 1 | GEN00001 | Paracetamol | Analgesic |
| 2 | GEN00002 | Amoxicillin | Antibiotic |
| 3 | GEN00003 | Pantoprazole | Proton Pump Inhibitor |

---

## Prisma Model

```prisma
model MedicineGeneric {
  id                    BigInt   @id @default(autoincrement())

  uuid                  String   @unique @db.Uuid

  genericCode           String   @unique
  genericName           String   @unique

  therapeuticClass      String?
  pharmacologicalClass  String?

  description           String?

  isActive              Boolean  @default(true)

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  deletedAt             DateTime?

  version               Int      @default(1)

  medicineSalts         MedicineSalt[]

  @@index([therapeuticClass])
  @@index([isActive])
}
```

---

## Notes

- Stores generic medicine information independent of manufacturers.
- Multiple branded medicines can reference the same generic through MedicineSalt.
- Manufacturer-specific information belongs in the Medicine table.
- Batch, pricing, and stock information should never be stored here.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
