# PurchaseInvoice

## Purpose

The PurchaseInvoice table stores supplier invoices received for purchased medicines and products.

A Purchase Invoice represents the financial document issued by the supplier. It records the payable amount, taxes, discounts, and payment status.

Inventory should normally already be updated through the Goods Receipt process. The Purchase Invoice is primarily used for accounting, supplier reconciliation, and payment processing.

---

## Business Rules

- Every Purchase Invoice belongs to one Supplier.
- A Purchase Invoice may reference one Goods Receipt.
- A Goods Receipt can generate one or more Purchase Invoices.
- Purchase Invoice must contain at least one PurchaseInvoiceItem.
- Supplier Invoice Number should be unique per Supplier.
- Posted invoices cannot be modified.
- Cancelled invoices require reversal accounting entries.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Supplier
     │
     ▼
PurchaseInvoice
     │
     ├──────< PurchaseInvoiceItem
     │
     ├────────► GoodsReceipt
     ├────────► Payment
     └────────► LedgerEntry
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Business | purchaseInvoiceNumber | TEXT | VARCHAR(30) | No | Internal purchase invoice number |
| Business | supplierInvoiceNumber | TEXT | VARCHAR(50) | No | Supplier invoice number |
| Foreign Key | supplierId | INTEGER | BIGINT | No | References Supplier.id |
| Foreign Key | goodsReceiptId | INTEGER | BIGINT | Yes | References GoodsReceipt.id |
| Foreign Key | branchId | INTEGER | BIGINT | No | Receiving branch |
| Business | invoiceDate | DATE | DATE | No | Supplier invoice date |
| Business | dueDate | DATE | DATE | Yes | Payment due date |
| Financial | grossAmount | REAL | NUMERIC(14,2) | No | Gross amount |
| Financial | discountAmount | REAL | NUMERIC(14,2) | No | Total discount |
| Financial | taxAmount | REAL | NUMERIC(14,2) | No | Total tax |
| Financial | netAmount | REAL | NUMERIC(14,2) | No | Net payable amount |
| Financial | paidAmount | REAL | NUMERIC(14,2) | No | Amount paid |
| Financial | balanceAmount | REAL | NUMERIC(14,2) | No | Outstanding balance |
| Status | status | TEXT | VARCHAR(20) | No | DRAFT, POSTED, PARTIALLY_PAID, PAID, CANCELLED |
| Business | remarks | TEXT | TEXT | Yes | Invoice remarks |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- Unique (branchId, purchaseInvoiceNumber) — document numbers are unique per branch, not globally
- Unique (supplierId, supplierInvoiceNumber)
- Foreign Key (supplierId → Supplier.id)
- Foreign Key (goodsReceiptId → GoodsReceipt.id)
- Foreign Key (branchId → Branch.id)
- CHECK (grossAmount >= 0)
- CHECK (netAmount >= 0)
- CHECK (paidAmount >= 0)
- CHECK (balanceAmount >= 0)
- CHECK (status IN ('DRAFT','POSTED','PARTIALLY_PAID','PAID','CANCELLED'))
- CHECK (version >= 1)

---

## Indexes

- PK_PurchaseInvoice
- UK_PurchaseInvoice_UUID
- UK_PurchaseInvoice_Number
- UK_PurchaseInvoice_SupplierInvoice
- IDX_PurchaseInvoice_Supplier
- IDX_PurchaseInvoice_Date
- IDX_PurchaseInvoice_Status
- IDX_PurchaseInvoice_DueDate

---

## Sample Records

| id | purchaseInvoiceNumber | supplierInvoiceNumber | supplierId | invoiceDate | netAmount | status |
|----|-----------------------|-----------------------|-----------:|-------------|----------:|--------|
| 1 | PI2500001 | INV-4587 | 12 | 2026-08-05 | 12,450.00 | POSTED |
| 2 | PI2500002 | APL-9982 | 18 | 2026-08-06 | 8,750.00 | PARTIALLY_PAID |
| 3 | PI2500003 | SUP-7788 | 12 | 2026-08-08 | 2,450.00 | DRAFT |

---

## Prisma Model

```prisma
model PurchaseInvoice {
  id                     BigInt   @id @default(autoincrement())

  uuid                   String   @unique 

  purchaseInvoiceNumber  String   @unique
  supplierInvoiceNumber  String

  supplierId             BigInt
  goodsReceiptId         BigInt?
  branchId               BigInt

  invoiceDate            DateTime
  dueDate                DateTime?

  grossAmount            Decimal  
  discountAmount         Decimal  @default(0) 
  taxAmount              Decimal  @default(0) 

  netAmount              Decimal  

  paidAmount             Decimal  @default(0) 
  balanceAmount          Decimal  

  status                 String

  remarks                String?

  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt
  deletedAt              DateTime?

  version                Int      @default(1)

  supplier               Supplier      @relation(fields: [supplierId], references: [id])
  goodsReceipt           GoodsReceipt? @relation(fields: [goodsReceiptId], references: [id])
  branch                 Branch        @relation(fields: [branchId], references: [id])

  items                  PurchaseInvoiceItem[]
  payments               Payment[]

  @@unique([supplierId, supplierInvoiceNumber])

  @@index([supplierId])
  @@index([goodsReceiptId])
  @@index([invoiceDate])
  @@index([status])
  @@index([dueDate])
}
```

---

## Notes

- This is the **header table** for supplier invoices.
- Individual medicines are stored in **PurchaseInvoiceItem**.
- The invoice represents the supplier's financial claim and forms the basis for Accounts Payable.
- Payments made to suppliers should reference this table.
- If the business follows a **GRN-based inventory process**, inventory should already be updated during Goods Receipt. Posting the Purchase Invoice should create accounting entries only and **must not** update stock again.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
