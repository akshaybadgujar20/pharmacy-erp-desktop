# City

## Purpose

The City table stores the master list of cities, towns, and municipalities within a State.

It standardizes geographical information used throughout the Pharmacy ERP for Companies, Branches, Customers, Suppliers, Doctors, Employees, and all address-related entities.

The City table represents the third level of the geographical hierarchy:

Country → State → City → Area

---

## Business Rules

- Every City belongs to exactly one State.
- City Code must be unique within a State.
- City Name must be unique within a State.
- Cities are lookup/master data and should rarely change.
- Inactive cities cannot be selected for new addresses.
- Existing business records referencing inactive cities remain valid.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Country
    │
    ▼
State (1)
    │
    └──────< City (Many)
                   │
                   ├────────► Area
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
| Foreign Key | stateId | INTEGER | BIGINT | No | References State.id |
| Business | cityCode | TEXT | VARCHAR(20) | No | Unique city code within the state |
| Business | cityName | TEXT | VARCHAR(100) | No | City name |
| Business | district | TEXT | VARCHAR(100) | Yes | Administrative district |
| Business | postalRegion | TEXT | VARCHAR(50) | Yes | Postal region/zone |
| Business | latitude | REAL | DOUBLE PRECISION | Yes | Latitude coordinate |
| Business | longitude | REAL | DOUBLE PRECISION | Yes | Longitude coordinate |
| Status | isActive | INTEGER | BOOLEAN | No | Active status |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- Foreign Key (stateId → State.id)
- Unique (stateId, cityCode)
- Unique (stateId, cityName)
- CHECK (version >= 1)

---

## Indexes

- PK_City
- UK_City_UUID
- UK_City_State_Code
- UK_City_State_Name
- IDX_City_State
- IDX_City_District
- IDX_City_Active

---

## Sample Records

| id | stateId | cityCode | cityName | district |
|----|--------:|----------|----------|----------|
| 1 | 1 | PUNE | Pune | Pune |
| 2 | 1 | MUM | Mumbai | Mumbai |
| 3 | 2 | AHD | Ahmedabad | Ahmedabad |

---

## Prisma Model

```prisma
model City {
  id            BigInt   @id @default(autoincrement())

  uuid          String   @unique @db.Uuid

  stateId       BigInt

  cityCode      String
  cityName      String

  district      String?

  postalRegion  String?

  latitude      Float?
  longitude     Float?

  isActive      Boolean  @default(true)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?

  version       Int      @default(1)

  state         State @relation(fields: [stateId], references: [id])

  areas         Area[]

  @@unique([stateId, cityCode])
  @@unique([stateId, cityName])

  @@index([stateId])
  @@index([district])
  @@index([isActive])
}
```

---

## Notes

- This is a **lookup/master table**.
- Every City belongs to one State.
- Geographic coordinates are optional but useful for delivery planning, GIS integration, and branch location mapping.
- City master data should normally be imported from official government datasets.
- City records should not be deleted after implementation.
- Changes should be audited using AuditLog and ChangeHistory.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
