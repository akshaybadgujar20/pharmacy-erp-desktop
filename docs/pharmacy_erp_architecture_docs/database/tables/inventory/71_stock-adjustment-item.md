# StockAdjustmentItem

## Purpose

The StockAdjustmentItem table stores the individual inventory items affected by a StockAdjustment.

A single StockAdjustment can contain multiple items. Each item identifies the batch being adjusted and the quantity being added to or removed from inventory at the **parent adjustment's branch**.

Every StockAdjustmentItem belongs to exactly one StockAdjustment.

---

## Business Rules

- Every StockAdjustment must contain at least one StockAdjustmentItem.
- Every StockAdjustmentItem must belong to a valid StockAdjustment (which carries `branchId`).
- Every StockAdjustmentItem must reference a valid Batch (org-global lot identity).
- Branch scope comes from the parent StockAdjustment — items adjust Stock at `(branchId, batchId)`.
- The adjustment quantity represents the quantity change applied to branch inventory.
- Positive adjustment quantities increase stock; negative quantities decrease stock.
- `unitCost` snapshots the batch purchase rate for accounting write-offs.
- A batch can appear only once per adjustment document.
- Approved StockAdjustmentItems cannot be modified.
- Stock must never be updated directly from StockAdjustmentItem.
- Approved adjustments generate corresponding branch-scoped StockMovement records.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```text
StockAdjustment (branchId)
       │
       │ 1
       ▼
StockAdjustmentItem
       │
       │ N
       ▼
     Batch (org-global)
       │
       └──► Stock (branchId from header + batchId)
```

---

## Columns

| Category | Column | SQLite | PostgreSQL (JPA) | Nullable | Description |
|----------|--------|---------|------------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID/TEXT | No | Global unique identifier |
| Foreign Key | stockAdjustmentId | INTEGER | BIGINT | No | Parent StockAdjustment |
| Foreign Key | batchId | INTEGER | BIGINT | No | Batch whose stock is being adjusted |
| Business | quantity | REAL | NUMERIC | No | Signed quantity change |
| Business | unitCost | REAL | NUMERIC | No | Purchase rate snapshot |
| Business | remarks | TEXT | TEXT | Yes | Line remarks |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- Unique (stockAdjustmentId, batchId)
- Foreign Key (stockAdjustmentId → StockAdjustment.id)
- Foreign Key (batchId → Batch.id)
- CHECK (quantity <> 0)
- CHECK (version >= 1)

---

## Indexes

- PK_StockAdjustmentItem (id)
- UK_StockAdjustmentItem_UUID
- UK_StockAdjustmentItem_Adjustment_Batch
- IDX_StockAdjustmentItem_Adjustment
- IDX_StockAdjustmentItem_Batch

---

## Sample Records

| id | stockAdjustmentId | batchId | quantity | unitCost |
|----|-------------------|---------|----------|----------|
| 1 | 1 | 101 | -3 | 45.00 |
| 2 | 1 | 205 | 2 | 120.00 |
| 3 | 2 | 301 | -10 | 88.50 |

---

## Prisma Model

```prisma
model StockAdjustmentItem {
  id   BigInt @id @default(autoincrement())
  uuid String @unique @default(uuid())

  stockAdjustmentId BigInt @map("stock_adjustment_id")
  batchId           BigInt @map("batch_id")

  quantity Decimal @map("quantity")
  unitCost Decimal @map("unit_cost")

  remarks String? @map("remarks")

  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  version Int @default(1)

  stockAdjustment StockAdjustment @relation(fields: [stockAdjustmentId], references: [id])
  batch           Batch           @relation(fields: [batchId], references: [id])

  @@unique([stockAdjustmentId, batchId])
  @@index([stockAdjustmentId])
  @@index([batchId])
  @@map("stock_adjustment_items")
}
```

---

## Inventory Flow

```text
StockAdjustment (branchId = 1)
       │
       ▼
StockAdjustmentItem (batchId, quantity)
       │
       ▼
Approval
       │
       ▼
StockMovement (branchId = 1, batchId)
       │
       ▼
Stock (branchId = 1, batchId)
```

---

## Notes

- This is the detail table for StockAdjustment.
- Branch context is inherited from the header; Batch is org-global.
- One adjustment can contain multiple batches (one line each).
- StockMovement remains the inventory transaction ledger.
- Supports offline-first synchronization using UUID.
