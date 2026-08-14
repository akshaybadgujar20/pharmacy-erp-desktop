# Stock

## Purpose

The Stock table maintains the **current inventory balance** for each medicine batch.

Unlike the StockMovement table, which records every inventory transaction, the Stock table stores only the latest inventory quantities for fast lookups during sales, purchasing, stock inquiries, and reporting.

Each Batch has exactly one Stock record.

---

## Business Rules

- Every Stock record belongs to exactly one Batch.
- A Batch can have only one Stock record.
- Available Quantity cannot be negative unless negative inventory is explicitly enabled.
- Stock quantities must never be updated directly by business modules.
- All inventory changes must first create a StockMovement record.
- The Stock table should be updated only by the inventory service after validating the StockMovement.
- Reserved Quantity cannot exceed Available Quantity.
- Soft delete should not be used because stock is an active operational record.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Medicine
    │
    ▼
 Batch (1)
    │
    ▼
 Stock (1)
    │
    └──────< StockMovement
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Foreign Key | batchId | INTEGER | BIGINT | No | References Batch.id |
| Quantity | availableQuantity | REAL | NUMERIC(14,3) | No | Saleable stock quantity |
| Quantity | reservedQuantity | REAL | NUMERIC(14,3) | No | Reserved for pending sales/orders |
| Quantity | damagedQuantity | REAL | NUMERIC(14,3) | No | Damaged stock |
| Quantity | expiredQuantity | REAL | NUMERIC(14,3) | No | Expired stock |
| Quantity | inTransitQuantity | REAL | NUMERIC(14,3) | No | Pending stock transfer quantity |
| Inventory | reorderLevel | REAL | NUMERIC(14,3) | Yes | Minimum stock level |
| Inventory | maximumLevel | REAL | NUMERIC(14,3) | Yes | Maximum stock level |
| Inventory | lastMovementAt | DATETIME | TIMESTAMP | Yes | Last inventory transaction |
| Status | isActive | INTEGER | BOOLEAN | No | Active stock record |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp (normally unused) |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Foreign Key (batchId → Batch.id)
- Unique (uuid)
- Unique (batchId)
- CHECK (availableQuantity >= 0)
- CHECK (reservedQuantity >= 0)
- CHECK (damagedQuantity >= 0)
- CHECK (expiredQuantity >= 0)
- CHECK (inTransitQuantity >= 0)
- CHECK (version >= 1)

---

## Indexes

- PK_Stock (id)
- UK_Stock_UUID
- UK_Stock_Batch
- IDX_Stock_AvailableQuantity
- IDX_Stock_ReorderLevel
- IDX_Stock_LastMovement
- IDX_Stock_Active

---

## Sample Records

| id | batchId | availableQuantity | reservedQuantity | damagedQuantity | expiredQuantity |
|----|---------|------------------:|-----------------:|----------------:|----------------:|
| 1 | 1 | 125.000 | 10.000 | 2.000 | 0.000 |
| 2 | 2 | 45.000 | 5.000 | 0.000 | 0.000 |
| 3 | 3 | 8.000 | 0.000 | 1.000 | 3.000 |

---

## Prisma Model

```prisma
model Stock {
  id                   BigInt   @id @default(autoincrement())

  uuid                 String   @unique @db.Uuid

  batchId              BigInt   @unique

  availableQuantity    Decimal  @default(0) @db.Decimal(14,3)
  reservedQuantity     Decimal  @default(0) @db.Decimal(14,3)
  damagedQuantity      Decimal  @default(0) @db.Decimal(14,3)
  expiredQuantity      Decimal  @default(0) @db.Decimal(14,3)
  inTransitQuantity    Decimal  @default(0) @db.Decimal(14,3)

  reorderLevel         Decimal? @db.Decimal(14,3)
  maximumLevel         Decimal? @db.Decimal(14,3)

  lastMovementAt       DateTime?

  isActive             Boolean  @default(true)

  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
  deletedAt            DateTime?

  version              Int      @default(1)

  batch                Batch            @relation(fields: [batchId], references: [id])

  @@index([availableQuantity])
  @@index([reorderLevel])
  @@index([lastMovementAt])
  @@index([isActive])
}
```

---

## Notes

- This table stores the **current inventory snapshot** only.
- It is an optimization table for fast inventory lookups.
- Every inventory transaction (Purchase, Sale, Return, Adjustment, Transfer, Stock Take) must first create a **StockMovement** record, after which the Stock record is updated.
- Business modules should never update stock quantities directly.
- Expired and damaged quantities are tracked separately to prevent accidental sale.
- Inventory valuation should be based on Batch and Purchase information, not this table.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
