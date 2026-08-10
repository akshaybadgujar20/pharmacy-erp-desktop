# Area

## Purpose

The Area table stores localities, suburbs, villages, sectors, or neighborhoods within a City.

It provides the lowest level of geographical master data used throughout the Pharmacy ERP for address management, delivery routing, customer segmentation, taxation, and logistics.

The Area table completes the geographical hierarchy:

Country → State → City → Area

---

## Business Rules

- Every Area belongs to exactly one City.
- Area Code must be unique within a City.
- Area Name must be unique within a City.
- Areas are lookup/master data and rarely change.
- Inactive Areas cannot be selected for new addresses.
- Existing business records referencing inactive Areas remain valid.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Country
    │
    ▼
State
    │
    ▼
City (1)
    │
    └──────< Area (Many)
                   │
                   ├────────► Company
                   ├────────► Branch
                   ├────────► PartyAddress
                   ├────────► Customer
                   ├────────► Supplier
                   └────────► Delivery Address
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Foreign Key | cityId | INTEGER | BIGINT | No | References City.id |
| Business | areaCode | TEXT | VARCHAR(20) | No | Unique area code within the city |
| Business | areaName | TEXT | VARCHAR(150) | No | Area/locality name |
| Business | postalCode | TEXT | VARCHAR(10) | Yes | PIN/ZIP code |
| Business | deliveryZone | TEXT | VARCHAR(50) | Yes | Delivery zone identifier |
| Business | routeCode | TEXT | VARCHAR(30) | Yes | Delivery route code |
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
- Foreign Key (cityId → City.id)
- Unique (cityId, areaCode)
- Unique (cityId, areaName)
- CHECK (version >= 1)

---

## Indexes

- PK_Area
- UK_Area_UUID
- UK_Area_City_Code
- UK_Area_City_Name
- IDX_Area_City
- IDX_Area_PostalCode
- IDX_Area_DeliveryZone
- IDX_Area_Active

---

## Sample Records

| id | cityId | areaCode | areaName | postalCode |
|----|-------:|----------|----------|------------|
| 1 | 1 | KOTHRUD | Kothrud | 411038 |
| 2 | 1 | BANER | Baner | 411045 |
| 3 | 2 | ANDHERI | Andheri West | 400058 |

---

## Prisma Model

```prisma
model Area {
  id              BigInt   @id @default(autoincrement())

  uuid            String   @unique @db.Uuid

  cityId          BigInt

  areaCode        String
  areaName        String

  postalCode      String?

  deliveryZone    String?
  routeCode       String?

  latitude        Float?
  longitude       Float?

  isActive        Boolean  @default(true)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  deletedAt       DateTime?

  version         Int      @default(1)

  city            City @relation(fields: [cityId], references: [id])

  @@unique([cityId, areaCode])
  @@unique([cityId, areaName])

  @@index([cityId])
  @@index([postalCode])
  @@index([deliveryZone])
  @@index([isActive])
}
```

---

## Notes

- This is the **lowest-level geographical lookup table**.
- Every Area belongs to exactly one City.
- PIN/ZIP codes may span multiple Areas; therefore, postalCode should not be unique.
- Delivery zones and route codes can be used for home delivery optimization.
- Area master data should not be deleted after implementation.
- Changes should be tracked through AuditLog and ChangeHistory.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
