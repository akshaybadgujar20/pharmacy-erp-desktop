# Company

## Purpose

The Company table stores the master information of the organization operating the Pharmacy ERP.

It contains legal, tax, licensing, contact, and branding information used throughout the application, including invoices, purchase documents, reports, taxation, and regulatory compliance.

Normally, a Pharmacy ERP contains **one Company** with one or more Branches.

---

## Business Rules

- Every Company has a unique Company Code.
- Company Name must be unique.
- A Company can have multiple Branches.
- Only one Company can be marked as the Default Company.
- GST Number and Drug License Number should be unique where applicable.
- Company records are rarely modified and should be audited.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Company
    │
    ├────────► Branch
    ├────────► FinancialYear
    ├────────► SequenceGenerator
    ├────────► AppSetting
    └────────► PrinterConfiguration
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Business | companyCode | TEXT | VARCHAR(20) | No | Unique company code |
| Business | companyName | TEXT | VARCHAR(200) | No | Legal company name |
| Business | displayName | TEXT | VARCHAR(200) | No | Display name used in reports |
| Business | gstNumber | TEXT | VARCHAR(30) | Yes | GST registration number |
| Business | panNumber | TEXT | VARCHAR(20) | Yes | PAN number |
| Business | drugLicenseNumber | TEXT | VARCHAR(50) | Yes | Drug license number |
| Business | email | TEXT | VARCHAR(100) | Yes | Company email |
| Business | phoneNumber | TEXT | VARCHAR(30) | Yes | Contact number |
| Business | website | TEXT | VARCHAR(200) | Yes | Website URL |
| Business | logoPath | TEXT | VARCHAR(500) | Yes | Company logo |
| Address | addressLine1 | TEXT | VARCHAR(200) | Yes | Address line 1 |
| Address | addressLine2 | TEXT | VARCHAR(200) | Yes | Address line 2 |
| Address | city | TEXT | VARCHAR(100) | Yes | City |
| Address | state | TEXT | VARCHAR(100) | Yes | State |
| Address | country | TEXT | VARCHAR(100) | Yes | Country |
| Address | pinCode | TEXT | VARCHAR(20) | Yes | Postal code |
| Status | isDefault | INTEGER | BOOLEAN | No | Default company |
| Status | isActive | INTEGER | BOOLEAN | No | Active status |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- Unique (companyCode)
- Unique (companyName)
- Unique (gstNumber)
- CHECK (version >= 1)

---

## Indexes

- PK_Company
- UK_Company_UUID
- UK_Company_Code
- UK_Company_Name
- IDX_Company_GST
- IDX_Company_Active

---

## Sample Records

| id | companyCode | companyName | gstNumber | isDefault |
|----|-------------|-------------|-----------|-----------|
| 1 | CMP001 | ABC Pharma Pvt. Ltd. | 27ABCDE1234F1Z5 | Yes |

---

## Prisma Model

```prisma
model Company {
  id                  BigInt   @id @default(autoincrement())

  uuid                String   @unique @db.Uuid

  companyCode         String   @unique
  companyName         String   @unique
  displayName         String

  gstNumber           String?  @unique
  panNumber           String?
  drugLicenseNumber   String?

  email               String?
  phoneNumber         String?
  website             String?

  logoPath            String?

  addressLine1        String?
  addressLine2        String?
  city                String?
  state               String?
  country             String?
  pinCode             String?

  isDefault           Boolean  @default(true)
  isActive            Boolean  @default(true)

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  deletedAt           DateTime?

  version             Int      @default(1)

  branches            Branch[]
  financialYears      FinancialYear[]

  @@index([gstNumber])
  @@index([isActive])
}
```

---

## Notes

- Represents the **legal organization** owning the ERP.
- Branches operate under a single Company.
- Company information is printed on invoices, purchase orders, receipts, reports, GST documents, and statutory forms.
- Changes to Company details should be restricted to administrators and fully audited.
- Company records should rarely change after implementation.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
