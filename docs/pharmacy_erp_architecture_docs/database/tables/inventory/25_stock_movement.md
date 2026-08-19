# StockMovement

## Purpose

The StockMovement table is the **inventory transaction ledger** of the Pharmacy ERP.

Every inventory change must create exactly one StockMovement record.

This table provides a complete audit trail of inventory transactions and is the source of truth for stock reconciliation.

Typical transactions include:

- Purchase Receipt
- Sales
- Sales Return
- Purchase Return
- Stock Adjustment
- Stock Transfer
- Stock Take
- Expired Stock Disposal
- Damaged Stock

---

## Business Rules

- Every StockMovement belongs to exactly one Branch, Medicine, and Batch.
- Stock balances are branch-scoped: `(branchId, batchId)` identifies the Stock row updated.
- Every inventory transaction must generate one StockMovement record.
- StockMovement records are immutable and must never be edited or deleted.
- Stock balances are derived by applying StockMovements at the branch level.
- Movement Quantity must always be positive.
- IN and OUT direction determines whether quantity is added or deducted.
- Reference Table and Reference Id must identify the originating business transaction.
- `movementNumber` is unique **per branch**, not globally.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.

---

## Relationships

```
Branch (1)
     │
     └──────< StockMovement (Many)
                    │
                    ├── Medicine
                    ├── Batch (1) ──< Stock (Many per branch)
                    │
                    ├── PurchaseInvoiceItem
                    ├── SalesInvoiceItem
                    ├── PurchaseReturnItem
                    ├── SalesReturnItem
                    ├── StockAdjustmentItem
                    ├── StockTransferItem
                    └── StockTakeItem
```

---

## Columns

| Category | Column | SQLite | PostgreSQL (JPA) | Nullable | Description |
|----------|--------|---------|------------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key (local only) |
| Identifier | uuid | TEXT | UUID/TEXT | No | Global unique identifier |
| Foreign Key | branchId | INTEGER | BIGINT | No | References Branch.id |
| Foreign Key | medicineId | INTEGER | BIGINT | No | References Medicine.id |
| Foreign Key | batchId | INTEGER | BIGINT | No | References Batch.id |
| Business | movementNumber | TEXT | VARCHAR(30) | No | Branch-scoped movement number |
| Business | movementType | TEXT | VARCHAR(30) | No | PURCHASE_GRN, SALES_INVOICE, etc. (String, not enum) |
| Business | movementDirection | TEXT | VARCHAR(10) | No | IN or OUT |
| Quantity | quantity | REAL | NUMERIC | No | Movement quantity (always positive) |
| Quantity | unitCost | REAL | NUMERIC | No | Cost snapshot at movement time |
| Quantity | balanceAfter | REAL | NUMERIC | No | Branch stock balance after transaction |
| Reference | referenceTable | TEXT | VARCHAR(50) | No | Source table name |
| Reference | referenceId | INTEGER | BIGINT | No | Source record ID |
| Business | movementDate | DATETIME | TIMESTAMP | No | Transaction date/time |
| Business | remarks | TEXT | TEXT | Yes | Additional remarks |
| Audit | createdBy | INTEGER | BIGINT | Yes | User performing transaction |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |

---

## Constraints

- Primary Key (id)
- Foreign Key (branchId → Branch.id)
- Foreign Key (medicineId → Medicine.id)
- Foreign Key (batchId → Batch.id)
- Unique (uuid)
- Unique (branchId, movementNumber)
- CHECK (quantity > 0)
- CHECK (movementDirection IN ('IN','OUT'))

---

## Indexes

- PK_StockMovement (id)
- UK_StockMovement_UUID
- UK_StockMovement_Branch_Number
- IDX_StockMovement_Branch_Batch_Date
- IDX_StockMovement_Branch_Medicine_Date
- IDX_StockMovement_Type
- IDX_StockMovement_Reference

---

## Sample Records

| id | branchId | movementNumber | batchId | movementType | movementDirection | quantity | balanceAfter |
|----|----------|----------------|---------|--------------|-------------------|---------:|-------------:|
| 1 | 1 | SM000001 | 1 | PURCHASE_GRN | IN | 100.000 | 100.000 |
| 2 | 1 | SM000002 | 1 | SALES_INVOICE | OUT | 12.000 | 88.000 |
| 3 | 1 | SM000003 | 1 | SALES_RETURN | IN | 2.000 | 90.000 |
| 4 | 2 | SM000001 | 1 | TRANSFER_IN | IN | 10.000 | 10.000 |

Note: Branch 1 and Branch 2 can both use `SM000001` because movement numbers are branch-scoped.

---

## Prisma Model

```prisma
model StockMovement {
  id   BigInt @id @default(autoincrement())
  uuid String @unique @default(uuid())

  movementNumber String @map("movement_number")

  branchId   BigInt @map("branch_id")
  medicineId BigInt @map("medicine_id")
  batchId    BigInt @map("batch_id")

  movementType      String @map("movement_type")
  movementDirection String @map("movement_direction")

  quantity     Decimal @map("quantity")
  unitCost     Decimal @map("unit_cost")
  balanceAfter Decimal @map("balance_after")

  referenceTable String @map("reference_table")
  referenceId    BigInt @map("reference_id")

  movementDate DateTime @default(now()) @map("movement_date")

  remarks   String? @map("remarks")
  createdBy BigInt? @map("created_by")

  createdAt DateTime @default(now()) @map("created_at")

  branch   Branch   @relation(fields: [branchId], references: [id])
  medicine Medicine @relation(fields: [medicineId], references: [id])
  batch    Batch    @relation(fields: [batchId], references: [id])

  @@unique([branchId, movementNumber])
  @@index([branchId, batchId, movementDate])
  @@index([branchId, medicineId, movementDate])
  @@index([referenceTable, referenceId])
  @@index([movementType])
  @@map("stock_movements")
}
```

---

## Notes

- This is the **inventory ledger** and the source of truth for all inventory transactions.
- Records should be **append-only**; corrections must be made using new StockMovement entries rather than updating existing records.
- The Stock table (one row per batch **per branch**) should be updated based on StockMovement records.
- Supports complete inventory traceability for audits, recalls, and statutory compliance.
- Enables reconstruction of branch stock balances at any historical point in time.
- Supports offline-first synchronization using UUID.
- Status and movement type fields are **String** values validated in application code (not Prisma enums).
