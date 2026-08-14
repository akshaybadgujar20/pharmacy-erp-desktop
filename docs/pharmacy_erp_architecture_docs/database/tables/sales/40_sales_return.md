# SalesReturn

## Purpose

The SalesReturn table represents the **header document** for medicines and products returned by customers.

Sales Returns are created for situations such as:

- Wrong medicine dispensed
- Damaged product
- Defective medicine
- Customer cancellation
- Product recall
- Billing error
- Prescription change

Posting a Sales Return updates inventory, creates StockMovement records, reverses revenue where applicable, and generates customer refunds or credit notes.

---

## Business Rules

- Every Sales Return belongs to one Sales Invoice.
- Every Sales Return contains one or more SalesReturnItems.
- A Sales Invoice can have multiple Sales Returns.
- Return quantity cannot exceed the quantity originally sold.
- Medicines past their expiry date cannot be accepted unless permitted by company policy.
- Batch number must be identified for every returned medicine.
- Approved Sales Returns cannot be modified.
- Cancelling a return requires reversal inventory and accounting entries.
- Every approved Sales Return creates **IN** StockMovement records.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Customer
     │
     ▼
SalesInvoice
     │
     ▼
SalesReturn
     │
     ├──────< SalesReturnItem
     │
     ├────────► StockMovement
     ├────────► SalesPayment
     └────────► LedgerEntry
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Business | salesReturnNumber | TEXT | VARCHAR(30) | No | Internal return number |
| Foreign Key | salesInvoiceId | INTEGER | BIGINT | No | References SalesInvoice.id |
| Foreign Key | customerId | INTEGER | BIGINT | Yes | References Customer.id |
| Foreign Key | branchId | INTEGER | BIGINT | No | Branch accepting return |
| Business | returnDate | DATETIME | TIMESTAMP | No | Return date and time |
| Business | returnReason | TEXT | TEXT | No | Reason for return |
| Financial | totalAmount | REAL | NUMERIC(14,2) | No | Total return amount |
| Financial | refundAmount | REAL | NUMERIC(14,2) | No | Amount refunded |
| Status | status | TEXT | VARCHAR(20) | No | DRAFT, APPROVED, REFUNDED, CANCELLED |
| Business | remarks | TEXT | TEXT | Yes | General remarks |
| Foreign Key | approvedByEmployeeId | INTEGER | BIGINT | Yes | Approving employee |
| Business | approvedAt | DATETIME | TIMESTAMP | Yes | Approval timestamp |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- Unique (salesReturnNumber)
- Foreign Key (salesInvoiceId → SalesInvoice.id)
- Foreign Key (customerId → Customer.id)
- Foreign Key (branchId → Branch.id)
- Foreign Key (approvedByEmployeeId → Employee.id)
- CHECK (totalAmount >= 0)
- CHECK (refundAmount >= 0)
- CHECK (status IN ('DRAFT','APPROVED','REFUNDED','CANCELLED'))
- CHECK (version >= 1)

---

## Indexes

- PK_SalesReturn
- UK_SalesReturn_UUID
- UK_SalesReturn_Number
- IDX_SalesReturn_Invoice
- IDX_SalesReturn_Customer
- IDX_SalesReturn_Date
- IDX_SalesReturn_Status

---

## Sample Records

| id | salesReturnNumber | salesInvoiceId | customerId | returnDate | totalAmount | status |
|----|-------------------|---------------:|-----------:|------------|------------:|--------|
| 1 | SR2500001 | 101 | 205 | 2026-08-18 | 350.00 | APPROVED |
| 2 | SR2500002 | 102 | NULL | 2026-08-19 | 120.00 | REFUNDED |
| 3 | SR2500003 | 103 | 310 | 2026-08-20 | 890.00 | DRAFT |

---

## Prisma Model

```prisma
model SalesReturn {
  id                     BigInt   @id @default(autoincrement())

  uuid                   String   @unique @db.Uuid

  salesReturnNumber      String   @unique

  salesInvoiceId         BigInt
  customerId             BigInt?
  branchId               BigInt

  returnDate             DateTime

  returnReason           String

  totalAmount            Decimal  @db.Decimal(14,2)
  refundAmount           Decimal  @default(0) @db.Decimal(14,2)

  status                 String

  remarks                String?

  approvedByEmployeeId   BigInt?
  approvedAt             DateTime?

  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt
  deletedAt              DateTime?

  version                Int      @default(1)

  salesInvoice           SalesInvoice @relation(fields: [salesInvoiceId], references: [id])
  customer               Customer?    @relation(fields: [customerId], references: [id])
  branch                 Branch       @relation(fields: [branchId], references: [id])
  approvedBy             Employee?    @relation(fields: [approvedByEmployeeId], references: [id])

  items                  SalesReturnItem[]

  @@index([salesInvoiceId])
  @@index([customerId])
  @@index([branchId])
  @@index([returnDate])
  @@index([status])
}
```

---

## Notes

- This is the **header table** for Sales Return documents.
- Individual returned medicines are stored in **SalesReturnItem**.
- Posting a Sales Return should:
  - Create **IN** StockMovement records.
  - Update the Stock table.
  - Reverse revenue where applicable.
  - Generate customer refunds or store credit.
- Returned medicines should undergo quality checks before being added back to saleable inventory.
- Returned expired or damaged medicines should be routed to **StockAdjustment** instead of normal stock.
- Historical Sales Returns should never be deleted after approval.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
