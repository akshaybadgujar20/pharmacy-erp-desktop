# PartyAddress

## Purpose

The PartyAddress table stores one or more addresses associated with a Party.

A Party may have multiple addresses such as:

- Billing Address
- Shipping Address
- Residential Address
- Office Address
- Warehouse Address

Separating addresses from the Party table keeps the database normalized and allows future expansion without modifying the Party entity.

---

## Business Rules

- Every address must belong to exactly one Party.
- A Party can have multiple addresses.
- Only one address of a particular type can be marked as the default.
- Address types should be configurable.
- Soft delete should be used.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Party (1)
    │
    └──────< PartyAddress (Many)
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Foreign Key | partyId | INTEGER | BIGINT | No | References Party.id |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Basic | addressType | TEXT | VARCHAR(30) | No | BILLING, SHIPPING, HOME, OFFICE, WAREHOUSE |
| Address | addressLine1 | TEXT | VARCHAR(200) | No | Primary address line |
| Address | addressLine2 | TEXT | VARCHAR(200) | Yes | Secondary address line |
| Address | landmark | TEXT | VARCHAR(150) | Yes | Nearby landmark |
| Address | area | TEXT | VARCHAR(100) | Yes | Area or locality |
| Address | cityId | INTEGER | BIGINT | Yes | References City |
| Address | stateId | INTEGER | BIGINT | Yes | References State |
| Address | countryId | INTEGER | BIGINT | Yes | References Country |
| Address | postalCode | TEXT | VARCHAR(20) | Yes | ZIP / PIN code |
| Address | latitude | REAL | DECIMAL(10,7) | Yes | GPS latitude |
| Address | longitude | REAL | DECIMAL(10,7) | Yes | GPS longitude |
| Status | isDefault | INTEGER | BOOLEAN | No | Default address of this type |
| Status | isActive | INTEGER | BOOLEAN | No | Active status |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Foreign Key (partyId → Party.id)
- Foreign Key (cityId → City.id)
- Foreign Key (stateId → State.id)
- Foreign Key (countryId → Country.id)
- Unique (uuid)
- CHECK addressType IN ('BILLING','SHIPPING','HOME','OFFICE','WAREHOUSE')
- version >= 1

---

## Indexes

- PK_PartyAddress (id)
- UK_PartyAddress_UUID (uuid)
- IDX_PartyAddress_Party
- IDX_PartyAddress_AddressType
- IDX_PartyAddress_City
- IDX_PartyAddress_State
- IDX_PartyAddress_Default
- IDX_PartyAddress_Active

---

## Sample Records

| id | partyId | addressType | addressLine1 | cityId | stateId | postalCode | isDefault |
|----|---------|-------------|--------------|--------|---------|------------|-----------|
| 1 | 1 | HOME | 12 MG Road | 101 | 21 | 411001 | Yes |
| 2 | 1 | BILLING | ABC Plaza, FC Road | 101 | 21 | 411004 | No |
| 3 | 2 | OFFICE | Pharma Industrial Estate | 101 | 21 | 411038 | Yes |

---

## Prisma Model

```prisma
model PartyAddress {
  id            BigInt   @id @default(autoincrement())
  partyId       BigInt

  uuid          String   @unique @db.Uuid

  addressType   String

  addressLine1  String
  addressLine2  String?

  landmark      String?
  area          String?

  cityId        BigInt?
  stateId       BigInt?
  countryId     BigInt?

  postalCode    String?

  latitude      Float?
  longitude     Float?

  isDefault     Boolean  @default(false)
  isActive      Boolean  @default(true)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?

  version       Int      @default(1)

  party         Party    @relation(fields: [partyId], references: [id])

  @@index([partyId])
  @@index([addressType])
  @@index([cityId])
  @@index([stateId])
  @@index([isDefault])
  @@index([isActive])
}
```

---

## Notes

- Stores all addresses for every Party in the ERP.
- A Party may have multiple addresses of different types.
- Geographic master tables (Country, State, City, Area) should be referenced wherever possible instead of storing free-text values.
- GPS coordinates enable delivery routing and map integration.
- Supports offline-first synchronization using UUID.
- Designed to remain compatible with both SQLite and PostgreSQL.
