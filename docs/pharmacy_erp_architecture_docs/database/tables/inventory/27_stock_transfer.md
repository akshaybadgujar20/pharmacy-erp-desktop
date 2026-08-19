# StockTransfer

## Purpose

The StockTransfer table records inventory transfers between branches.

It provides complete traceability of inventory movement between branch-scoped Stock balances without affecting overall company inventory totals.

Typical scenarios include:

- Branch-to-Branch Transfer
- Warehouse-to-Store Transfer
- Store-to-Warehouse Return
- Emergency Stock Transfer

Every completed Stock Transfer generates corresponding **StockMovement** records for both the source and destination branches.

---

## Business Rules

- Every transfer must have at least one StockTransferItem.
- Source and Destination branches must be different.
- Transfer quantity cannot exceed available stock at the source branch.
- Only approved/dispatched transfers update inventory.
- Cancelled transfers do not affect stock.
- Every completed transfer creates two StockMovement records:
  - OUT from source branch (reduces source Stock)
  - IN to destination branch (increases destination Stock — same Batch, new branch Stock row if needed)
- `transferNumber` is unique **per source branch**, not globally.
- Soft delete should not be used for completed transfers.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Branch (source)                    Branch (destination)
        │                                    │
        └──────────► StockTransfer ◄─────────┘
                           │
                    ├──────< StockTransferItem ──► Batch (org-global)
                    │
                    ├────────► StockMovement (OUT, source branch)
                    │
                    └────────► StockMovement (IN, destination branch)
```

---

## Columns

| Category | Column | SQLite | PostgreSQL (JPA) | Nullable | Description |
|----------|--------|---------|------------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID/TEXT | No | Global unique identifier |
| Business | transferNumber | TEXT | VARCHAR(30) | No | Unique per source branch |
| Foreign Key | sourceBranchId | INTEGER | BIGINT | No | Source branch |
| Foreign Key | destinationBranchId | INTEGER | BIGINT | No | Destination branch |
| Business | transferDate | DATETIME | TIMESTAMP | No | Transfer date |
| Business | expectedArrivalDate | DATETIME | TIMESTAMP | Yes | Expected arrival |
| Business | receivedDate | DATETIME | TIMESTAMP | Yes | Goods received date |
| Status | status | TEXT | VARCHAR(20) | No | DRAFT, DISPATCHED, COMPLETED, etc. (String) |
| Business | transferType | TEXT | VARCHAR(30) | No | ROUTINE_REPLENISHMENT, EMERGENCY_TRANSFER, etc. |
| Foreign Key | approvedByEmployeeId | INTEGER | BIGINT | Yes | Approving employee |
| Business | approvedAt | DATETIME | TIMESTAMP | Yes | Approval timestamp |
| Business | remarks | TEXT | TEXT | Yes | Transfer remarks |
| Audit | createdBy | INTEGER | BIGINT | Yes | Created by user |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Normally unused |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- Unique (sourceBranchId, transferNumber)
- Foreign Key (sourceBranchId → Branch.id)
- Foreign Key (destinationBranchId → Branch.id)
- Foreign Key (approvedByEmployeeId → Employee.id)
- CHECK (sourceBranchId <> destinationBranchId)
- CHECK (version >= 1)

---

## Indexes

- PK_StockTransfer (id)
- UK_StockTransfer_UUID
- UK_StockTransfer_Source_Number
- IDX_StockTransfer_Source
- IDX_StockTransfer_Destination
- IDX_StockTransfer_Date
- IDX_StockTransfer_Status
- IDX_StockTransfer_Type

---

## Sample Records

| id | transferNumber | sourceBranchId | destinationBranchId | transferDate | status |
|----|----------------|----------------|---------------------|--------------|--------|
| 1 | ST000001 | 1 | 2 | 2026-08-04 | COMPLETED |
| 2 | ST000002 | 2 | 3 | 2026-08-05 | IN_TRANSIT |
| 3 | ST000001 | 3 | 4 | 2026-08-06 | DRAFT |

Note: Branch 1 and Branch 3 can both issue `ST000001` because transfer numbers are scoped to source branch.

---

## Prisma Model

```prisma
model StockTransfer {
  id   BigInt @id @default(autoincrement())
  uuid String @unique @default(uuid())

  transferNumber String @map("transfer_number")

  sourceBranchId      BigInt @map("source_branch_id")
  destinationBranchId BigInt @map("destination_branch_id")

  transferDate        DateTime  @map("transfer_date")
  expectedArrivalDate DateTime? @map("expected_arrival_date")
  receivedDate        DateTime? @map("received_date")

  status       String @default("DRAFT") @map("status")
  transferType String @default("ROUTINE_REPLENISHMENT") @map("transfer_type")

  approvedByEmployeeId BigInt?   @map("approved_by_employee_id")
  approvedAt           DateTime? @map("approved_at")

  remarks String? @map("remarks")

  createdBy BigInt? @map("created_by")

  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  version Int @default(1)

  sourceBranch      Branch @relation("SourceStockTransfers", fields: [sourceBranchId], references: [id])
  destinationBranch Branch @relation("DestinationStockTransfers", fields: [destinationBranchId], references: [id])
  approvedBy        Employee? @relation(fields: [approvedByEmployeeId], references: [id])

  items StockTransferItem[]

  @@unique([sourceBranchId, transferNumber])
  @@index([sourceBranchId])
  @@index([destinationBranchId])
  @@index([transferDate])
  @@index([status])
  @@index([transferType])
  @@map("stock_transfers")
}
```

---

## Notes

- This is the **header table** for inter-branch stock transfers.
- Batch is org-global; source and destination each maintain their own **Stock** row for `(branchId, batchId)`.
- Individual medicines and quantities are stored in **StockTransferItem**.
- Inventory should only be updated after approval/dispatch according to the configured workflow.
- Each completed transfer generates:
  - One **OUT** StockMovement at the source branch.
  - One **IN** StockMovement at the destination branch.
- Historical transfer records should never be deleted.
- Supports offline-first synchronization using UUID.
