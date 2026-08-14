# PurchaseOrderItem

## Purpose

The PurchaseOrderItem table stores the individual medicines and quantities requested in a Purchase Order.

Each record represents one line item within a Purchase Order. It contains product, quantity, pricing, tax, and discount information used for procurement.

---

## Business Rules

- Every PurchaseOrderItem belongs to exactly one PurchaseOrder.
- Every PurchaseOrderItem references one Medicine.
- Ordered Quantity must be greater than zero.
- Received Quantity cannot exceed Ordered Quantity.
- A Purchase Order can contain the same Medicine only once.
- Partial receipt is supported.
- Item prices remain fixed after approval.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
PurchaseOrder (1)
        │
        └──────< PurchaseOrderItem (Many)
                      │
                      ├────────► Medicine
                      ├────────► UnitOfMeasure
                      └────────► GoodsReceiptItem
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Foreign Key | purchaseOrderId | INTEGER | BIGINT | No | References PurchaseOrder.id |
| Foreign Key | medicineId | INTEGER | BIGINT | No | References Medicine.id |
| Foreign Key | unitId | INTEGER | BIGINT | No | References UnitOfMeasure.id |
| Business | lineNumber | INTEGER | INTEGER | No | Line sequence number |
| Quantity | orderedQuantity | REAL | NUMERIC(14,3) | No | Ordered quantity |
| Quantity | receivedQuantity | REAL | NUMERIC(14,3) | No | Quantity received |
| Pricing | unitPrice | REAL | NUMERIC(12,2) | No | Purchase price per unit |
| Pricing | discountPercent | REAL | NUMERIC(5,2) | Yes | Discount percentage |
| Pricing | taxPercent | REAL | NUMERIC(5,2) | Yes | Tax percentage |
| Financial | lineAmount | REAL | NUMERIC(14,2) | No | Net line amount |
| Status | isClosed | INTEGER | BOOLEAN | No | Item completely received |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Foreign Key (purchaseOrderId → PurchaseOrder.id)
- Foreign Key (medicineId → Medicine.id)
- Foreign Key (unitId → UnitOfMeasure.id)
- Unique (uuid)
- Unique (purchaseOrderId, medicineId)
- CHECK (orderedQuantity > 0)
- CHECK (receivedQuantity >= 0)
- CHECK (receivedQuantity <= orderedQuantity)
- CHECK (unitPrice >= 0)
- CHECK (version >= 1)

---

## Indexes

- PK_PurchaseOrderItem
- UK_PurchaseOrderItem_UUID
- UK_PurchaseOrderItem_PO_Medicine
- IDX_PurchaseOrderItem_PO
- IDX_PurchaseOrderItem_Medicine
- IDX_PurchaseOrderItem_LineNumber
- IDX_PurchaseOrderItem_Closed

---

## Sample Records

| id | purchaseOrderId | lineNumber | medicineId | orderedQuantity | receivedQuantity | unitPrice |
|----|-----------------|-----------:|-----------:|----------------:|-----------------:|----------:|
| 1 | 1 | 1 | 101 | 100.000 | 100.000 | 8.50 |
| 2 | 1 | 2 | 205 | 50.000 | 25.000 | 42.00 |
| 3 | 2 | 1 | 310 | 20.000 | 0.000 | 125.00 |

---

## Prisma Model

```prisma
model PurchaseOrderItem {
  id                 BigInt   @id @default(autoincrement())

  uuid               String   @unique @db.Uuid

  purchaseOrderId    BigInt
  medicineId         BigInt
  unitId             BigInt

  lineNumber         Int

  orderedQuantity    Decimal  @db.Decimal(14,3)
  receivedQuantity   Decimal  @default(0) @db.Decimal(14,3)

  unitPrice          Decimal  @db.Decimal(12,2)
  discountPercent    Decimal? @db.Decimal(5,2)
  taxPercent         Decimal? @db.Decimal(5,2)

  lineAmount         Decimal  @db.Decimal(14,2)

  isClosed           Boolean  @default(false)

  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  deletedAt          DateTime?

  version            Int      @default(1)

  purchaseOrder      PurchaseOrder @relation(fields: [purchaseOrderId], references: [id])
  medicine           Medicine      @relation(fields: [medicineId], references: [id])
  unit               UnitOfMeasure @relation(fields: [unitId], references: [id])

  @@unique([purchaseOrderId, medicineId])

  @@index([purchaseOrderId])
  @@index([medicineId])
  @@index([lineNumber])
  @@index([isClosed])
}
```

---

## Notes

- This is the **detail (line item)** table for Purchase Orders.
- One Purchase Order can contain multiple medicines.
- `receivedQuantity` is updated as Goods Receipts are processed.
- A line is considered complete when `receivedQuantity == orderedQuantity`.
- Batch information is **not** stored here; it is captured during **Goods Receipt/Purchase Invoice** processing.
- Inventory is **not** updated from this table.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
