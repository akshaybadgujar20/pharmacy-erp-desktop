# FinancialYear

## Purpose

The FinancialYear table defines the accounting periods used by the Pharmacy ERP.

A Financial Year determines the valid accounting period for all financial and inventory transactions. It is used for sales, purchases, payments, ledger postings, stock valuation, and statutory reporting.

Typically, one Company has multiple Financial Years, but only one Financial Year is active for a Branch at any point in time.

---

## Business Rules

- Every Financial Year belongs to one Company.
- A Financial Year may optionally be assigned to one Branch.
- Financial Year Code must be unique within a Company.
- Only one Financial Year can be active for a Branch.
- Closed Financial Years cannot accept new transactions.
- Financial Years cannot overlap for the same Company.
- Opening balances are carried forward from the previous Financial Year.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Company (1)
      │
      └──────< FinancialYear (Many)
                     │
                     ├────────► Branch
                     ├────────► SalesInvoice
                     ├────────► PurchaseInvoice
                     ├────────► Payment
                     ├────────► Receipt
                     └────────► LedgerEntry
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Foreign Key | companyId | INTEGER | BIGINT | No | References Company.id |
| Foreign Key | branchId | INTEGER | BIGINT | Yes | References Branch.id |
| Business | financialYearCode | TEXT | VARCHAR(20) | No | Financial year code (e.g. FY2026-27) |
| Business | financialYearName | TEXT | VARCHAR(100) | No | Financial year name |
| Business | startDate | DATE | DATE | No | Financial year start date |
| Business | endDate | DATE | DATE | No | Financial year end date |
| Status | status | TEXT | VARCHAR(20) | No | OPEN, CLOSED, ARCHIVED |
| Status | isCurrent | INTEGER | BOOLEAN | No | Current active financial year |
| Business | closingDate | DATETIME | TIMESTAMP | Yes | Date financial year was closed |
| Business | remarks | TEXT | TEXT | Yes | Additional remarks |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- Foreign Key (companyId → Company.id)
- Foreign Key (branchId → Branch.id)
- Unique (companyId, financialYearCode)
- CHECK (endDate > startDate)
- CHECK (status IN ('OPEN','CLOSED','ARCHIVED'))
- CHECK (version >= 1)

---

## Indexes

- PK_FinancialYear
- UK_FinancialYear_UUID
- UK_FinancialYear_Company_Code
- IDX_FinancialYear_Company
- IDX_FinancialYear_Branch
- IDX_FinancialYear_Current
- IDX_FinancialYear_Status

---

## Sample Records

| id | companyId | financialYearCode | startDate | endDate | status | isCurrent |
|----|----------:|-------------------|-----------|----------|--------|-----------|
| 1 | 1 | FY2025-26 | 2025-04-01 | 2026-03-31 | CLOSED | No |
| 2 | 1 | FY2026-27 | 2026-04-01 | 2027-03-31 | OPEN | Yes |

---

## Prisma Model

```prisma
model FinancialYear {
  id                  BigInt   @id @default(autoincrement())

  uuid                String   @unique @db.Uuid

  companyId           BigInt
  branchId            BigInt?

  financialYearCode   String
  financialYearName   String

  startDate           DateTime
  endDate             DateTime

  status              String

  isCurrent           Boolean  @default(false)

  closingDate         DateTime?

  remarks             String?

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  deletedAt           DateTime?

  version             Int      @default(1)

  company             Company @relation(fields: [companyId], references: [id])
  branch              Branch? @relation(fields: [branchId], references: [id])

  @@unique([companyId, financialYearCode])

  @@index([companyId])
  @@index([branchId])
  @@index([status])
  @@index([isCurrent])
}
```

---

## Notes

- Defines the accounting period for all ERP transactions.
- Financial Year closing should prevent posting of new transactions into the closed period.
- Opening balances for Ledger and Inventory should be carried forward to the next Financial Year during year-end processing.
- Reports such as Trial Balance, Profit & Loss, Balance Sheet, GST Returns, and Stock Valuation should always be generated within a Financial Year.
- Historical Financial Years should never be modified after closure.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
