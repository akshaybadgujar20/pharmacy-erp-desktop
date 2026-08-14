# Country

## Purpose

The Country table stores the master list of countries used throughout the Pharmacy ERP.

It provides standardized country information for addresses, taxation, reporting, licensing, suppliers, customers, employees, and branches.

The Country table is referenced by State, Company, Branch, PartyAddress, and other address-related entities.

---

## Business Rules

- Every Country has a unique Country Code.
- ISO Alpha-2 and Alpha-3 codes should be unique.
- Country records are reference data and should rarely change.
- Inactive countries cannot be selected for new records.
- Existing transactions referencing inactive countries remain valid.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Country
    │
    ├────────► State
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
| Business | countryCode | TEXT | VARCHAR(10) | No | Unique country code |
| Business | isoAlpha2 | TEXT | CHAR(2) | No | ISO 3166-1 Alpha-2 code |
| Business | isoAlpha3 | TEXT | CHAR(3) | No | ISO 3166-1 Alpha-3 code |
| Business | countryName | TEXT | VARCHAR(100) | No | Country name |
| Business | nationality | TEXT | VARCHAR(100) | Yes | Nationality/Demonym |
| Business | phoneCode | TEXT | VARCHAR(10) | Yes | International dialing code |
| Business | currencyCode | TEXT | CHAR(3) | Yes | ISO currency code |
| Business | timezone | TEXT | VARCHAR(100) | Yes | Default timezone |
| Status | isActive | INTEGER | BOOLEAN | No | Active status |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- Unique (countryCode)
- Unique (isoAlpha2)
- Unique (isoAlpha3)
- CHECK (LENGTH(isoAlpha2) = 2)
- CHECK (LENGTH(isoAlpha3) = 3)
- CHECK (version >= 1)

---

## Indexes

- PK_Country
- UK_Country_UUID
- UK_Country_Code
- UK_Country_ISO2
- UK_Country_ISO3
- IDX_Country_Name
- IDX_Country_Active

---

## Sample Records

| id | countryCode | isoAlpha2 | isoAlpha3 | countryName | currencyCode |
|----|-------------|-----------|-----------|-------------|--------------|
| 1 | IN | IN | IND | India | INR |
| 2 | US | US | USA | United States | USD |
| 3 | GB | GB | GBR | United Kingdom | GBP |

---

## Prisma Model

```prisma
model Country {
  id             BigInt   @id @default(autoincrement())

  uuid           String   @unique @db.Uuid

  countryCode    String   @unique

  isoAlpha2      String   @unique
  isoAlpha3      String   @unique

  countryName    String

  nationality    String?

  phoneCode      String?

  currencyCode   String?

  timezone       String?

  isActive       Boolean  @default(true)

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  deletedAt      DateTime?

  version        Int      @default(1)

  states         State[]

  @@index([countryName])
  @@index([isActive])
}
```

---

## Notes

- This is a **reference/master table**.
- Country records should normally be loaded from the ISO 3166 standard.
- Country master data is shared across all ERP modules.
- Country records should not be deleted after implementation.
- Changes should be audited using AuditLog and ChangeHistory.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
