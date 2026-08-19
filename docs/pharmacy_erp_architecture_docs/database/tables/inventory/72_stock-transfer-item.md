# StockTransferItem

## Purpose

The StockTransferItem table stores the individual inventory items included in a StockTransfer.

A single StockTransfer can contain multiple batches. Each item identifies the org-global batch being transferred and the quantities moved from the source branch to the destination branch.

Every StockTransferItem belongs to exactly one StockTransfer.

---

## Business Rules

- Every StockTransfer must contain at least one StockTransferItem.
- Every StockTransferItem must belong to a valid StockTransfer.
- Every StockTransferItem must reference a valid Batch (org-global).
- `sentQuantity` must be greater than zero and cannot exceed source branch Stock.
- `receivedQuantity` and `damagedQuantity` are recorded at receipt (may differ from sent).
- A batch can appear only once per transfer document.
- Only approved/dispatched transfers can proceed to inventory movement.
- Source inventory is reduced via StockMovement OUT at `sourceBranchId`.
- Destination inventory is increased via StockMovement IN at `destinationBranchId`.
- Stock must never be updated directly from StockTransferItem.
- Cancelled transfers must not create inventory movements.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```text
StockTransfer (sourceBranchId, destinationBranchId)
       │
       │ 1
       ▼
StockTransferItem
       │
       │ N
       ▼
     Batch (org-global)
       │
       ├────────► Stock (sourceBranchId, batchId)
       │
       └────────► Stock (destinationBranchId, batchId)
```

---

## Columns

| Category | Column | SQLite | PostgreSQL (JPA) | Nullable | Description |
|----------|--------|---------|------------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID/TEXT | No | Global unique identifier |
| Foreign Key | stockTransferId | INTEGER | BIGINT | No | Parent StockTransfer |
| Foreign Key | batchId | INTEGER | BIGINT | No | Batch being transferred |
| Business | sentQuantity | REAL | NUMERIC | No | Quantity dispatched from source |
| Business | receivedQuantity | REAL | NUMERIC | Yes | Quantity received at destination |
| Business | damagedQuantity | REAL | NUMERIC | No | Quantity damaged in transit |
| Business | remarks | TEXT | TEXT | Yes | Line remarks |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- Unique (stockTransferId, batchId)
- Foreign Key (stockTransferId → StockTransfer.id)
- Foreign Key (batchId → Batch.id)
- CHECK (sentQuantity > 0)
- CHECK (version >= 1)

---

## Indexes

- PK_StockTransferItem (id)
- UK_StockTransferItem_UUID
- UK_StockTransferItem_Transfer_Batch
- IDX_StockTransferItem_Transfer
- IDX_StockTransferItem_Batch

---

## Sample Records

| id | stockTransferId | batchId | sentQuantity | receivedQuantity | damagedQuantity |
|----|-----------------|---------|-------------:|-----------------:|----------------:|
| 1 | 1 | 101 | 10 | 10 | 0 |
| 2 | 1 | 205 | 25 | 24 | 1 |
| 3 | 2 | 301 | 5 | NULL | 0 |

---

## Prisma Model

```prisma
model StockTransferItem {
  id   BigInt @id @default(autoincrement())
  uuid String @unique @default(uuid())

  stockTransferId BigInt @map("stock_transfer_id")
  batchId         BigInt @map("batch_id")

  sentQuantity     Decimal  @map("sent_quantity")
  receivedQuantity Decimal? @map("received_quantity")
  damagedQuantity  Decimal  @default(0) @map("damaged_quantity")

  remarks String? @map("remarks")

  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  version Int @default(1)

  stockTransfer StockTransfer @relation(fields: [stockTransferId], references: [id])
  batch         Batch         @relation(fields: [batchId], references: [id])

  @@unique([stockTransferId, batchId])
  @@index([stockTransferId])
  @@index([batchId])
  @@map("stock_transfer_items")
}
```

---

## Inventory Flow

```text
StockTransfer
       │
       ▼
StockTransferItem (batchId, sentQuantity)
       │
       ▼
Dispatch → StockMovement OUT (sourceBranchId)
       │
       ▼
Source Stock (sourceBranchId, batchId) decreases
       │
       ▼
Receipt → StockMovement IN (destinationBranchId)
       │
       ▼
Destination Stock (destinationBranchId, batchId) increases
```

---

## Notes

- This is the detail table for StockTransfer.
- Batch is org-global; Stock balances are per branch.
- Quantity fields track dispatch vs receipt variance.
- StockMovement remains the inventory transaction ledger.
- Supports offline-first synchronization using UUID.
