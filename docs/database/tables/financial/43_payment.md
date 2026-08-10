# Payment

## Purpose

The Payment table is the **central payment transaction** table for the Pharmacy ERP.

Unlike `SalesPayment`, which is specific to customer invoice collections, the `Payment` table records all outgoing and incoming financial payments across the ERP.

Typical payment types include:

- Supplier Payment
- Customer Refund
- Employee Reimbursement
- Vendor Advance
- Expense Payment
- Purchase Refund
- Miscellaneous Payment

The table serves as the financial transaction master and integrates with the Ledger module.

---

## Business Rules

- Every Payment must have one Payment Type.
- A Payment may reference one business document (Purchase Invoice, Sales Return, Expense, etc.).
- Payment Amount must be greater than zero.
- Posted payments cannot be modified.
- Cancelled payments require reversal entries rather than deletion.
- Every completed payment creates corresponding Ledger Entries.
- Multiple payments may be made against a single business document.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Payment
    │
    ├────────► PurchaseInvoice
    ├────────► SalesReturn
    ├────────► Supplier
    ├────────► Customer
    ├────────► Receipt
    └────────► LedgerEntry
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Business | paymentNumber | TEXT | VARCHAR(30) | No | Unique payment number |
| Business | paymentType | TEXT | VARCHAR(30) | No | SUPPLIER_PAYMENT, CUSTOMER_REFUND, ADVANCE, EXPENSE, PURCHASE_REFUND |
| Business | paymentDate | DATETIME | TIMESTAMP | No | Payment date/time |
| Financial | amount | REAL | NUMERIC(14,2) | No | Payment amount |
| Business | paymentMethod | TEXT | VARCHAR(20) | No | CASH, UPI, CARD, CHEQUE, BANK_TRANSFER |
| Business | transactionReference | TEXT | VARCHAR(100) | Yes | Bank/UPI/Card reference |
| Business | referenceType | TEXT | VARCHAR(30) | Yes | PURCHASE_INVOICE, SALES_RETURN, EXPENSE, etc. |
| Business | referenceId | INTEGER | BIGINT | Yes | Referenced business document |
| Status | status | TEXT | VARCHAR(20) | No | PENDING, COMPLETED, FAILED, CANCELLED |
| Business | remarks | TEXT | TEXT | Yes | Payment remarks |
| Audit | createdBy | INTEGER | BIGINT | Yes | Employee creating payment |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- Unique (paymentNumber)
- CHECK (amount > 0)
- CHECK (paymentMethod IN ('CASH','UPI','CARD','CHEQUE','BANK_TRANSFER'))
- CHECK (status IN ('PENDING','COMPLETED','FAILED','CANCELLED'))
- CHECK (version >= 1)

---

## Indexes

- PK_Payment
- UK_Payment_UUID
- UK_Payment_Number
- IDX_Payment_Date
- IDX_Payment_Type
- IDX_Payment_Method
- IDX_Payment_Status
- IDX_Payment_Reference

---

## Sample Records

| id | paymentNumber | paymentType | paymentMethod | amount | status |
|----|---------------|-------------|---------------|-------:|--------|
| 1 | PAY250001 | SUPPLIER_PAYMENT | BANK_TRANSFER | 25,000.00 | COMPLETED |
| 2 | PAY250002 | CUSTOMER_REFUND | CASH | 450.00 | COMPLETED |
| 3 | PAY250003 | ADVANCE | UPI | 5,000.00 | PENDING |

---

## Prisma Model

```prisma
model Payment {
  id                     BigInt   @id @default(autoincrement())

  uuid                   String   @unique @db.Uuid

  paymentNumber          String   @unique

  paymentType            String
  paymentDate            DateTime

  amount                 Decimal  @db.Decimal(14,2)

  paymentMethod          String

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

  @@index([paymentDate])
  @@index([paymentType])
  @@index([paymentMethod])
  @@index([status])
  @@index([referenceType, referenceId])
}
```

---

## Notes

- This is the **central payment table** for all outgoing payments.
- Business-specific tables such as **SalesPayment** should reference or map to this table rather than duplicate payment logic.
- Every completed payment should create corresponding **LedgerEntry** records.
- Payment cancellation should create reversal accounting entries instead of modifying historical records.
- Supports partial and multiple payments against the same business document.
- Historical payment records should never be deleted.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
