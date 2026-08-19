# StockTransferItem

## Purpose

The StockTransferItem table stores the individual inventory items included in a StockTransfer.

A single StockTransfer can contain multiple medicines/batches. Each item identifies the batch being transferred and the quantity being moved from the source branch to the destination branch.

Every StockTransferItem belongs to exactly one StockTransfer.

---

## Business Rules

- Every StockTransfer must contain at least one StockTransferItem.
- Every StockTransferItem must belong to a valid StockTransfer.
- Every StockTransferItem must reference a valid Batch.
- Transfer quantity must be greater than zero.
- Transfer quantity cannot exceed the available stock at the source location.
- Only approved transfers can proceed to inventory movement.
- A StockTransferItem must not be modified after the transfer has reached the final completed state.
- The source inventory is reduced through a StockMovement of type OUT.
- The destination inventory is increased through a StockMovement of type IN.
- Stock must never be updated directly from StockTransferItem.
- Cancelled transfers must not create inventory movements.
- Historical transfer items should be preserved for audit purposes.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```text
StockTransfer
       │
       │ 1
       ▼
StockTransferItem
       │
       │ N
       ▼
     Batch
       │
       ├────────► Source Stock
       │
       └────────► Destination Stock
```

A single StockTransfer can contain multiple StockTransferItem records.

```text
StockTransfer ST000001
    │
    ├── StockTransferItem
    │     Batch: 101
    │     Quantity: 10
    │
    ├── StockTransferItem
    │     Batch: 205
    │     Quantity: 25
    │
    └── StockTransferItem
          Batch: 301
          Quantity: 5
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier used for synchronization |
| Foreign Key | stockTransferId | INTEGER | BIGINT | No | Parent StockTransfer |
| Foreign Key | batchId | INTEGER | BIGINT | No | Batch being transferred |
| Business | quantity | DECIMAL | NUMERIC | No | Quantity transferred from source to destination |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- Foreign Key (stockTransferId → StockTransfer.id)
- Foreign Key (batchId → Batch.id)
- CHECK (quantity > 0)
- CHECK (version >= 1)

---

## Indexes

- PK_StockTransferItem (id)
- UK_StockTransferItem_UUID
- IDX_StockTransferItem_Transfer
- IDX_StockTransferItem_Batch

---

## Sample Records

| id | stockTransferId | batchId | quantity |
|----|-----------------|---------|----------|
| 1 | 1 | 101 | 10 |
| 2 | 1 | 205 | 25 |
| 3 | 2 | 301 | 5 |

Example:

```text
StockTransfer ST000001
Source: Branch 1
Destination: Branch 2

    │
    ├── Item 1
    │     Batch: 101
    │     Quantity: 10
    │
    ├── Item 2
    │     Batch: 205
    │     Quantity: 25
    │
    └── Item 3
          Batch: 301
          Quantity: 5
```

---

## Inventory Flow

StockTransferItem does not directly update Stock.

The inventory flow is:

```text
StockTransfer
       │
       ▼
StockTransferItem
       │
       ▼
Approval
       │
       ▼
Dispatch
       │
       ├──────────────► StockMovement (OUT)
       │
       ▼
    In Transit
       │
       ▼
    Receipt
       │
       └──────────────► StockMovement (IN)
```

For example:

```text
Source Branch Stock:
Batch 101 = 100

Transfer Item:
quantity = 10

        │
        ▼

StockMovement OUT:
quantity = -10

        │
        ▼

Source Stock:
100 → 90
```

When the destination receives the transfer:

```text
Destination Branch Stock:
Batch 101 = 20

        │
        ▼

StockMovement IN:
quantity = +10

        │
        ▼

Destination Stock:
20 → 30
```

The StockMovement records provide the inventory transaction history.

---

## Prisma Model

```prisma
model StockTransferItem {
  id                BigInt   @id @default(autoincrement())

  uuid              String   @unique @db.Uuid

  stockTransferId   BigInt
  batchId           BigInt

  quantity          Decimal

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  version           Int      @default(1)

  stockTransfer     StockTransfer @relation(
    fields: [stockTransferId],
    references: [id]
  )

  batch             Batch @relation(
    fields: [batchId],
    references: [id]
  )

  @@index([stockTransferId])
  @@index([batchId])
}
```

The parent `StockTransfer` model contains:

```prisma
items StockTransferItem[]
```

---

## Notes

- This is the detail table for StockTransfer.
- StockTransfer is the header and StockTransferItem contains the individual medicines/batches and quantities being transferred.
- One transfer can contain multiple batches.
- Quantity is always positive because it represents the amount being transferred.
- The OUT and IN signs are determined when the corresponding StockMovement records are created.
- StockTransferItem should not directly modify Stock.
- StockMovement remains the inventory transaction ledger and source of truth for stock changes.
- For transfers using a dispatch/receipt workflow, the OUT movement is created at dispatch and the IN movement is created at receipt.
- Historical transfer items should never be deleted after the transfer has been completed.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
