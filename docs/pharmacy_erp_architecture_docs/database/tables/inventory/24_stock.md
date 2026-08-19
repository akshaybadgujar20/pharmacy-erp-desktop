# Stock

## Purpose

The Stock table maintains the **current inventory balance** for each medicine batch **at a specific branch**.

Unlike the StockMovement table, which records every inventory transaction, the Stock table stores only the latest inventory quantities for fast lookups during sales, purchasing, stock inquiries, and reporting.

**One Batch can have multiple Stock records** — one per branch that holds that lot.

---

## Business Rules

- Every Stock record belongs to exactly one Batch and one Branch.
- A Batch can have **many** Stock records (one per branch).
- Unique constraint: `(branchId, batchId)` — at most one balance row per batch per branch.
- Available Quantity cannot be negative unless negative inventory is explicitly enabled.
- Stock quantities must never be updated directly by business modules.
- All inventory changes must first create a StockMovement record.
- The Stock table should be updated only by the inventory service after validating the StockMovement.
- Reserved Quantity cannot exceed Available Quantity.
- UUID is used for synchronization with the cloud (Spring Boot + JPA + PostgreSQL).
- BIGINT is used as the internal primary key (local only — never sync `id`).
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Medicine (1)
    │
    └──< Batch (Many)
              │
              └──< Stock (Many, one per branch)
                        │
                        └── branchId → Branch
```

---

## Columns

| Category | Column | SQLite | PostgreSQL (JPA) | Nullable | Description |
|----------|--------|---------|------------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Local auto increment (not synced) |
| Identifier | uuid | TEXT | UUID/TEXT | No | Global sync identifier |
| Foreign Key | batchId | INTEGER | BIGINT | No | References Batch.id |
| Foreign Key | branchId | INTEGER | BIGINT | No | References Branch.id |
| Quantity | availableQuantity | REAL | NUMERIC | No | Saleable stock quantity |
| Quantity | reservedQuantity | REAL | NUMERIC | No | Reserved for pending sales/orders |
| Quantity | damagedQuantity | REAL | NUMERIC | No | Damaged stock |
| Quantity | expiredQuantity | REAL | NUMERIC | No | Expired stock |
| Quantity | inTransitQuantity | REAL | NUMERIC | No | Pending stock transfer quantity |
| Inventory | lastMovementAt | DATETIME | TIMESTAMP | Yes | Last inventory transaction |
| Status | isActive | INTEGER | BOOLEAN | No | Active stock record |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Foreign Key (batchId → Batch.id)
- Foreign Key (branchId → Branch.id)
- Unique (uuid)
- Unique (branchId, batchId)
- CHECK (availableQuantity >= 0)
- CHECK (reservedQuantity >= 0)
- CHECK (version >= 1)

---

## Indexes

- PK_Stock (id)
- UK_Stock_UUID
- UK_Stock_Branch_Batch
- IDX_Stock_BranchId
- IDX_Stock_BatchId
- IDX_Stock_Branch_AvailableQuantity
- IDX_Stock_Branch_IsActive
- IDX_Stock_LastMovement

---

## Prisma Model

```prisma
model Stock {
  id   BigInt @id @default(autoincrement())
  uuid String @unique @default(uuid())

  batchId  BigInt @map("batch_id")
  branchId BigInt @map("branch_id")

  availableQuantity Decimal @default(0) @map("available_quantity")
  reservedQuantity  Decimal @default(0) @map("reserved_quantity")
  damagedQuantity   Decimal @default(0) @map("damaged_quantity")
  expiredQuantity   Decimal @default(0) @map("expired_quantity")
  inTransitQuantity Decimal @default(0) @map("in_transit_quantity")

  lastMovementAt DateTime? @map("last_movement_at")
  isActive       Boolean   @default(true) @map("is_active")

  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")
  version   Int       @default(1)

  batch  Batch  @relation(fields: [batchId], references: [id])
  branch Branch @relation(fields: [branchId], references: [id])

  @@unique([branchId, batchId])
  @@index([branchId])
  @@index([batchId])
  @@index([branchId, availableQuantity])
  @@index([branchId, isActive])
  @@map("stocks")
}
```

---

## Notes

- This table stores the **current inventory snapshot** per branch.
- Inter-branch transfers create/update Stock rows at source and destination branches for the same Batch.
- Every inventory transaction must first create a **StockMovement** record, after which Stock is updated.
- Business modules should never update stock quantities directly.
- Sync with cloud uses `uuid`, never local `id`.
