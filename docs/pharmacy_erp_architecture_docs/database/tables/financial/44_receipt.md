# Receipt

## Purpose

The Receipt table records money received by the organization.

Unlike SalesPayment, which is specific to invoice collection, Receipt is the financial transaction document used by the accounting module.

Typical receipts include:

- Customer Payment
- Advance from Customer
- Interest Received
- Miscellaneous Income
- Refund from Supplier
- Deposit Received

Every completed Receipt generates corresponding Ledger Entries.

---

## Business Rules

- Every Receipt has one Receipt Type.
- A Receipt may reference one business document.
- Receipt Amount must be greater than zero.
- Posted Receipts cannot be modified.
- Cancelled Receipts require reversal Ledger Entries.
- Multiple Receipts may exist for one business document.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Receipt
    │
    ├────────► SalesInvoice
    ├────────► Customer
    ├────────► Payment
    └────────► LedgerEntry
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Business | receiptNumber | TEXT | VARCHAR(30) | No | Unique receipt number |
| Business | receiptType | TEXT | VARCHAR(30) | No | CUSTOMER_PAYMENT, ADVANCE, REFUND, INTEREST, OTHER |
| Business | receiptDate | DATETIME | TIMESTAMP | No | Receipt date and time |
| Financial | amount | REAL | NUMERIC(14,2) | No | Amount received |
| Business | receiptMethod | TEXT | VARCHAR(20) | No | CASH, UPI, CARD, CHEQUE, BANK_TRANSFER |
| Business | transactionReference | TEXT | VARCHAR(100) | Yes | Bank/UPI/Card reference |
| Business | referenceType | TEXT | VARCHAR(30) | Yes | SALES_INVOICE, CUSTOMER, PAYMENT, etc. |
| Business | referenceId | INTEGER | BIGINT | Yes | Referenced business document |
| Status | status | TEXT | VARCHAR(20) | No | PENDING, COMPLETED, CANCELLED, REVERSED |
| Business | remarks | TEXT | TEXT | Yes | Receipt remarks |
| Audit | createdBy | INTEGER | BIGINT | Yes | Employee recording receipt |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- Unique (receiptNumber)
- CHECK (amount > 0)
- CHECK (receiptMethod IN ('CASH','UPI','CARD','CHEQUE','BANK_TRANSFER'))
- CHECK (status IN ('PENDING','COMPLETED','CANCELLED','REVERSED'))
- CHECK (version >= 1)

---

## Indexes

- PK_Receipt
- UK_Receipt_UUID
- UK_Receipt_Number
- IDX_Receipt_Date
- IDX_Receipt_Type
- IDX_Receipt_Method
- IDX_Receipt_Status
- IDX_Receipt_Reference

---

## Sample Records

| id | receiptNumber | receiptType | receiptMethod | amount | status |
|----|---------------|-------------|---------------|-------:|--------|
| 1 | REC250001 | CUSTOMER_PAYMENT | CASH | 850.00 | COMPLETED |
| 2 | REC250002 | ADVANCE | UPI | 5,000.00 | COMPLETED |
| 3 | REC250003 | REFUND | BANK_TRANSFER | 2,500.00 | PENDING |

---

## Prisma Model

```prisma
model Receipt {
  id                     BigInt   @id @default(autoincrement())

  uuid                   String   @unique 

  receiptNumber          String   @unique

  receiptType            String
  receiptDate            DateTime

  amount                 Decimal  

  receiptMethod          String

  transactionReference   String?

  referenceType          String?
  referenceId            BigInt?

  status                 String

  remarks                String?

  createdBy              BigInt?

  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt
  deletedAt              DateTime?

  version                Int      @default(1)

  @@index([receiptDate])
  @@index([receiptType])
  @@index([receiptMethod])
  @@index([status])
  @@index([referenceType, referenceId])
}
```

---

## Notes

- This is the **central receipt transaction** table for all incoming money.
- Business modules (Sales, Customer Advances, Miscellaneous Income) should reference this table instead of implementing separate receipt logic.
- Every completed Receipt should generate corresponding **LedgerEntry** records.
- Receipt cancellation should create reversal accounting entries rather than modifying historical records.
- Supports partial receipts against invoices.
- Historical receipt records should never be deleted.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
