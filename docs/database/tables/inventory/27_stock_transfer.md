# StockTransfer

## Purpose

The StockTransfer table records inventory transfers between branches, warehouses, or storage locations.

It provides complete traceability of inventory movement without affecting the overall company inventory.

Typical scenarios include:

- Branch-to-Branch Transfer
- Warehouse-to-Store Transfer
- Store-to-Warehouse Return
- Shelf Reorganization
- Emergency Stock Transfer

Every completed Stock Transfer generates corresponding **StockMovement** records for both the source and destination locations.

---

## Business Rules

- Every transfer must have at least one StockTransferItem.
- Source and Destination locations must be different.
- Transfer quantity cannot exceed available stock.
- Only approved transfers update inventory.
- Cancelled transfers do not affect stock.
- Every completed transfer creates two StockMovement records:
  - OUT from source location
  - IN to destination location
- Soft delete should not be used for completed transfers.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Branch/Warehouse
        │
        ▼
 StockTransfer
        │
        ├──────< StockTransferItem
        │
        ├────────► StockMovement (OUT)
        │
        └────────► StockMovement (IN)
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Business | transferNumber | TEXT | VARCHAR(30) | No | Unique transfer document number |
| Foreign Key | sourceBranchId | INTEGER | BIGINT | No | Source branch/warehouse |
| Foreign Key | destinationBranchId | INTEGER | BIGINT | No | Destination branch/warehouse |
| Business | transferDate | DATETIME | TIMESTAMP | No | Transfer date |
| Business | expectedArrivalDate | DATETIME | TIMESTAMP | Yes | Expected arrival |
| Business | receivedDate | DATETIME | TIMESTAMP | Yes | Goods received date |
| Status | status | TEXT | VARCHAR(20) | No | DRAFT, APPROVED, IN_TRANSIT, RECEIVED, CANCELLED |
| Foreign Key | approvedByEmployeeId | INTEGER | BIGINT | Yes | Approving employee |
| Business | remarks | TEXT | TEXT | Yes | Transfer remarks |
| Audit | createdBy | INTEGER | BIGINT | Yes | Created by employee |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Normally unused |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- Unique (transferNumber)
- Foreign Key (sourceBranchId → Branch.id)
- Foreign Key (destinationBranchId → Branch.id)
- Foreign Key (approvedByEmployeeId → Employee.id)
- CHECK (sourceBranchId <> destinationBranchId)
- CHECK (status IN ('DRAFT','APPROVED','IN_TRANSIT','RECEIVED','CANCELLED'))
- CHECK (version >= 1)

---

## Indexes

- PK_StockTransfer (id)
- UK_StockTransfer_UUID
- UK_StockTransfer_Number
- IDX_StockTransfer_Source
- IDX_StockTransfer_Destination
- IDX_StockTransfer_Date
- IDX_StockTransfer_Status

---

## Sample Records

| id | transferNumber | sourceBranchId | destinationBranchId | transferDate | status |
|----|----------------|----------------|---------------------|--------------|--------|
| 1 | ST000001 | 1 | 2 | 2026-08-04 | RECEIVED |
| 2 | ST000002 | 2 | 3 | 2026-08-05 | IN_TRANSIT |
| 3 | ST000003 | 1 | 4 | 2026-08-06 | DRAFT |

---

## Prisma Model

```prisma
model StockTransfer {
  id                     BigInt   @id @default(autoincrement())

  uuid                   String   @unique @db.Uuid

  transferNumber         String   @unique

  sourceBranchId         BigInt
  destinationBranchId    BigInt

  transferDate           DateTime
  expectedArrivalDate    DateTime?
  receivedDate           DateTime?

  status                 String

  approvedByEmployeeId   BigInt?

  remarks                String?

  createdBy              BigInt?

  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt
  deletedAt              DateTime?

  version                Int      @default(1)

  approvedBy             Employee? @relation(fields: [approvedByEmployeeId], references: [id])

  items                  StockTransferItem[]

  @@index([sourceBranchId])
  @@index([destinationBranchId])
  @@index([transferDate])
  @@index([status])
}
```

---

## Notes

- This is the **header table** for stock transfers.
- Individual medicines and quantities should be stored in a separate **StockTransferItem** table.
- Inventory should only be updated after approval and according to the configured workflow (dispatch, receipt, or both).
- Each completed transfer generates:
  - One **OUT** StockMovement for the source branch.
  - One **IN** StockMovement for the destination branch.
- Historical transfer records should never be deleted.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
