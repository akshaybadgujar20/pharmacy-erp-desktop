# SalesInvoice

## Purpose

The SalesInvoice table represents the **header document** for customer billing.

It records the sale of medicines and healthcare products to customers and serves as the primary financial document for retail pharmacy transactions.

A Sales Invoice may be created:

- Against a Prescription
- As an OTC (Over-the-Counter) sale
- Against a Customer Order

Posting a Sales Invoice reduces inventory, generates stock movements, records customer receivables (if credit sale), and creates accounting entries.

---

## Business Rules

- Every Sales Invoice must contain at least one SalesInvoiceItem.
- Every Sales Invoice belongs to one Branch.
- Customer is optional for OTC cash sales.
- A Sales Invoice may reference a Prescription.
- Posted invoices cannot be edited.
- Cancelled invoices require reversal inventory and accounting entries.
- Every posted Sales Invoice generates StockMovement (OUT) records.
- Invoice numbers must be unique within the financial year.
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
     ├──────< SalesInvoiceItem
     │
     ├────────► Prescription
     ├────────► SalesPayment
     ├────────► LedgerEntry
     └────────► StockMovement
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Business | invoiceNumber | TEXT | VARCHAR(30) | No | Internal invoice number |
| Foreign Key | customerId | INTEGER | BIGINT | Yes | References Customer.id (NULL for walk-in customer) |
| Foreign Key | prescriptionId | INTEGER | BIGINT | Yes | References Prescription.id |
| Foreign Key | branchId | INTEGER | BIGINT | No | Selling branch |
| Business | invoiceDate | DATETIME | TIMESTAMP | No | Invoice date and time |
| Financial | grossAmount | REAL | NUMERIC(14,2) | No | Gross amount |
| Financial | discountAmount | REAL | NUMERIC(14,2) | No | Discount amount |
| Financial | taxAmount | REAL | NUMERIC(14,2) | No | Tax amount |
| Financial | netAmount | REAL | NUMERIC(14,2) | No | Net invoice amount |
| Financial | paidAmount | REAL | NUMERIC(14,2) | No | Amount received |
| Financial | balanceAmount | REAL | NUMERIC(14,2) | No | Outstanding amount |
| Business | paymentMode | TEXT | VARCHAR(20) | Yes | CASH, CARD, UPI, CREDIT, MIXED |
| Status | status | TEXT | VARCHAR(20) | No | DRAFT, POSTED, PARTIALLY_PAID, PAID, CANCELLED |
| Business | remarks | TEXT | TEXT | Yes | Invoice remarks |
| Audit | createdBy | INTEGER | BIGINT | Yes | Employee creating invoice |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- Unique (invoiceNumber)
- Foreign Key (customerId → Customer.id)
- Foreign Key (prescriptionId → Prescription.id)
- Foreign Key (branchId → Branch.id)
- CHECK (grossAmount >= 0)
- CHECK (netAmount >= 0)
- CHECK (paidAmount >= 0)
- CHECK (balanceAmount >= 0)
- CHECK (status IN ('DRAFT','POSTED','PARTIALLY_PAID','PAID','CANCELLED'))
- CHECK (version >= 1)

---

## Indexes

- PK_SalesInvoice
- UK_SalesInvoice_UUID
- UK_SalesInvoice_Number
- IDX_SalesInvoice_Customer
- IDX_SalesInvoice_Date
- IDX_SalesInvoice_Status
- IDX_SalesInvoice_Prescription
- IDX_SalesInvoice_Branch

---

## Sample Records

| id | invoiceNumber | customerId | prescriptionId | invoiceDate | netAmount | status |
|----|---------------|-----------:|---------------:|-------------|----------:|--------|
| 1 | SI2500001 | 105 | 210 | 2026-08-15 10:45 | 850.00 | PAID |
| 2 | SI2500002 | NULL | NULL | 2026-08-15 11:20 | 120.00 | PAID |
| 3 | SI2500003 | 132 | NULL | 2026-08-15 14:10 | 2,450.00 | PARTIALLY_PAID |

---

## Prisma Model

```prisma
model SalesInvoice {
  id                 BigInt   @id @default(autoincrement())

  uuid               String   @unique @db.Uuid

  invoiceNumber      String   @unique

  customerId         BigInt?
  prescriptionId     BigInt?
  branchId           BigInt

  invoiceDate        DateTime

  grossAmount        Decimal  @db.Decimal(14,2)
  discountAmount     Decimal  @default(0) @db.Decimal(14,2)
  taxAmount          Decimal  @default(0) @db.Decimal(14,2)
  netAmount          Decimal  @db.Decimal(14,2)

  paidAmount         Decimal  @default(0) @db.Decimal(14,2)
  balanceAmount      Decimal  @default(0) @db.Decimal(14,2)

  paymentMode        String?
  status             String

  remarks            String?

  createdBy          BigInt?

  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  deletedAt          DateTime?

  version            Int      @default(1)

  customer           Customer?
  prescription       Prescription?
  branch             Branch

  items              SalesInvoiceItem[]
  payments           SalesPayment[]

  @@index([customerId])
  @@index([prescriptionId])
  @@index([branchId])
  @@index([invoiceDate])
  @@index([status])
}
```

---

## Notes

- This is the **header table** for customer billing.
- Individual medicines are stored in **SalesInvoiceItem**.
- Posting a Sales Invoice should:
  - Create **OUT** StockMovement records.
  - Update the Stock table.
  - Create customer receivable entries for credit sales.
  - Generate accounting entries.
- OTC sales may not require a Customer or Prescription.
- Prescription-based sales should maintain a reference to the originating Prescription.
- Historical invoices must never be deleted after posting.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
