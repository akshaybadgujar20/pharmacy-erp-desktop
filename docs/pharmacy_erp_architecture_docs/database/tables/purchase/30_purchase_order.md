# PurchaseOrder

## Purpose

The PurchaseOrder table is the header document for procuring medicines and other products from suppliers.

A Purchase Order (PO) is created before goods are received and serves as the official request sent to a supplier.

It contains document-level information, while individual medicines are stored in the PurchaseOrderItem table.

---

## Business Rules

- Every Purchase Order must have at least one PurchaseOrderItem.
- Every Purchase Order belongs to one Supplier.
- Purchase Orders may be created without immediate approval.
- Only approved Purchase Orders can generate a Goods Receipt.
- A Purchase Order may be partially received.
- A Purchase Order may generate one or more Goods Receipts.
- Closed Purchase Orders cannot be modified.
- Cancelled Purchase Orders do not affect inventory.
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
     ├──────< PurchaseOrderItem
     │
     └────────► GoodsReceipt
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Business | purchaseOrderNumber | TEXT | VARCHAR(30) | No | Unique purchase order number |
| Foreign Key | supplierId | INTEGER | BIGINT | No | References Supplier.id |
| Foreign Key | branchId | INTEGER | BIGINT | No | Receiving branch |
| Business | orderDate | DATE | DATE | No | Purchase order date |
| Business | expectedDeliveryDate | DATE | DATE | Yes | Expected delivery date |
| Financial | totalAmount | REAL | NUMERIC(14,2) | No | Total PO amount |
| Financial | taxAmount | REAL | NUMERIC(14,2) | No | Total tax amount |
| Financial | discountAmount | REAL | NUMERIC(14,2) | No | Total discount amount |
| Status | status | TEXT | VARCHAR(20) | No | DRAFT, APPROVED, PARTIALLY_RECEIVED, RECEIVED, CANCELLED, CLOSED |
| Business | remarks | TEXT | TEXT | Yes | Remarks |
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
- Unique (purchaseOrderNumber)
- Foreign Key (supplierId → Supplier.id)
- Foreign Key (branchId → Branch.id)
- Foreign Key (approvedByEmployeeId → Employee.id)
- CHECK (totalAmount >= 0)
- CHECK (status IN ('DRAFT','APPROVED','PARTIALLY_RECEIVED','RECEIVED','CANCELLED','CLOSED'))
- CHECK (version >= 1)

---

## Indexes

- PK_PurchaseOrder
- UK_PurchaseOrder_UUID
- UK_PurchaseOrder_Number
- IDX_PurchaseOrder_Supplier
- IDX_PurchaseOrder_Date
- IDX_PurchaseOrder_Status
- IDX_PurchaseOrder_Branch

---

## Sample Records

| id | purchaseOrderNumber | supplierId | orderDate | totalAmount | status |
|----|---------------------|------------|-----------|------------:|--------|
| 1 | PO2500001 | 12 | 2026-08-01 | 12450.00 | APPROVED |
| 2 | PO2500002 | 18 | 2026-08-03 | 8750.00 | PARTIALLY_RECEIVED |
| 3 | PO2500003 | 12 | 2026-08-05 | 2450.00 | DRAFT |

---

## Prisma Model

```prisma
model PurchaseOrder {
  id                     BigInt   @id @default(autoincrement())

  uuid                   String   @unique @db.Uuid

  purchaseOrderNumber    String   @unique

  supplierId             BigInt
  branchId               BigInt

  orderDate              DateTime
  expectedDeliveryDate   DateTime?

  totalAmount            Decimal  @db.Decimal(14,2)
  taxAmount              Decimal  @default(0) @db.Decimal(14,2)
  discountAmount         Decimal  @default(0) @db.Decimal(14,2)

  status                 String

  remarks                String?

  approvedByEmployeeId   BigInt?
  approvedAt             DateTime?

  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt
  deletedAt              DateTime?

  version                Int      @default(1)

  supplier               Supplier @relation(fields: [supplierId], references: [id])
  branch                 Branch   @relation(fields: [branchId], references: [id])
  approvedBy             Employee? @relation(fields: [approvedByEmployeeId], references: [id])

  items                  PurchaseOrderItem[]
  goodsReceipts          GoodsReceipt[]

  @@index([supplierId])
  @@index([branchId])
  @@index([orderDate])
  @@index([status])
}
```

---

## Notes

- This is the **header table** for procurement documents.
- Individual medicines and quantities are stored in **PurchaseOrderItem**.
- Creating a Purchase Order does **not** affect inventory.
- Inventory changes begin only after a **Goods Receipt** is posted.
- A Purchase Order can be fulfilled through multiple Goods Receipts (partial deliveries).
- Once fully received and invoiced, the Purchase Order should be marked **CLOSED**.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
