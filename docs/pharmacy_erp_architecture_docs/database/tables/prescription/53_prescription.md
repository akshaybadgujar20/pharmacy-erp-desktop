# Prescription

## Purpose

The Prescription table stores the prescription header issued by a registered medical practitioner.

A Prescription represents the doctor's order for one patient and may contain one or more prescribed medicines. It serves as the clinical document that can later be converted into a Sales Invoice.

The prescription stores patient information, doctor details, prescription validity, diagnosis, and overall status.

---

## Business Rules

- Every Prescription belongs to one Customer (Patient).
- Every Prescription belongs to one Doctor.
- Every Prescription contains one or more PrescriptionItems.
- Prescription Number must be unique.
- A Prescription may generate one or more Sales Invoices.
- Expired prescriptions cannot be billed unless overridden by authorized users.
- Controlled medicines require a valid prescription.
- Cancelled prescriptions cannot be invoiced.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Customer (Patient)
        │
        ▼
Prescription
        │
        ├────────► Doctor
        │
        ├──────< PrescriptionItem
        │
        └────────► SalesInvoice
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Business | prescriptionNumber | TEXT | VARCHAR(30) | No | Unique prescription number |
| Foreign Key | customerId | INTEGER | BIGINT | No | References Customer.id |
| Foreign Key | doctorId | INTEGER | BIGINT | No | References Doctor.id |
| Foreign Key | branchId | INTEGER | BIGINT | No | Dispensing branch |
| Business | prescriptionDate | DATETIME | TIMESTAMP | No | Prescription issue date |
| Business | validUntil | DATE | DATE | Yes | Prescription validity |
| Medical | diagnosis | TEXT | TEXT | Yes | Diagnosis or clinical notes |
| Medical | symptoms | TEXT | TEXT | Yes | Patient symptoms |
| Business | visitNumber | TEXT | VARCHAR(30) | Yes | OPD/IPD visit reference |
| Status | status | TEXT | VARCHAR(20) | No | DRAFT, ACTIVE, PARTIALLY_DISPENSED, DISPENSED, EXPIRED, CANCELLED |
| Business | remarks | TEXT | TEXT | Yes | Additional remarks |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- Unique (prescriptionNumber)
- Foreign Key (customerId → Customer.id)
- Foreign Key (doctorId → Doctor.id)
- Foreign Key (branchId → Branch.id)
- CHECK (status IN ('DRAFT','ACTIVE','PARTIALLY_DISPENSED','DISPENSED','EXPIRED','CANCELLED'))
- CHECK (validUntil IS NULL OR validUntil >= prescriptionDate)
- CHECK (version >= 1)

---

## Indexes

- PK_Prescription
- UK_Prescription_UUID
- UK_Prescription_Number
- IDX_Prescription_Customer
- IDX_Prescription_Doctor
- IDX_Prescription_Date
- IDX_Prescription_Status
- IDX_Prescription_Branch

---

## Sample Records

| id | prescriptionNumber | customerId | doctorId | prescriptionDate | status |
|----|--------------------|-----------:|----------:|------------------|--------|
| 1 | RX2500001 | 101 | 25 | 2026-08-20 | ACTIVE |
| 2 | RX2500002 | 205 | 18 | 2026-08-21 | DISPENSED |
| 3 | RX2500003 | 310 | 41 | 2026-08-22 | PARTIALLY_DISPENSED |

---

## Prisma Model

```prisma
model Prescription {
  id                  BigInt   @id @default(autoincrement())

  uuid                String   @unique @db.Uuid

  prescriptionNumber  String   @unique

  customerId          BigInt
  doctorId            BigInt
  branchId            BigInt

  prescriptionDate    DateTime
  validUntil          DateTime?

  diagnosis           String?
  symptoms            String?

  visitNumber         String?

  status              String

  remarks             String?

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  deletedAt           DateTime?

  version             Int      @default(1)

  customer            Customer @relation(fields: [customerId], references: [id])
  doctor              Doctor   @relation(fields: [doctorId], references: [id])
  branch              Branch   @relation(fields: [branchId], references: [id])

  items               PrescriptionItem[]
  salesInvoices       SalesInvoice[]

  @@index([customerId])
  @@index([doctorId])
  @@index([branchId])
  @@index([prescriptionDate])
  @@index([status])
}
```

---

## Notes

- This is the **header table** for medical prescriptions.
- Individual prescribed medicines are stored in **PrescriptionItem**.
- A Prescription may be partially dispensed over multiple Sales Invoices until all medicines are issued.
- The system should validate prescription expiry before billing.
- Schedule H, Schedule X, narcotic, or other controlled medicines should require a valid Prescription before dispensing.
- Historical prescriptions should never be modified after dispensing; corrections should be handled through versioning or cancellation with audit history.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
