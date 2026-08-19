# GoodsReceipt

## Purpose

The GoodsReceipt table records the physical receipt of goods from a supplier.

It confirms that the ordered medicines have arrived and captures the receipt transaction before supplier invoicing. Goods Receipt allows partial deliveries and serves as the basis for batch creation and inventory updates.

---

## Business Rules

- Every Goods Receipt belongs to one Supplier.
- A Goods Receipt may reference one Purchase Order.
- A Purchase Order can generate multiple Goods Receipts.
- Goods Receipt must contain at least one GoodsReceiptItem.
- Goods can be received without a Purchase Order only if company policy permits.
- Posting a Goods Receipt creates inventory batches and stock movements.
- Once posted, the document becomes read-only.
- Cancelled Goods Receipts require reversal transactions rather than deletion.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Supplier
     │
     ▼
PurchaseOrder
     │
     ▼
GoodsReceipt
     │
     ├──────< GoodsReceiptItem
     │
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
| Business | goodsReceiptNumber | TEXT | VARCHAR(30) | No | Unique GRN number |
| Foreign Key | purchaseOrderId | INTEGER | BIGINT | Yes | References PurchaseOrder.id |
| Foreign Key | supplierId | INTEGER | BIGINT | No | References Supplier.id |
| Foreign Key | branchId | INTEGER | BIGINT | No | Receiving branch |
| Business | receiptDate | DATETIME | TIMESTAMP | No | Goods receipt date |
| Business | supplierChallanNo | TEXT | VARCHAR(50) | Yes | Supplier delivery challan |
| Business | vehicleNumber | TEXT | VARCHAR(20) | Yes | Delivery vehicle |
| Status | status | TEXT | VARCHAR(20) | No | DRAFT, POSTED, CANCELLED |
| Business | remarks | TEXT | TEXT | Yes | General remarks |
| Foreign Key | receivedByEmployeeId | INTEGER | BIGINT | No | Employee receiving goods |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- Unique (goodsReceiptNumber)
- Foreign Key (purchaseOrderId → PurchaseOrder.id)
- Foreign Key (supplierId → Supplier.id)
- Foreign Key (branchId → Branch.id)
- Foreign Key (receivedByEmployeeId → Employee.id)
- CHECK (status IN ('DRAFT','POSTED','CANCELLED'))
- CHECK (version >= 1)

---

## Indexes

- PK_GoodsReceipt
- UK_GoodsReceipt_UUID
- UK_GoodsReceipt_Number
- IDX_GoodsReceipt_PO
- IDX_GoodsReceipt_Supplier
- IDX_GoodsReceipt_Date
- IDX_GoodsReceipt_Status

---

## Sample Records

| id | goodsReceiptNumber | purchaseOrderId | supplierId | receiptDate | status |
|----|--------------------|-----------------|------------|-------------|--------|
| 1 | GRN2500001 | 1 | 12 | 2026-08-05 | POSTED |
| 2 | GRN2500002 | 2 | 18 | 2026-08-06 | DRAFT |
| 3 | GRN2500003 | 1 | 12 | 2026-08-08 | POSTED |

---

## Prisma Model

```prisma
model GoodsReceipt {
  id                     BigInt   @id @default(autoincrement())

  uuid                   String   @unique 

  goodsReceiptNumber     String   @unique

  purchaseOrderId        BigInt?
  supplierId             BigInt
  branchId               BigInt

  receiptDate            DateTime

  supplierChallanNo      String?
  vehicleNumber          String?

  status                 String

  remarks                String?

  receivedByEmployeeId   BigInt

  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt
  deletedAt              DateTime?

  version                Int      @default(1)

  purchaseOrder          PurchaseOrder? @relation(fields: [purchaseOrderId], references: [id])
  supplier               Supplier       @relation(fields: [supplierId], references: [id])
  branch                 Branch         @relation(fields: [branchId], references: [id])
  receivedBy             Employee       @relation(fields: [receivedByEmployeeId], references: [id])

  items                  GoodsReceiptItem[]

  @@index([purchaseOrderId])
  @@index([supplierId])
  @@index([branchId])
  @@index([receiptDate])
  @@index([status])
}
```

---

## Notes

- This is the **header table** for goods receipt transactions.
- Individual medicines, batches, expiry dates, and received quantities belong in **GoodsReceiptItem**.
- Posting a Goods Receipt should:
  - Create Batch records (if new batches are received).
  - Create StockMovement entries.
  - Update the Stock table.
  - Update the received quantity in the related PurchaseOrderItem.
- Supplier invoices may be matched later through the **PurchaseInvoice** module.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
