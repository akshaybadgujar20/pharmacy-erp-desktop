# PrinterConfiguration

## Purpose

The PrinterConfiguration table stores printer settings used throughout the Pharmacy ERP.

It allows different printers to be assigned for invoices, receipts, labels, prescriptions, reports, and barcode printing. Configuration can be defined at the Company level or overridden for individual Branches.

This enables automatic printer selection without changing application code.

---

## Business Rules

- Every printer configuration belongs to one Company.
- A printer configuration may optionally belong to one Branch.
- Printer Name must be unique within a Company and Branch.
- Only one default printer may exist for each document type per Branch.
- Inactive printers cannot be selected for printing.
- Changes to printer configuration should be audited.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Company
    │
    ▼
PrinterConfiguration
    ▲
    │
 Branch
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Foreign Key | companyId | INTEGER | BIGINT | No | References Company.id |
| Foreign Key | branchId | INTEGER | BIGINT | Yes | References Branch.id (NULL = Company-wide) |
| Business | printerName | TEXT | VARCHAR(150) | No | Logical printer name |
| Business | printerType | TEXT | VARCHAR(30) | No | LASER, THERMAL, LABEL, DOT_MATRIX, PDF |
| Business | documentType | TEXT | VARCHAR(50) | No | SALES_INVOICE, RECEIPT, PURCHASE, LABEL, PRESCRIPTION, REPORT |
| Business | printerPath | TEXT | VARCHAR(300) | Yes | OS printer name or network path |
| Business | paperSize | TEXT | VARCHAR(20) | Yes | A4, A5, 80MM, 58MM, LABEL |
| Business | copies | INTEGER | INTEGER | No | Default number of copies |
| Business | printOrientation | TEXT | VARCHAR(20) | No | PORTRAIT, LANDSCAPE |
| Status | isDefault | INTEGER | BOOLEAN | No | Default printer for document type |
| Status | isActive | INTEGER | BOOLEAN | No | Active printer |
| Business | remarks | TEXT | TEXT | Yes | Additional notes |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- Foreign Key (companyId → Company.id)
- Foreign Key (branchId → Branch.id)
- Unique (companyId, branchId, printerName)
- CHECK (copies > 0)
- CHECK (printerType IN ('LASER','THERMAL','LABEL','DOT_MATRIX','PDF'))
- CHECK (documentType IN ('SALES_INVOICE','PURCHASE_INVOICE','RECEIPT','PAYMENT','LABEL','PRESCRIPTION','REPORT'))
- CHECK (printOrientation IN ('PORTRAIT','LANDSCAPE'))
- CHECK (version >= 1)

---

## Indexes

- PK_PrinterConfiguration
- UK_PrinterConfiguration_UUID
- UK_PrinterConfiguration_Name
- IDX_PrinterConfiguration_Company
- IDX_PrinterConfiguration_Branch
- IDX_PrinterConfiguration_DocumentType
- IDX_PrinterConfiguration_Default
- IDX_PrinterConfiguration_Active

---

## Sample Records

| id | printerName | printerType | documentType | paperSize | isDefault |
|----|-------------|-------------|--------------|-----------|-----------|
| 1 | EPSON TM-T82 | THERMAL | SALES_INVOICE | 80MM | Yes |
| 2 | HP LaserJet | LASER | PURCHASE_INVOICE | A4 | Yes |
| 3 | Zebra ZD230 | LABEL | LABEL | LABEL | Yes |

---

## Prisma Model

```prisma
model PrinterConfiguration {
  id                BigInt   @id @default(autoincrement())

  uuid              String   @unique @db.Uuid

  companyId         BigInt
  branchId          BigInt?

  printerName       String
  printerType       String

  documentType      String

  printerPath       String?

  paperSize         String?

  copies            Int      @default(1)

  printOrientation  String   @default("PORTRAIT")

  isDefault         Boolean  @default(false)
  isActive          Boolean  @default(true)

  remarks           String?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  deletedAt         DateTime?

  version           Int      @default(1)

  company           Company @relation(fields: [companyId], references: [id])
  branch            Branch? @relation(fields: [branchId], references: [id])

  @@unique([companyId, branchId, printerName])

  @@index([companyId])
  @@index([branchId])
  @@index([documentType])
  @@index([isDefault])
  @@index([isActive])
}
```

---

## Notes

- Stores printer definitions only; actual print jobs should be managed by a separate print service.
- Branch-specific printer configurations override Company defaults.
- Multiple printers can exist for different document types.
- Printing should be routed automatically based on the document type and Branch.
- Changes to printer configuration should be recorded in AuditLog and ChangeHistory.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
