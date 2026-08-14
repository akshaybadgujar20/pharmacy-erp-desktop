# Ledger

## Purpose

The Ledger table represents the Chart of Accounts (COA) for the Pharmacy ERP.

Every financial transaction in the ERP ultimately impacts one or more Ledger accounts through LedgerEntry records.

Examples include:

- Cash
- Bank
- Customer Receivable
- Supplier Payable
- Sales Revenue
- Purchase Account
- GST Input
- GST Output
- Inventory Asset
- Expense Accounts

The Ledger table defines the financial accounts, while actual debit and credit transactions are stored in LedgerEntry.

---

## Business Rules

- Every Ledger account has a unique Ledger Code.
- Ledger hierarchy is supported through Parent Ledger.
- System-defined Ledgers cannot be deleted.
- Transactions are stored only in LedgerEntry.
- Ledger balances are derived from LedgerEntry.
- A Ledger may have multiple child Ledgers.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Ledger
   │
   ├──────< Ledger (Parent → Child)
   │
   └──────< LedgerEntry
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Business | ledgerCode | TEXT | VARCHAR(30) | No | Unique ledger code |
| Business | ledgerName | TEXT | VARCHAR(150) | No | Ledger name |
| Business | ledgerType | TEXT | VARCHAR(30) | No | ASSET, LIABILITY, INCOME, EXPENSE, EQUITY |
| Foreign Key | parentLedgerId | INTEGER | BIGINT | Yes | Parent Ledger |
| Business | normalBalance | TEXT | VARCHAR(10) | No | DEBIT or CREDIT |
| Business | isSystem | INTEGER | BOOLEAN | No | System-defined ledger |
| Business | isActive | INTEGER | BOOLEAN | No | Active ledger |
| Business | description | TEXT | TEXT | Yes | Ledger description |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- Unique (ledgerCode)
- Foreign Key (parentLedgerId → Ledger.id)
- CHECK (ledgerType IN ('ASSET','LIABILITY','INCOME','EXPENSE','EQUITY'))
- CHECK (normalBalance IN ('DEBIT','CREDIT'))
- CHECK (version >= 1)

---

## Indexes

- PK_Ledger
- UK_Ledger_UUID
- UK_Ledger_Code
- IDX_Ledger_Parent
- IDX_Ledger_Type
- IDX_Ledger_Active

---

## Sample Records

| id | ledgerCode | ledgerName | ledgerType | normalBalance |
|----|------------|------------|------------|---------------|
| 1 | CASH001 | Cash in Hand | ASSET | DEBIT |
| 2 | BANK001 | HDFC Bank | ASSET | DEBIT |
| 3 | SALE001 | Sales Revenue | INCOME | CREDIT |
| 4 | PUR001 | Purchase Account | EXPENSE | DEBIT |
| 5 | SUP001 | Supplier Payable | LIABILITY | CREDIT |

---

## Prisma Model

```prisma
model Ledger {
  id                BigInt   @id @default(autoincrement())

  uuid              String   @unique @db.Uuid

  ledgerCode        String   @unique
  ledgerName        String

  ledgerType        String

  parentLedgerId    BigInt?

  normalBalance     String

  isSystem          Boolean  @default(false)
  isActive          Boolean  @default(true)

  description       String?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  deletedAt         DateTime?

  version           Int      @default(1)

  parentLedger      Ledger?  @relation("LedgerHierarchy", fields: [parentLedgerId], references: [id])
  childLedgers      Ledger[] @relation("LedgerHierarchy")

  entries           LedgerEntry[]

  @@index([parentLedgerId])
  @@index([ledgerType])
  @@index([isActive])
}
```

---

## Notes

- This table represents the **Chart of Accounts (COA)**.
- Ledger balances should never be stored directly; they are calculated from **LedgerEntry** records.
- Parent-child hierarchy enables grouping (e.g., Current Assets → Cash → HDFC Bank).
- System ledgers (Cash, Sales, Inventory, GST, etc.) should not be deleted.
- Financial reports such as Trial Balance, Balance Sheet, Profit & Loss, and General Ledger are generated using Ledger and LedgerEntry.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
