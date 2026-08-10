# UnitOfMeasure

## Purpose

The UnitOfMeasure table defines the standard units used throughout the Pharmacy ERP for medicines, inventory, purchasing, sales, and stock management.

It provides a centralized master for measurement units, ensuring consistency across all modules.

Examples:

- Tablet
- Capsule
- Bottle
- Strip
- Box
- Vial
- Ampoule
- ml
- mg
- g
- kg
- Piece

---

## Business Rules

- Every Unit of Measure (UOM) must have a unique Unit Code.
- Unit Name must be unique.
- Units should be reusable across all modules.
- Units should not be deleted once referenced by transactions.
- A medicine must have one primary Unit of Measure.
- Unit conversion (if required) should be maintained in a separate table.
- Soft delete should be used.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
UnitOfMeasure (1)
       │
       ├──────< Medicine
       ├──────< SaltComposition
       ├──────< PurchaseInvoiceItem
       ├──────< SalesInvoiceItem
       └──────< Batch
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Business | unitCode | TEXT | VARCHAR(20) | No | Unique unit code |
| Business | unitName | TEXT | VARCHAR(100) | No | Display name |
| Business | shortName | TEXT | VARCHAR(20) | No | Abbreviation (TAB, STR, ML) |
| Business | unitType | TEXT | VARCHAR(30) | No | COUNT, WEIGHT, VOLUME, PACKAGING |
| Business | decimalAllowed | INTEGER | BOOLEAN | No | Allows fractional quantities |
| Business | description | TEXT | TEXT | Yes | Additional description |
| Status | isSystemUnit | INTEGER | BOOLEAN | No | Built-in unit |
| Status | isActive | INTEGER | BOOLEAN | No | Active status |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- Unique (unitCode)
- Unique (unitName)
- CHECK unitType IN ('COUNT','WEIGHT','VOLUME','PACKAGING')
- CHECK version >= 1

---

## Indexes

- PK_UnitOfMeasure (id)
- UK_UnitOfMeasure_UUID
- UK_UnitOfMeasure_Code
- UK_UnitOfMeasure_Name
- IDX_UnitOfMeasure_Type
- IDX_UnitOfMeasure_Active

---

## Sample Records

| id | unitCode | unitName | shortName | unitType | decimalAllowed |
|----|----------|----------|-----------|----------|----------------|
| 1 | TAB | Tablet | TAB | COUNT | No |
| 2 | STR | Strip | STR | PACKAGING | No |
| 3 | ML | Millilitre | ml | VOLUME | Yes |
| 4 | MG | Milligram | mg | WEIGHT | Yes |
| 5 | BOX | Box | BOX | PACKAGING | No |

---

## Prisma Model

```prisma
model UnitOfMeasure {
  id               BigInt   @id @default(autoincrement())

  uuid             String   @unique @db.Uuid

  unitCode         String   @unique
  unitName         String   @unique
  shortName        String

  unitType         String

  decimalAllowed   Boolean  @default(false)

  description      String?

  isSystemUnit     Boolean  @default(false)
  isActive         Boolean  @default(true)

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  deletedAt        DateTime?

  version          Int      @default(1)

  medicines        Medicine[]
  saltCompositions SaltComposition[]

  @@index([unitType])
  @@index([isActive])
}
```

---

## Notes

- This is a shared master table used throughout the ERP.
- Units should be standardized and never duplicated.
- Unit conversions (e.g., 1 Box = 10 Strips, 1 Strip = 10 Tablets) should be maintained in a dedicated **UnitConversion** table rather than this table.
- Pharmaceutical strength units (mg, mcg, ml) and packaging units (Strip, Bottle, Box) are intentionally stored together because both are required across pharmacy operations.
- System units should be seeded during application installation and protected from deletion.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
