# State

## Purpose

The State table stores the master list of states, provinces, or administrative regions within a Country.

It standardizes geographical information used by Companies, Branches, Customers, Suppliers, Doctors, Employees, and other address-related entities.

The State table acts as the second level of the geographical hierarchy:

Country → State → City → Area

---

## Business Rules

- Every State belongs to exactly one Country.
- State Code must be unique within a Country.
- State Name must be unique within a Country.
- States are reference/master data and rarely change.
- Inactive states cannot be selected for new addresses.
- Existing records referencing inactive states remain valid.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Country (1)
      │
      └──────< State (Many)
                    │
                    ├────────► City
                    ├────────► Company
                    ├────────► Branch
                    └────────► PartyAddress
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Foreign Key | countryId | INTEGER | BIGINT | No | References Country.id |
| Business | stateCode | TEXT | VARCHAR(10) | No | State code |
| Business | stateName | TEXT | VARCHAR(100) | No | State name |
| Business | gstStateCode | TEXT | VARCHAR(5) | Yes | GST State Code (India) |
| Business | isoCode | TEXT | VARCHAR(20) | Yes | ISO 3166-2 code |
| Status | isActive | INTEGER | BOOLEAN | No | Active status |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- Foreign Key (countryId → Country.id)
- Unique (countryId, stateCode)
- Unique (countryId, stateName)
- CHECK (version >= 1)

---

## Indexes

- PK_State
- UK_State_UUID
- UK_State_Code
- UK_State_Name
- IDX_State_Country
- IDX_State_Active

---

## Sample Records

| id | countryId | stateCode | stateName | gstStateCode |
|----|----------:|-----------|-----------|--------------|
| 1 | 1 | MH | Maharashtra | 27 |
| 2 | 1 | GJ | Gujarat | 24 |
| 3 | 1 | KA | Karnataka | 29 |

---

## Prisma Model

```prisma
model State {
  id             BigInt   @id @default(autoincrement())

  uuid           String   @unique @db.Uuid

  countryId      BigInt

  stateCode      String
  stateName      String

  gstStateCode   String?
  isoCode        String?

  isActive       Boolean  @default(true)

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  deletedAt      DateTime?

  version        Int      @default(1)

  country        Country @relation(fields: [countryId], references: [id])

  cities         City[]

  @@unique([countryId, stateCode])
  @@unique([countryId, stateName])

  @@index([countryId])
  @@index([isActive])
}
```

---

## Notes

- This is a **lookup/master table**.
- Each State belongs to exactly one Country.
- For India, GST State Code should be maintained for GST reporting and e-Invoicing.
- State records should normally be imported from official government or ISO sources.
- State master data should not be deleted after implementation.
- Changes should be audited using AuditLog and ChangeHistory.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
