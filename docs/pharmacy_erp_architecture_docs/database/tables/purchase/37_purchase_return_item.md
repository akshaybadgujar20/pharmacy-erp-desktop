# PurchaseReturnItem

## Purpose

The PurchaseReturnItem table stores the individual medicines being returned to a supplier as part of a Purchase Return document.

Each record represents one medicine batch being returned and contains the quantity, batch information, pricing, taxes, and financial values. Posting a Purchase Return Item reduces inventory and creates the corresponding StockMovement and accounting entries.

---

## Business Rules

- Every PurchaseReturnItem belongs to exactly one PurchaseReturn.
- Every PurchaseReturnItem references one PurchaseInvoiceItem.
- Every PurchaseReturnItem references one Batch.
- Return Quantity must be greater than zero.
- Return Quantity cannot exceed the available quantity from the original Purchase Invoice.
- A returned batch must exist in inventory.
- Once approved, Purchase Return Items become read-only.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
PurchaseReturn (1)
        │
        └──────< PurchaseReturnItem (Many)
                      │
                      ├────────► PurchaseInvoiceItem
                      ├────────► Batch
                      ├────────► Medicine
                      ├────────► UnitOfMeasure
                      ├────────► StockMovement
                      └────────► LedgerEntry
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Foreign Key | purchaseReturnId | INTEGER | BIGINT | No | References PurchaseReturn.id |
| Foreign Key | purchaseInvoiceItemId | INTEGER | BIGINT | No | References PurchaseInvoiceItem.id |
| Foreign Key | medicineId | INTEGER | BIGINT | No | References Medicine.id |
| Foreign Key | batchId | INTEGER | BIGINT | No | References Batch.id |
| Foreign Key | unitId | INTEGER | BIGINT | No | References UnitOfMeasure.id |
| Business | lineNumber | INTEGER | INTEGER | No | Line sequence number |
| Quantity | returnQuantity | REAL | NUMERIC(14,3) | No | Quantity being returned |
| Pricing | unitPrice | REAL | NUMERIC(12,2) | No | Purchase price per unit |
| Pricing | discountAmount | REAL | NUMERIC(12,2) | No | Discount amount |
| Pricing | taxAmount | REAL | NUMERIC(12,2) | No | Tax amount |
| Financial | lineAmount | REAL | NUMERIC(14,2) | No | Net return amount |
| Business | returnReason | TEXT | TEXT | No | Item-level return reason |
| Business | remarks | TEXT | TEXT | Yes | Additional remarks |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Foreign Key (purchaseReturnId → PurchaseReturn.id)
- Foreign Key (purchaseInvoiceItemId → PurchaseInvoiceItem.id)
- Foreign Key (medicineId → Medicine.id)
- Foreign Key (batchId → Batch.id)
- Foreign Key (unitId → UnitOfMeasure.id)
- Unique (uuid)
- CHECK (returnQuantity > 0)
- CHECK (unitPrice >= 0)
- CHECK (lineAmount >= 0)
- CHECK (version >= 1)

---

## Indexes

- PK_PurchaseReturnItem
- UK_PurchaseReturnItem_UUID
- IDX_PurchaseReturnItem_Return
- IDX_PurchaseReturnItem_InvoiceItem
- IDX_PurchaseReturnItem_Batch
- IDX_PurchaseReturnItem_Medicine
- IDX_PurchaseReturnItem_LineNumber

---

## Sample Records

| id | purchaseReturnId | lineNumber | medicineId | batchId | returnQuantity | unitPrice | lineAmount |
|----|-----------------:|-----------:|-----------:|--------:|---------------:|----------:|-----------:|
| 1 | 1 | 1 | 101 | 501 | 10.000 | 8.50 | 85.00 |
| 2 | 1 | 2 | 205 | 502 | 5.000 | 42.00 | 210.00 |
| 3 | 2 | 1 | 310 | 503 | 2.000 | 125.00 | 250.00 |

---

## Prisma Model

```prisma
model PurchaseReturnItem {
  id                      BigInt   @id @default(autoincrement())

  uuid                    String   @unique 

  purchaseReturnId         BigInt
  purchaseInvoiceItemId    BigInt

  medicineId              BigInt
  batchId                 BigInt
  unitId                  BigInt

  lineNumber              Int

  returnQuantity          Decimal  

  unitPrice               Decimal  

  discountAmount          Decimal  @default(0) 
  taxAmount               Decimal  @default(0) 

  lineAmount              Decimal  

  returnReason            String
  remarks                 String?

  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt
  deletedAt               DateTime?

  version                 Int      @default(1)

  purchaseReturn          PurchaseReturn      @relation(fields: [purchaseReturnId], references: [id])
  purchaseInvoiceItem     PurchaseInvoiceItem @relation(fields: [purchaseInvoiceItemId], references: [id])
  medicine                Medicine            @relation(fields: [medicineId], references: [id])
  batch                   Batch               @relation(fields: [batchId], references: [id])
  unit                    UnitOfMeasure       @relation(fields: [unitId], references: [id])

  @@index([purchaseReturnId])
  @@index([purchaseInvoiceItemId])
  @@index([batchId])
  @@index([medicineId])
  @@index([lineNumber])
}
```

---

## Notes

- This is the **detail (line item)** table for the Purchase Return document.
- Every item should reference the original **PurchaseInvoiceItem** to ensure complete traceability.
- The returned **Batch** must be explicitly identified because returns are batch-specific in pharmacy operations.
- Posting a Purchase Return Item should:
  - Create an **OUT** StockMovement.
  - Reduce the current Stock quantity.
  - Reduce supplier payable or generate a supplier credit note.
- The system should prevent returning more than the quantity originally purchased, taking previous returns into account.
- Historical Purchase Return Items should never be deleted after approval.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
