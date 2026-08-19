# StockAdjustment

## Purpose

The StockAdjustment table records manual corrections made to inventory when the physical stock differs from the system stock at a **specific branch**.

Adjustments are required for situations such as:

- Damaged medicines
- Expired medicines
- Lost or stolen stock
- Physical stock count differences
- Opening stock entry
- System correction
- Free samples
- Internal consumption

Every Stock Adjustment automatically generates one or more StockMovement records at the branch level.

---

## Business Rules

- Every adjustment belongs to exactly one Branch.
- Every adjustment must contain at least one adjustment item.
- Every adjustment requires a valid adjustment reason.
- Adjustments should be approved according to company policy.
- Approved adjustments cannot be modified.
- Cancelling an adjustment should create a reversal StockMovement instead of deleting records.
- Every adjustment updates the branch Stock table through StockMovement.
- `adjustmentNumber` is unique **per branch**, not globally.
- Soft delete should not be used for approved adjustments.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Branch
    │
    ▼
StockAdjustment
    │
    ├──────< StockAdjustmentItem ──► Batch
    │
    └────────────► StockMovement (branch-scoped)
                         │
                         ▼
                      Stock (branchId + batchId)
```

---

## Columns

| Category | Column | SQLite | PostgreSQL (JPA) | Nullable | Description |
|----------|--------|---------|------------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID/TEXT | No | Global unique identifier |
| Foreign Key | branchId | INTEGER | BIGINT | No | Branch where adjustment applies |
| Business | adjustmentNumber | TEXT | VARCHAR(30) | No | Branch-scoped adjustment document number |
| Business | adjustmentType | TEXT | VARCHAR(30) | No | DAMAGE, EXPIRED, LOST, etc. (String) |
| Business | adjustmentDate | DATETIME | TIMESTAMP | No | Adjustment date |
| Business | reason | TEXT | TEXT | No | Reason for adjustment |
| Foreign Key | approvedByEmployeeId | INTEGER | BIGINT | Yes | Approving employee |
| Business | approvedAt | DATETIME | TIMESTAMP | Yes | Approval date |
| Status | status | TEXT | VARCHAR(20) | No | DRAFT, APPROVED, CANCELLED (String) |
| Status | isActive | INTEGER | BOOLEAN | No | Active record |
| Audit | createdBy | INTEGER | BIGINT | Yes | Employee creating adjustment |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Normally unused |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- Unique (branchId, adjustmentNumber)
- Foreign Key (branchId → Branch.id)
- Foreign Key (approvedByEmployeeId → Employee.id)
- CHECK (version >= 1)

---

## Indexes

- PK_StockAdjustment (id)
- UK_StockAdjustment_UUID
- UK_StockAdjustment_Branch_Number
- IDX_StockAdjustment_Branch
- IDX_StockAdjustment_Date
- IDX_StockAdjustment_Status
- IDX_StockAdjustment_Type
- IDX_StockAdjustment_ApprovedBy

---

## Sample Records

| id | branchId | adjustmentNumber | adjustmentType | adjustmentDate | status |
|----|----------|------------------|----------------|----------------|---------|
| 1 | 1 | ADJ000001 | DAMAGE | 2026-08-01 | APPROVED |
| 2 | 1 | ADJ000002 | EXPIRED | 2026-08-02 | APPROVED |
| 3 | 2 | ADJ000001 | OPENING | 2026-08-03 | DRAFT |

Note: Branch 1 and Branch 2 can both use `ADJ000001` because adjustment numbers are branch-scoped.

---

## Prisma Model

```prisma
model StockAdjustment {
  id   BigInt @id @default(autoincrement())
  uuid String @unique @default(uuid())

  adjustmentNumber String @map("adjustment_number")

  branchId BigInt @map("branch_id")

  adjustmentType String   @map("adjustment_type")
  adjustmentDate DateTime @map("adjustment_date")

  reason String

  approvedByEmployeeId BigInt?   @map("approved_by_employee_id")
  approvedAt           DateTime? @map("approved_at")

  status   String
  isActive Boolean @default(true) @map("is_active")

  createdBy BigInt? @map("created_by")

  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  version Int @default(1)

  branch     Branch    @relation(fields: [branchId], references: [id])
  approvedBy Employee? @relation(fields: [approvedByEmployeeId], references: [id])

  items StockAdjustmentItem[]

  @@unique([branchId, adjustmentNumber])
  @@index([branchId])
  @@index([adjustmentDate])
  @@index([status])
  @@index([adjustmentType])
  @@map("stock_adjustments")
}
```

---

## Notes

- This is the **header table** for branch-scoped stock adjustments.
- Individual medicine adjustments should be stored in **StockAdjustmentItem** (references Batch; branch comes from header).
- Approval workflow should be enforced before inventory is updated.
- Every approved adjustment must automatically generate corresponding **StockMovement** records at `branchId`.
- Stock should never be updated directly from this table.
- Historical adjustments should be preserved for audit and compliance purposes.
- Supports offline-first synchronization using UUID.
