# Branch

## Purpose

The Branch table stores information about individual pharmacy locations operated by a Company.

A Branch represents a physical or virtual operating unit responsible for:

- Inventory
- Sales
- Purchases
- Financial Transactions
- Users
- Printers
- Daily Operations

Each Branch maintains its own inventory balances via the **Stock** table (`branchId` + `batchId`) while sharing org-global master data (Medicine, Batch) from the Company.

---

## Business Rules

- Every Branch belongs to exactly one Company.
- Branch Code must be unique within the Company.
- Only active branches can perform business transactions.
- Each transaction (Sales, Purchase, StockMovement, Payment) belongs to one Branch.
- Per-branch inventory is stored in **Stock** rows keyed by `(branchId, batchId)` — one Batch can have Stock at many branches.
- Branch GST Registration may differ depending on business requirements.
- Branch records are rarely deleted and should be audited.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Company (1)
      │
      └──────< Branch (Many)
                    │
                    ├────────► Stock (Many — one per batch per branch)
                    ├────────► StockMovement
                    ├────────► StockAdjustment
                    ├────────► User
                    ├────────► PurchaseInvoice
                    ├────────► SalesInvoice
                    ├────────► FinancialYear
                    ├────────► PrinterConfiguration
                    ├────────► BarcodeConfiguration
                    └────────► SequenceGenerator
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Foreign Key | companyId | INTEGER | BIGINT | No | References Company.id |
| Business | branchCode | TEXT | VARCHAR(20) | No | Unique branch code |
| Business | branchName | TEXT | VARCHAR(150) | No | Branch name |
| Business | displayName | TEXT | VARCHAR(150) | No | Display name |
| Business | gstNumber | TEXT | VARCHAR(30) | Yes | Branch GST registration |
| Business | drugLicenseNumber | TEXT | VARCHAR(50) | Yes | Drug license number |
| Business | email | TEXT | VARCHAR(100) | Yes | Email address |
| Business | phoneNumber | TEXT | VARCHAR(30) | Yes | Contact number |
| Address | addressLine1 | TEXT | VARCHAR(200) | Yes | Address line 1 |
| Address | addressLine2 | TEXT | VARCHAR(200) | Yes | Address line 2 |
| Address | city | TEXT | VARCHAR(100) | Yes | City |
| Address | state | TEXT | VARCHAR(100) | Yes | State |
| Address | country | TEXT | VARCHAR(100) | Yes | Country |
| Address | pinCode | TEXT | VARCHAR(20) | Yes | Postal code |
| Business | managerName | TEXT | VARCHAR(100) | Yes | Branch manager |
| Business | openingDate | DATE | DATE | Yes | Branch operational date |
| Status | isHeadOffice | INTEGER | BOOLEAN | No | Head office branch |
| Status | isActive | INTEGER | BOOLEAN | No | Active status |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- Foreign Key (companyId → Company.id)
- Unique (companyId, branchCode)
- CHECK (version >= 1)

---

## Indexes

- PK_Branch
- UK_Branch_UUID
- UK_Branch_Company_Code
- IDX_Branch_Company
- IDX_Branch_Active
- IDX_Branch_HeadOffice
- IDX_Branch_GST

---

## Sample Records

| id | companyId | branchCode | branchName | isHeadOffice | isActive |
|----|----------:|------------|------------|--------------|----------|
| 1 | 1 | HO | Head Office | Yes | Yes |
| 2 | 1 | PUN001 | Pune Branch | No | Yes |
| 3 | 1 | MUM001 | Mumbai Branch | No | Yes |

---

## Prisma Model

```prisma
model Branch {
  id                  BigInt   @id @default(autoincrement())

  uuid                String   @unique @default(uuid())

  companyId           BigInt

  branchCode          String
  branchName          String
  displayName         String

  gstNumber           String?
  drugLicenseNumber   String?

  email               String?
  phoneNumber         String?

  addressLine1        String?
  addressLine2        String?
  city                String?
  state               String?
  country             String?
  pinCode             String?

  managerName         String?

  openingDate         DateTime?

  isHeadOffice        Boolean  @default(false)
  isActive            Boolean  @default(true)

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  deletedAt           DateTime?

  version             Int      @default(1)

  company             Company @relation(fields: [companyId], references: [id])

  stocks                Stock[]
  stockMovements        StockMovement[]
  stockAdjustments      StockAdjustment[]
  priceLists            PriceList[]
  outboxEntries         Outbox[]

  @@unique([companyId, branchCode])

  @@index([companyId])
  @@index([isActive])
  @@index([isHeadOffice])
  @@index([gstNumber])
}
```

---

## Notes

- Represents one operational pharmacy location.
- Every Sales, Purchase, Inventory, and Financial transaction should reference a Branch.
- Inventory balances are maintained separately for each Branch via the **Stock** table (`@@unique([branchId, batchId])`).
- **Batch** is org-global (lot identity); **Stock** is branch-local (quantities).
- Branch-scoped sale pricing uses **PriceList** / **PriceListItem**, not Batch.
- Sequence generators, printers, barcode settings, and application settings may be branch-specific.
- Inter-branch stock movement should use the `StockTransfer` module.
- Historical Branch records should not be deleted.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
