# GoodsReceiptItem

## Purpose

The GoodsReceiptItem table stores the individual medicines received in a Goods Receipt.

Each record represents one medicine batch received from the supplier and captures the batch number, manufacturing date, expiry date, quantity, and pricing information.

Posting a Goods Receipt Item results in:

- Batch creation (or update)
- StockMovement creation
- Stock update
- Purchase Order fulfillment update

---

## Business Rules

- Every GoodsReceiptItem belongs to exactly one GoodsReceipt.
- Every GoodsReceiptItem references one Medicine.
- Every GoodsReceiptItem may reference one PurchaseOrderItem.
- Batch Number is mandatory.
- Expiry Date is mandatory for medicines.
- Received Quantity must be greater than zero.
- Multiple batches of the same medicine may exist within one Goods Receipt.
- Posting the Goods Receipt creates or updates Batch records.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
GoodsReceipt (1)
      │
      └──────< GoodsReceiptItem (Many)
                    │
                    ├────────► PurchaseOrderItem
                    ├────────► Medicine
                    ├────────► UnitOfMeasure
                    ├────────► Batch
                    ├────────► Stock
                    └────────► StockMovement
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Foreign Key | goodsReceiptId | INTEGER | BIGINT | No | References GoodsReceipt.id |
| Foreign Key | purchaseOrderItemId | INTEGER | BIGINT | Yes | References PurchaseOrderItem.id |
| Foreign Key | medicineId | INTEGER | BIGINT | No | References Medicine.id |
| Foreign Key | unitId | INTEGER | BIGINT | No | References UnitOfMeasure.id |
| Business | lineNumber | INTEGER | INTEGER | No | Line sequence number |
| Product | batchNumber | TEXT | VARCHAR(50) | No | Manufacturer batch number |
| Product | manufacturingDate | DATE | DATE | Yes | Manufacturing date |
| Product | expiryDate | DATE | DATE | No | Expiry date |
| Quantity | receivedQuantity | REAL | NUMERIC(14,3) | No | Quantity received |
| Pricing | purchaseRate | REAL | NUMERIC(12,2) | No | Purchase rate |
| Pricing | mrp | REAL | NUMERIC(12,2) | No | Maximum Retail Price |
| Pricing | saleRate | REAL | NUMERIC(12,2) | No | Selling price |
| Financial | lineAmount | REAL | NUMERIC(14,2) | No | Line total amount |
| Business | remarks | TEXT | TEXT | Yes | Line remarks |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Foreign Key (goodsReceiptId → GoodsReceipt.id)
- Foreign Key (purchaseOrderItemId → PurchaseOrderItem.id)
- Foreign Key (medicineId → Medicine.id)
- Foreign Key (unitId → UnitOfMeasure.id)
- Unique (uuid)
- CHECK (receivedQuantity > 0)
- CHECK (purchaseRate >= 0)
- CHECK (mrp >= 0)
- CHECK (saleRate >= 0)
- CHECK (expiryDate >= manufacturingDate)
- CHECK (version >= 1)

---

## Indexes

- PK_GoodsReceiptItem
- UK_GoodsReceiptItem_UUID
- IDX_GoodsReceiptItem_GR
- IDX_GoodsReceiptItem_POItem
- IDX_GoodsReceiptItem_Medicine
- IDX_GoodsReceiptItem_Batch
- IDX_GoodsReceiptItem_Expiry

---

## Sample Records

| id | goodsReceiptId | lineNumber | medicineId | batchNumber | expiryDate | receivedQuantity |
|----|----------------|-----------:|-----------:|-------------|------------|-----------------:|
| 1 | 1 | 1 | 101 | PCM240101 | 2027-01-31 | 100.000 |
| 2 | 1 | 2 | 205 | AUG240220 | 2026-12-31 | 50.000 |
| 3 | 2 | 1 | 310 | CET240301 | 2028-03-31 | 25.000 |

---

## Prisma Model

```prisma
model GoodsReceiptItem {
  id                    BigInt   @id @default(autoincrement())

  uuid                  String   @unique 

  goodsReceiptId        BigInt
  purchaseOrderItemId   BigInt?

  medicineId            BigInt
  unitId                BigInt

  lineNumber            Int

  batchNumber           String

  manufacturingDate     DateTime?
  expiryDate            DateTime

  receivedQuantity      Decimal  

  purchaseRate          Decimal  
  mrp                   Decimal  
  saleRate              Decimal  

  lineAmount            Decimal  

  remarks               String?

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  deletedAt             DateTime?

  version               Int      @default(1)

  goodsReceipt          GoodsReceipt      @relation(fields: [goodsReceiptId], references: [id])
  purchaseOrderItem     PurchaseOrderItem? @relation(fields: [purchaseOrderItemId], references: [id])
  medicine              Medicine          @relation(fields: [medicineId], references: [id])
  unit                  UnitOfMeasure     @relation(fields: [unitId], references: [id])

  @@index([goodsReceiptId])
  @@index([purchaseOrderItemId])
  @@index([medicineId])
  @@index([batchNumber])
  @@index([expiryDate])
}
```

---

## Notes

- This is the **detail (line item)** table for the Goods Receipt document.
- Each line normally results in the creation of a **Batch** (or updates an existing batch if permitted by business rules).
- Posting a Goods Receipt Item should:
  - Update the corresponding **PurchaseOrderItem.receivedQuantity**.
  - Create or update the **Batch**.
  - Create an **IN** StockMovement.
  - Update the current **Stock** balance.
- Batch-level information is captured here because different batches of the same medicine may be received in a single delivery.
- Historical Goods Receipt Items should never be deleted after posting.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
