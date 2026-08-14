# PurchaseReturn

## Purpose

The PurchaseReturn table represents the **header document** for returning purchased medicines or products to a supplier.

Purchase Returns are created when goods need to be sent back due to:

- Expired medicines
- Damaged goods
- Wrong medicine supplied
- Excess quantity received
- Batch recall
- Pricing disputes
- Quality issues

Posting a Purchase Return reduces inventory, creates StockMovement records, adjusts supplier payable balances, and may generate a supplier credit note.

---

## Business Rules

- Every Purchase Return belongs to exactly one Supplier.
- Every Purchase Return contains one or more PurchaseReturnItems.
- A Purchase Return may reference one Purchase Invoice.
- A Purchase Invoice can have multiple Purchase Returns.
- Return quantity cannot exceed the available purchased quantity.
- Approved returns cannot be modified.
- Cancelling a return requires reversal inventory and accounting entries.
- Every approved Purchase Return creates **OUT** StockMovement records.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Supplier
     │
     ▼
PurchaseInvoice
     │
     ▼
PurchaseReturn
     │
     ├──────< PurchaseReturnItem
     │
     ├────────► StockMovement
     └────────► LedgerEntry
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Business | purchaseReturnNumber | TEXT | VARCHAR(30) | No | Internal return document number |
| Foreign Key | supplierId | INTEGER | BIGINT | No | References Supplier.id |
| Foreign Key | purchaseInvoiceId | INTEGER | BIGINT | Yes | References PurchaseInvoice.id |
| Foreign Key | branchId | INTEGER | BIGINT | No | Branch returning goods |
| Business | returnDate | DATE | DATE | No | Return date |
| Business | returnReason | TEXT | TEXT | No | Reason for return |
| Financial | totalAmount | REAL | NUMERIC(14,2) | No | Total return value |
| Status | status | TEXT | VARCHAR(20) | No | DRAFT, APPROVED, SENT, COMPLETED, CANCELLED |
| Business | supplierCreditNoteNo | TEXT | VARCHAR(50) | Yes | Supplier credit note reference |
| Business | remarks | TEXT | TEXT | Yes | General remarks |
| Foreign Key | approvedByEmployeeId | INTEGER | BIGINT | Yes | Approving employee |
| Business | approvedAt | DATETIME | TIMESTAMP | Yes | Approval timestamp |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- Unique (purchaseReturnNumber)
- Foreign Key (supplierId → Supplier.id)
- Foreign Key (purchaseInvoiceId → PurchaseInvoice.id)
- Foreign Key (branchId → Branch.id)
- Foreign Key (approvedByEmployeeId → Employee.id)
- CHECK (totalAmount >= 0)
- CHECK (status IN ('DRAFT','APPROVED','SENT','COMPLETED','CANCELLED'))
- CHECK (version >= 1)

---

## Indexes

- PK_PurchaseReturn
- UK_PurchaseReturn_UUID
- UK_PurchaseReturn_Number
- IDX_PurchaseReturn_Supplier
- IDX_PurchaseReturn_Invoice
- IDX_PurchaseReturn_Date
- IDX_PurchaseReturn_Status

---

## Sample Records

| id | purchaseReturnNumber | supplierId | purchaseInvoiceId | returnDate | totalAmount | status |
|----|----------------------|-----------:|------------------:|------------|------------:|--------|
| 1 | PR2500001 | 12 | 1 | 2026-08-12 | 1,250.00 | APPROVED |
| 2 | PR2500002 | 18 | 2 | 2026-08-15 | 850.00 | SENT |
| 3 | PR2500003 | 12 | 1 | 2026-08-18 | 425.00 | DRAFT |

---

## Prisma Model

```prisma
model PurchaseReturn {
  id                      BigInt   @id @default(autoincrement())

  uuid                    String   @unique @db.Uuid

  purchaseReturnNumber    String   @unique

  supplierId              BigInt
  purchaseInvoiceId        BigInt?
  branchId                BigInt

  returnDate              DateTime

  returnReason            String

  totalAmount             Decimal  @db.Decimal(14,2)

  status                  String

  supplierCreditNoteNo    String?

  remarks                 String?

  approvedByEmployeeId    BigInt?
  approvedAt              DateTime?

  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt
  deletedAt               DateTime?

  version                 Int      @default(1)

  supplier                Supplier         @relation(fields: [supplierId], references: [id])
  purchaseInvoice         PurchaseInvoice? @relation(fields: [purchaseInvoiceId], references: [id])
  branch                  Branch           @relation(fields: [branchId], references: [id])
  approvedBy              Employee?        @relation(fields: [approvedByEmployeeId], references: [id])

  items                   PurchaseReturnItem[]

  @@index([supplierId])
  @@index([purchaseInvoiceId])
  @@index([branchId])
  @@index([returnDate])
  @@index([status])
}
```

---

## Notes

- This is the **header table** for Purchase Return documents.
- Individual medicines are stored in **PurchaseReturnItem**.
- Posting a Purchase Return should:
  - Reduce inventory through **StockMovement (OUT)**.
  - Update the **Stock** table.
  - Reduce supplier payable.
  - Generate accounting entries.
- Return quantities should be validated against the original Purchase Invoice or Goods Receipt.
- Historical Purchase Returns should never be deleted after approval.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
