# SalesPayment

## Purpose

The SalesPayment table records payments received against Sales Invoices.

It supports immediate payments for retail (cash sales), partial payments for credit customers, and multiple payment methods for a single invoice.

Typical payment methods include:

- Cash
- UPI
- Credit Card
- Debit Card
- Net Banking
- Cheque
- Credit Account
- Mixed Payment

---

## Business Rules

- Every Sales Payment belongs to one Sales Invoice.
- One Sales Invoice can have multiple Sales Payments.
- Payment Amount must be greater than zero.
- Total received payments cannot exceed the invoice amount unless excess payment handling is enabled.
- Posted payments cannot be edited.
- Cancelling a payment requires a reversal transaction.
- Every payment creates corresponding Ledger entries.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
SalesInvoice (1)
      │
      └──────< SalesPayment (Many)
                     │
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
| Foreign Key | salesInvoiceId | INTEGER | BIGINT | No | References SalesInvoice.id |
| Business | paymentNumber | TEXT | VARCHAR(30) | No | Unique payment number |
| Business | paymentDate | DATETIME | TIMESTAMP | No | Date and time of payment |
| Financial | paymentAmount | REAL | NUMERIC(14,2) | No | Amount received |
| Business | paymentMethod | TEXT | VARCHAR(20) | No | CASH, CARD, UPI, CHEQUE, BANK, CREDIT |
| Business | transactionReference | TEXT | VARCHAR(100) | Yes | Bank/UPI/Card reference |
| Business | bankName | TEXT | VARCHAR(100) | Yes | Bank name |
| Business | chequeNumber | TEXT | VARCHAR(50) | Yes | Cheque number |
| Business | chequeDate | DATE | DATE | Yes | Cheque date |
| Status | status | TEXT | VARCHAR(20) | No | PENDING, COMPLETED, FAILED, CANCELLED, REFUNDED |
| Business | remarks | TEXT | TEXT | Yes | Payment remarks |
| Audit | createdBy | INTEGER | BIGINT | Yes | Employee receiving payment |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- Unique (paymentNumber)
- Foreign Key (salesInvoiceId → SalesInvoice.id)
- CHECK (paymentAmount > 0)
- CHECK (paymentMethod IN ('CASH','CARD','UPI','CHEQUE','BANK','CREDIT'))
- CHECK (status IN ('PENDING','COMPLETED','FAILED','CANCELLED','REFUNDED'))
- CHECK (version >= 1)

---

## Indexes

- PK_SalesPayment
- UK_SalesPayment_UUID
- UK_SalesPayment_Number
- IDX_SalesPayment_Invoice
- IDX_SalesPayment_Date
- IDX_SalesPayment_Method
- IDX_SalesPayment_Status

---

## Sample Records

| id | paymentNumber | salesInvoiceId | paymentMethod | paymentAmount | status |
|----|---------------|---------------:|---------------|--------------:|--------|
| 1 | PAY2500001 | 101 | CASH | 850.00 | COMPLETED |
| 2 | PAY2500002 | 102 | UPI | 1,250.00 | COMPLETED |
| 3 | PAY2500003 | 103 | CREDIT | 500.00 | PENDING |

---

## Prisma Model

```prisma
model SalesPayment {
  id                     BigInt   @id @default(autoincrement())

  uuid                   String   @unique 

  salesInvoiceId         BigInt

  paymentNumber          String   @unique

  paymentDate            DateTime

  paymentAmount          Decimal  

  paymentMethod          String

  transactionReference   String?

  bankName               String?
  chequeNumber           String?
  chequeDate             DateTime?

  status                 String

  remarks                String?

  createdBy              BigInt?

  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt
  deletedAt              DateTime?

  version                Int      @default(1)

  salesInvoice           SalesInvoice @relation(fields: [salesInvoiceId], references: [id])

  @@index([salesInvoiceId])
  @@index([paymentDate])
  @@index([paymentMethod])
  @@index([status])
}
```

---

## Notes

- This table records **customer payments** against Sales Invoices.
- Multiple payments may be recorded for a single invoice.
- Credit sales can be settled over multiple payment transactions.
- Posting a completed payment should:
  - Update the `paidAmount` and `balanceAmount` of the SalesInvoice.
  - Create accounting entries in the Ledger.
  - Generate a Receipt document if required.
- Payment cancellation should create reversal accounting entries rather than deleting the payment.
- Historical payment records should never be deleted.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
