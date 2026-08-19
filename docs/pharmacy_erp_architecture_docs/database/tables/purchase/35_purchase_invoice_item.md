# PurchaseInvoiceItem

## Purpose

The PurchaseInvoiceItem table stores the individual medicines billed in a supplier's Purchase Invoice.

Each record represents one line item within the Purchase Invoice and contains medicine, batch, quantity, pricing, taxes, discounts, and financial information.

When the ERP uses a **Goods Receipt (GRN)** process, this table primarily serves financial reconciliation. Inventory should already have been updated through the Goods Receipt process.

---

## Business Rules

- Every PurchaseInvoiceItem belongs to exactly one PurchaseInvoice.
- Every PurchaseInvoiceItem references one Medicine.
- Every PurchaseInvoiceItem references one Batch.
- Every PurchaseInvoiceItem may reference one GoodsReceiptItem.
- Invoice Quantity must be greater than zero.
- Unit Price cannot be negative.
- Invoice lines become read-only after posting.
- Financial totals should always equal the PurchaseInvoice totals.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
PurchaseInvoice (1)
        │
        └──────< PurchaseInvoiceItem (Many)
                      │
                      ├────────► GoodsReceiptItem
                      ├────────► Medicine
                      ├────────► Batch
                      ├────────► UnitOfMeasure
                      └────────► Tax
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Foreign Key | purchaseInvoiceId | INTEGER | BIGINT | No | References PurchaseInvoice.id |
| Foreign Key | goodsReceiptItemId | INTEGER | BIGINT | Yes | References GoodsReceiptItem.id |
| Foreign Key | medicineId | INTEGER | BIGINT | No | References Medicine.id |
| Foreign Key | batchId | INTEGER | BIGINT | No | References Batch.id |
| Foreign Key | unitId | INTEGER | BIGINT | No | References UnitOfMeasure.id |
| Business | lineNumber | INTEGER | INTEGER | No | Line sequence number |
| Quantity | invoiceQuantity | REAL | NUMERIC(14,3) | No | Invoiced quantity |
| Pricing | unitPrice | REAL | NUMERIC(12,2) | No | Purchase price per unit |
| Pricing | discountPercent | REAL | NUMERIC(5,2) | Yes | Discount percentage |
| Pricing | discountAmount | REAL | NUMERIC(12,2) | No | Discount amount |
| Pricing | taxPercent | REAL | NUMERIC(5,2) | Yes | Tax percentage |
| Pricing | taxAmount | REAL | NUMERIC(12,2) | No | Tax amount |
| Financial | lineAmount | REAL | NUMERIC(14,2) | No | Net line amount |
| Business | remarks | TEXT | TEXT | Yes | Line remarks |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Foreign Key (purchaseInvoiceId → PurchaseInvoice.id)
- Foreign Key (goodsReceiptItemId → GoodsReceiptItem.id)
- Foreign Key (medicineId → Medicine.id)
- Foreign Key (batchId → Batch.id)
- Foreign Key (unitId → UnitOfMeasure.id)
- Unique (uuid)
- CHECK (invoiceQuantity > 0)
- CHECK (unitPrice >= 0)
- CHECK (discountAmount >= 0)
- CHECK (taxAmount >= 0)
- CHECK (lineAmount >= 0)
- CHECK (version >= 1)

---

## Indexes

- PK_PurchaseInvoiceItem
- UK_PurchaseInvoiceItem_UUID
- IDX_PurchaseInvoiceItem_Invoice
- IDX_PurchaseInvoiceItem_GRItem
- IDX_PurchaseInvoiceItem_Medicine
- IDX_PurchaseInvoiceItem_Batch
- IDX_PurchaseInvoiceItem_LineNumber

---

## Sample Records

| id | purchaseInvoiceId | lineNumber | medicineId | batchId | invoiceQuantity | unitPrice | lineAmount |
|----|------------------:|-----------:|-----------:|--------:|----------------:|----------:|-----------:|
| 1 | 1 | 1 | 101 | 501 | 100.000 | 8.50 | 850.00 |
| 2 | 1 | 2 | 205 | 502 | 50.000 | 42.00 | 2100.00 |
| 3 | 2 | 1 | 310 | 503 | 20.000 | 125.00 | 2500.00 |

---

## Prisma Model

```prisma
model PurchaseInvoiceItem {
  id                    BigInt   @id @default(autoincrement())

  uuid                  String   @unique 

  purchaseInvoiceId      BigInt
  goodsReceiptItemId     BigInt?

  medicineId            BigInt
  batchId               BigInt
  unitId                BigInt

  lineNumber            Int

  invoiceQuantity       Decimal  

  unitPrice             Decimal  

  discountPercent       Decimal? 
  discountAmount        Decimal  @default(0) 

  taxPercent            Decimal? 
  taxAmount             Decimal  @default(0) 

  lineAmount            Decimal  

  remarks               String?

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  deletedAt             DateTime?

  version               Int      @default(1)

  purchaseInvoice       PurchaseInvoice   @relation(fields: [purchaseInvoiceId], references: [id])
  goodsReceiptItem      GoodsReceiptItem? @relation(fields: [goodsReceiptItemId], references: [id])
  medicine              Medicine          @relation(fields: [medicineId], references: [id])
  batch                 Batch             @relation(fields: [batchId], references: [id])
  unit                  UnitOfMeasure     @relation(fields: [unitId], references: [id])

  @@index([purchaseInvoiceId])
  @@index([goodsReceiptItemId])
  @@index([medicineId])
  @@index([batchId])
  @@index([lineNumber])
}
```

---

## Notes

- This is the **detail (line item)** table for the Purchase Invoice document.
- Each invoice item should normally reference the corresponding **GoodsReceiptItem** to support three-way matching (**Purchase Order → Goods Receipt → Purchase Invoice**).
- Inventory should **not** be updated from this table when the ERP uses a GRN process.
- Batch information is referenced rather than recreated.
- Financial values from all line items should reconcile with the PurchaseInvoice header totals.
- Historical invoice items should never be deleted after posting.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
