# MedicineSchedule

## Purpose

The MedicineSchedule table defines the regulatory schedule classification of medicines as per applicable drug regulations.

It is used to determine whether a medicine requires a prescription, special storage, restricted sale, or additional compliance during dispensing.

Examples (India):

- Schedule H
- Schedule H1
- Schedule X
- OTC (Over-the-Counter)

---

## Business Rules

- Every schedule must have a unique Schedule Code.
- Schedule Name must be unique.
- A schedule can be assigned to multiple medicines.
- A medicine can belong to only one schedule.
- Schedule definitions should be maintained by administrators only.
- System schedules should not be deleted.
- Soft delete should be used.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
MedicineSchedule (1)
        │
        └──────< Medicine (Many)
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Business | scheduleCode | TEXT | VARCHAR(20) | No | Schedule code (H, H1, X, OTC) |
| Business | scheduleName | TEXT | VARCHAR(100) | No | Display name |
| Business | description | TEXT | TEXT | Yes | Regulatory description |
| Compliance | requiresPrescription | INTEGER | BOOLEAN | No | Prescription mandatory |
| Compliance | requiresDoctorDetails | INTEGER | BOOLEAN | No | Doctor details mandatory |
| Compliance | maintainSalesRegister | INTEGER | BOOLEAN | No | Maintain statutory sales register |
| Compliance | controlledSubstance | INTEGER | BOOLEAN | No | Controlled medicine |
| Status | isSystemSchedule | INTEGER | BOOLEAN | No | Built-in schedule |
| Status | isActive | INTEGER | BOOLEAN | No | Active schedule |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- Unique (scheduleCode)
- Unique (scheduleName)
- CHECK version >= 1

---

## Indexes

- PK_MedicineSchedule (id)
- UK_MedicineSchedule_UUID
- UK_MedicineSchedule_Code
- UK_MedicineSchedule_Name
- IDX_MedicineSchedule_Prescription
- IDX_MedicineSchedule_Active

---

## Sample Records

| id | scheduleCode | scheduleName | requiresPrescription | controlledSubstance |
|----|--------------|--------------|-----------------------|---------------------|
| 1 | OTC | Over The Counter | No | No |
| 2 | H | Schedule H | Yes | No |
| 3 | H1 | Schedule H1 | Yes | No |
| 4 | X | Schedule X | Yes | Yes |

---

## Prisma Model

```prisma
model MedicineSchedule {
  id                        BigInt   @id @default(autoincrement())

  uuid                      String   @unique 

  scheduleCode              String   @unique
  scheduleName              String   @unique

  description               String?

  requiresPrescription      Boolean  @default(false)
  requiresDoctorDetails     Boolean  @default(false)
  maintainSalesRegister     Boolean  @default(false)
  controlledSubstance       Boolean  @default(false)

  isSystemSchedule          Boolean  @default(false)
  isActive                  Boolean  @default(true)

  createdAt                 DateTime @default(now())
  updatedAt                 DateTime @updatedAt
  deletedAt                 DateTime?

  version                   Int      @default(1)

  medicines                 Medicine[]

  @@index([requiresPrescription])
  @@index([isActive])
}
```

---

## Notes

- Defines regulatory classifications for medicines.
- Business logic for prescription validation should reference this table rather than hardcoding schedule names.
- System-defined schedules (OTC, H, H1, X) should be seeded during application installation.
- Regulatory requirements may differ by country; therefore, schedule definitions should remain configurable where possible.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
