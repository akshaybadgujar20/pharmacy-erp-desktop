# LedgerEntry

## Purpose

The LedgerEntry table stores all accounting transactions in the Pharmacy ERP.

Every financial event ultimately generates one or more LedgerEntry records.

Examples include:

- Sales Invoice
- Purchase Invoice
- Sales Return
- Purchase Return
- Customer Receipt
- Supplier Payment
- Expense
- Journal Entry
- Opening Balance
- Stock Adjustment

LedgerEntry is the source of truth for all financial reporting.

---

## Business Rules

- Every LedgerEntry belongs to exactly one Ledger.
- Every LedgerEntry belongs to one Voucher/Business Transaction.
- Every accounting transaction must be balanced.
- Total Debit must equal Total Credit for every Voucher.
- Ledger Entries cannot be edited after posting.
- Cancellation creates reversal entries instead of updates.
- Running Balance is optional and may be calculated.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Ledger (1)
     │
     └────────< LedgerEntry (Many)
                      │
                      ├── Receipt
                      ├── Payment
                      ├── PurchaseInvoice
                      ├── SalesInvoice
                      ├── PurchaseReturn
                      ├── SalesReturn
                      └── Journal Voucher
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Foreign Key | ledgerId | INTEGER | BIGINT | No | References Ledger.id |
| Business | voucherType | TEXT | VARCHAR(30) | No | SALES, PURCHASE, RECEIPT, PAYMENT, JOURNAL, OPENING |
| Business | voucherId | INTEGER | BIGINT | No | Source business document ID |
| Business | voucherNumber | TEXT | VARCHAR(30) | No | Business document number |
| Business | transactionDate | DATETIME | TIMESTAMP | No | Accounting transaction date |
| Financial | debitAmount | REAL | NUMERIC(14,2) | No | Debit amount |
| Financial | creditAmount | REAL | NUMERIC(14,2) | No | Credit amount |
| Financial | runningBalance | REAL | NUMERIC(14,2) | Yes | Running ledger balance |
| Business | narration | TEXT | TEXT | Yes | Transaction narration |
| Status | isPosted | INTEGER | BOOLEAN | No | Posted flag |
| Audit | createdBy | INTEGER | BIGINT | Yes | Employee posting entry |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- Foreign Key (ledgerId → Ledger.id)
- CHECK (debitAmount >= 0)
- CHECK (creditAmount >= 0)
- CHECK (NOT (debitAmount > 0 AND creditAmount > 0))
- CHECK (debitAmount > 0 OR creditAmount > 0)
- CHECK (version >= 1)

---

## Indexes

- PK_LedgerEntry
- UK_LedgerEntry_UUID
- IDX_LedgerEntry_Ledger
- IDX_LedgerEntry_Date
- IDX_LedgerEntry_Voucher
- IDX_LedgerEntry_Posted

---

## Sample Records

| id | ledgerId | voucherType | voucherNumber | debitAmount | creditAmount |
|----|---------:|-------------|---------------|------------:|-------------:|
| 1 | 1 | RECEIPT | REC250001 | 850.00 | 0.00 |
| 2 | 5 | RECEIPT | REC250001 | 0.00 | 850.00 |
| 3 | 3 | SALES | SI250001 | 0.00 | 5,250.00 |
| 4 | 6 | SALES | SI250001 | 5,250.00 | 0.00 |

---

## Prisma Model

```prisma
model LedgerEntry {
  id                BigInt   @id @default(autoincrement())

  uuid              String   @unique 

  ledgerId          BigInt

  voucherType       String
  voucherId         BigInt
  voucherNumber     String

  transactionDate   DateTime

  debitAmount       Decimal  @default(0) 
  creditAmount      Decimal  @default(0) 

  runningBalance    Decimal? 

  narration         String?

  isPosted          Boolean  @default(true)

  createdBy         BigInt?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  deletedAt         DateTime?

  version           Int      @default(1)

  ledger            Ledger @relation(fields: [ledgerId], references: [id])

  @@index([ledgerId])
  @@index([transactionDate])
  @@index([voucherType, voucherId])
  @@index([isPosted])
}
```

---

## Notes

- This table stores **all accounting postings**.
- Every business transaction should create one or more LedgerEntry records.
- Double-entry accounting must always be maintained:

  - Total Debit = Total Credit

- Ledger balances should be calculated from LedgerEntry records rather than stored directly.
- Historical LedgerEntry records must never be modified after posting.
- Reversals should be handled by creating opposite LedgerEntry records.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
