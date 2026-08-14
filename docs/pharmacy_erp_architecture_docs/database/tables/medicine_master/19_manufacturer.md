# Manufacturer

## Purpose

The Manufacturer table stores information about companies that manufacture medicines, medical devices, and healthcare products.

A manufacturer represents the original producer of a medicine and is different from a supplier or distributor. A supplier may distribute products from multiple manufacturers.

General company information (name, address, contacts) is maintained in the Party module. This table stores manufacturer-specific business information.

---

## Business Rules

- Every Manufacturer must reference exactly one Party.
- A Party can have at most one Manufacturer record.
- Manufacturer Code must be unique.
- Manufacturing License Number should be unique when provided.
- GSTIN should be unique when provided.
- A Manufacturer can produce multiple medicines.
- Manufacturers can be marked inactive instead of deleting them.
- Soft delete should be used.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Party (1)
    │
    └────── Manufacturer (1)
                  │
                  └──────< Medicine (Many)
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Foreign Key | partyId | INTEGER | BIGINT | No | References Party.id |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Business | manufacturerCode | TEXT | VARCHAR(30) | No | Unique manufacturer code |
| Business | manufacturingLicenseNo | TEXT | VARCHAR(50) | Yes | Drug manufacturing license |
| Business | gstin | TEXT | VARCHAR(20) | Yes | GST Identification Number |
| Business | website | TEXT | VARCHAR(255) | Yes | Official website |
| Business | email | TEXT | VARCHAR(150) | Yes | Official email |
| Business | supportPhone | TEXT | VARCHAR(30) | Yes | Customer support number |
| Status | isPreferred | INTEGER | BOOLEAN | No | Preferred manufacturer |
| Status | isActive | INTEGER | BOOLEAN | No | Active manufacturer |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Foreign Key (partyId → Party.id)
- Unique (uuid)
- Unique (partyId)
- Unique (manufacturerCode)
- Unique (manufacturingLicenseNo)
- Unique (gstin)

---

## Indexes

- PK_Manufacturer (id)
- UK_Manufacturer_UUID
- UK_Manufacturer_Code
- UK_Manufacturer_Party
- UK_Manufacturer_License
- IDX_Manufacturer_GSTIN
- IDX_Manufacturer_Preferred
- IDX_Manufacturer_Active

---

## Sample Records

| id | partyId | manufacturerCode | manufacturingLicenseNo | gstin | isPreferred |
|----|---------|------------------|-------------------------|-------|-------------|
| 1 | 100 | MFG00001 | MH-MFG-123456 | 27ABCDE1234F1Z5 | Yes |
| 2 | 101 | MFG00002 | GJ-MFG-998877 | 24PQRSX9876L1Z2 | No |
| 3 | 102 | MFG00003 | DL-MFG-456789 | NULL | No |

---

## Prisma Model

```prisma
model Manufacturer {
  id                       BigInt   @id @default(autoincrement())

  partyId                  BigInt   @unique

  uuid                     String   @unique @db.Uuid

  manufacturerCode         String   @unique

  manufacturingLicenseNo   String?  @unique
  gstin                    String?  @unique

  website                  String?
  email                    String?
  supportPhone             String?

  isPreferred              Boolean  @default(false)
  isActive                 Boolean  @default(true)

  createdAt                DateTime @default(now())
  updatedAt                DateTime @updatedAt
  deletedAt                DateTime?

  version                  Int      @default(1)

  party                    Party    @relation(fields: [partyId], references: [id])

  medicines                Medicine[]

  @@index([isPreferred])
  @@index([isActive])
}
```

---

## Notes

- Stores only manufacturer-specific business information.
- Company name, address, and contact details belong in the Party, PartyAddress, and PartyContact tables.
- A manufacturer is different from a supplier; one supplier may distribute products from multiple manufacturers.
- Medicines should always reference Manufacturer rather than Party directly.
- Manufacturing License Number should comply with local regulatory requirements.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
