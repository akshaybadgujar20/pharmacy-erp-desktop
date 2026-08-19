# SequenceGenerator

## Purpose

The SequenceGenerator table manages the automatic generation of business document numbers across the Pharmacy ERP.

It provides configurable numbering schemes for all transactional and master documents while ensuring uniqueness within a Company and Branch.

Typical sequences include:

- Sales Invoice
- Purchase Order
- Purchase Invoice
- Goods Receipt
- Sales Return
- Purchase Return
- Payment
- Receipt
- Prescription
- Customer
- Supplier

---

## Business Rules

- Every sequence belongs to one Company.
- A sequence may be global or Branch-specific.
- Every document type has one active sequence.
- Generated numbers must be unique.
- Sequence numbers must be generated atomically.
- Reset policy determines yearly or monthly restart.
- Manual editing of generated numbers should be restricted.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Company
    │
    ▼
SequenceGenerator
    │
    ├────────► Branch
    ├────────► SalesInvoice
    ├────────► PurchaseOrder
    ├────────► PurchaseInvoice
    ├────────► Payment
    ├────────► Receipt
    └────────► Prescription
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Foreign Key | companyId | INTEGER | BIGINT | No | References Company.id |
| Foreign Key | branchId | INTEGER | BIGINT | Yes | References Branch.id (NULL = Company-wide) |
| Business | documentType | TEXT | VARCHAR(50) | No | SALES_INVOICE, PURCHASE_ORDER, PAYMENT, etc. |
| Business | prefix | TEXT | VARCHAR(20) | Yes | Prefix for generated number |
| Business | suffix | TEXT | VARCHAR(20) | Yes | Suffix for generated number |
| Business | currentNumber | INTEGER | BIGINT | No | Last generated sequence number |
| Business | incrementBy | INTEGER | INTEGER | No | Increment value |
| Business | paddingLength | INTEGER | INTEGER | No | Number padding length |
| Business | resetPolicy | TEXT | VARCHAR(20) | No | NEVER, YEARLY, MONTHLY, DAILY |
| Business | format | TEXT | VARCHAR(100) | Yes | Number format template |
| Status | isActive | INTEGER | BOOLEAN | No | Active sequence |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- Foreign Key (companyId → Company.id)
- Foreign Key (branchId → Branch.id)
- Unique (companyId, branchId, documentType)
- CHECK (currentNumber >= 0)
- CHECK (incrementBy > 0)
- CHECK (paddingLength > 0)
- CHECK (resetPolicy IN ('NEVER','YEARLY','MONTHLY','DAILY'))
- CHECK (version >= 1)

---

## Indexes

- PK_SequenceGenerator
- UK_SequenceGenerator_UUID
- UK_SequenceGenerator_Document
- IDX_SequenceGenerator_Company
- IDX_SequenceGenerator_Branch
- IDX_SequenceGenerator_Active

---

## Sample Records

| id | documentType | prefix | currentNumber | resetPolicy |
|----|--------------|--------|--------------:|-------------|
| 1 | SALES_INVOICE | SI | 10542 | YEARLY |
| 2 | PURCHASE_ORDER | PO | 254 | YEARLY |
| 3 | PAYMENT | PAY | 840 | NEVER |

---

## Prisma Model

```prisma
model SequenceGenerator {
  id               BigInt   @id @default(autoincrement())

  uuid             String   @unique 

  companyId        BigInt
  branchId         BigInt?

  documentType     String

  prefix           String?
  suffix           String?

  currentNumber    BigInt

  incrementBy      Int      @default(1)

  paddingLength    Int      @default(6)

  resetPolicy      String

  format           String?

  isActive         Boolean  @default(true)

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  version          Int      @default(1)

  company          Company @relation(fields: [companyId], references: [id])
  branch           Branch? @relation(fields: [branchId], references: [id])

  @@unique([companyId, branchId, documentType])

  @@index([companyId])
  @@index([branchId])
  @@index([isActive])
}
```

---

## Notes

- Stores numbering configuration only; generated document numbers are stored in the respective business tables.
- Sequence generation should occur inside a database transaction to prevent duplicate numbers.
- Branch-specific sequences allow independent numbering across multiple locations.
- Reset policies should be executed automatically during the configured period change.
- Document numbers should never be reused, even if the originating document is cancelled.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
