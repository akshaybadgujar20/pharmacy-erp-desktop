# StockAdjustmentItem

## Purpose

The StockAdjustmentItem table stores the individual inventory items affected by a StockAdjustment.

A single StockAdjustment can contain multiple items. Each item identifies the stock/batch being adjusted and the quantity being added to or removed from inventory.

Every StockAdjustmentItem belongs to exactly one StockAdjustment.

---

## Business Rules

- Every StockAdjustment must contain at least one StockAdjustmentItem.
- Every StockAdjustmentItem must belong to a valid StockAdjustment.
- Every StockAdjustmentItem must reference a valid Batch.
- The adjustment quantity represents the quantity change applied to inventory.
- Positive adjustment quantities increase stock.
- Negative adjustment quantities decrease stock.
- Approved StockAdjustmentItems cannot be modified.
- Stock must never be updated directly from StockAdjustmentItem.
- Approved adjustments generate corresponding StockMovement records.
- Cancelling an approved adjustment must create reversal StockMovement records instead of modifying or deleting the original items.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```text
StockAdjustment
       │
       │ 1
       ▼
StockAdjustmentItem
       │
       │ N
       ▼
     Batch
       │
       ▼
     Stock
```

Each StockAdjustment can contain one or more StockAdjustmentItem records.

```text
StockAdjustment
    │
    ├────── StockAdjustmentItem
    │              │
    │              └────── Batch
    │
    ├────── StockAdjustmentItem
    │              │
    │              └────── Batch
    │
    └────── StockAdjustmentItem
                   │
                   └────── Batch
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier used for synchronization |
| Foreign Key | stockAdjustmentId | INTEGER | BIGINT | No | Parent StockAdjustment |
| Foreign Key | batchId | INTEGER | BIGINT | No | Batch whose stock is being adjusted |
| Business | quantity | DECIMAL | NUMERIC | No | Quantity change applied to inventory; positive increases stock and negative decreases stock |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- Foreign Key (stockAdjustmentId → StockAdjustment.id)
- Foreign Key (batchId → Batch.id)
- CHECK (quantity <> 0)
- CHECK (version >= 1)

---

## Indexes

- PK_StockAdjustmentItem (id)
- UK_StockAdjustmentItem_UUID
- IDX_StockAdjustmentItem_Adjustment
- IDX_StockAdjustmentItem_Batch

---

## Sample Records

| id | stockAdjustmentId | batchId | quantity |
|----|-------------------|---------|----------|
| 1 | 1 | 101 | -3 |
| 2 | 1 | 205 | 2 |
| 3 | 2 | 301 | -10 |

Example:

```text
StockAdjustment ADJ000001
    │
    ├── Item 1
    │     Batch: 101
    │     Quantity: -3
    │
    └── Item 2
          Batch: 205
          Quantity: +2
```

The corresponding StockMovement records are generated when the parent StockAdjustment is approved.

---

## Prisma Model

```prisma
model StockAdjustmentItem {
  id                 BigInt   @id @default(autoincrement())

  uuid               String   @unique @db.Uuid

  stockAdjustmentId  BigInt
  batchId            BigInt

  quantity           Decimal

  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  version            Int      @default(1)

  stockAdjustment    StockAdjustment @relation(
    fields: [stockAdjustmentId],
    references: [id]
  )

  batch              Batch @relation(
    fields: [batchId],
    references: [id]
  )

  @@index([stockAdjustmentId])
  @@index([batchId])
}
```

The parent `StockAdjustment` model contains:

```prisma
items StockAdjustmentItem[]
```

---

## Inventory Flow

The StockAdjustmentItem does not directly update Stock.

The inventory flow is:

```text
StockAdjustment
       │
       ▼
StockAdjustmentItem
       │
       ▼
Approval
       │
       ▼
StockMovement
       │
       ▼
Stock
```

For example:

```text
System Stock: 100
Physical Stock: 97

Adjustment Item:
quantity = -3

        │
        ▼

StockMovement:
quantity = -3

        │
        ▼

Stock:
100 → 97
```

For stock found during a physical count:

```text
System Stock: 50
Physical Stock: 52

Adjustment Item:
quantity = +2

        │
        ▼

StockMovement:
quantity = +2

        │
        ▼

Stock:
50 → 52
```

---

## Notes

- This is the detail table for StockAdjustment.
- StockAdjustment is the header and StockAdjustmentItem contains the affected inventory records.
- One adjustment can contain multiple batches.
- The same StockAdjustmentItem must not be modified after the parent adjustment is approved.
- StockMovement remains the inventory transaction ledger and source of truth for stock changes.
- StockAdjustmentItem provides the business-level detail explaining which batch was adjusted and by how much.
- Historical adjustment items should be preserved for audit and compliance purposes.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
