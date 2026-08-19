# PrescriptionItem

## Purpose

The PrescriptionItem table stores the individual medicines prescribed within a Prescription.

Each record represents one prescribed medicine and captures dosage instructions, prescribed quantity, dispensing progress, and medicine-specific clinical information.

A Prescription Item may be fully dispensed, partially dispensed, or remain pending. One Prescription Item can generate one or more SalesInvoiceItems until the prescribed quantity is completely dispensed.

---

## Business Rules

- Every PrescriptionItem belongs to exactly one Prescription.
- Every PrescriptionItem references one Medicine.
- Prescribed Quantity must be greater than zero.
- Dispensed Quantity cannot exceed Prescribed Quantity.
- Remaining Quantity is calculated as Prescribed Quantity − Dispensed Quantity.
- Controlled medicines require pharmacist validation before dispensing.
- Once fully dispensed, the item becomes read-only.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Prescription (1)
      │
      └──────< PrescriptionItem (Many)
                     │
                     ├────────► Medicine
                     ├────────► UnitOfMeasure
                     └────────► SalesInvoiceItem
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Foreign Key | prescriptionId | INTEGER | BIGINT | No | References Prescription.id |
| Foreign Key | medicineId | INTEGER | BIGINT | No | References Medicine.id |
| Foreign Key | unitId | INTEGER | BIGINT | No | References UnitOfMeasure.id |
| Business | lineNumber | INTEGER | INTEGER | No | Line sequence number |
| Quantity | prescribedQuantity | REAL | NUMERIC(14,3) | No | Quantity prescribed |
| Quantity | dispensedQuantity | REAL | NUMERIC(14,3) | No | Quantity already dispensed |
| Quantity | remainingQuantity | REAL | NUMERIC(14,3) | No | Quantity yet to dispense |
| Medical | dosage | TEXT | VARCHAR(100) | Yes | Dosage instruction (e.g. 1 tablet) |
| Medical | frequency | TEXT | VARCHAR(50) | Yes | Frequency (e.g. Twice Daily) |
| Medical | duration | TEXT | VARCHAR(50) | Yes | Duration of treatment |
| Medical | route | TEXT | VARCHAR(30) | Yes | Oral, Injection, Topical, etc. |
| Medical | instructions | TEXT | TEXT | Yes | Additional usage instructions |
| Status | status | TEXT | VARCHAR(20) | No | PENDING, PARTIALLY_DISPENSED, DISPENSED, CANCELLED |
| Business | remarks | TEXT | TEXT | Yes | Remarks |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- Foreign Key (prescriptionId → Prescription.id)
- Foreign Key (medicineId → Medicine.id)
- Foreign Key (unitId → UnitOfMeasure.id)
- CHECK (prescribedQuantity > 0)
- CHECK (dispensedQuantity >= 0)
- CHECK (dispensedQuantity <= prescribedQuantity)
- CHECK (remainingQuantity = prescribedQuantity - dispensedQuantity)
- CHECK (status IN ('PENDING','PARTIALLY_DISPENSED','DISPENSED','CANCELLED'))
- CHECK (version >= 1)

---

## Indexes

- PK_PrescriptionItem
- UK_PrescriptionItem_UUID
- IDX_PrescriptionItem_Prescription
- IDX_PrescriptionItem_Medicine
- IDX_PrescriptionItem_Status
- IDX_PrescriptionItem_LineNumber

---

## Sample Records

| id | prescriptionId | lineNumber | medicineId | prescribedQuantity | dispensedQuantity | status |
|----|---------------:|-----------:|-----------:|-------------------:|------------------:|--------|
| 1 | 1 | 1 | 101 | 10.000 | 10.000 | DISPENSED |
| 2 | 1 | 2 | 205 | 30.000 | 10.000 | PARTIALLY_DISPENSED |
| 3 | 2 | 1 | 310 | 5.000 | 0.000 | PENDING |

---

## Prisma Model

```prisma
model PrescriptionItem {
  id                   BigInt   @id @default(autoincrement())

  uuid                 String   @unique 

  prescriptionId       BigInt

  medicineId           BigInt
  unitId               BigInt

  lineNumber           Int

  prescribedQuantity   Decimal  
  dispensedQuantity    Decimal  @default(0) 
  remainingQuantity    Decimal  

  dosage               String?
  frequency            String?
  duration             String?
  route                String?
  instructions         String?

  status               String

  remarks              String?

  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
  deletedAt            DateTime?

  version              Int      @default(1)

  prescription         Prescription @relation(fields: [prescriptionId], references: [id])
  medicine             Medicine     @relation(fields: [medicineId], references: [id])
  unit                 UnitOfMeasure @relation(fields: [unitId], references: [id])

  @@index([prescriptionId])
  @@index([medicineId])
  @@index([status])
  @@index([lineNumber])
}
```

---

## Notes

- This is the **detail (line item)** table for the Prescription document.
- Each PrescriptionItem represents one medicine prescribed by the doctor.
- During billing, the dispensing module should update:
  - `dispensedQuantity`
  - `remainingQuantity`
  - `status`
- One PrescriptionItem may generate multiple SalesInvoiceItems until the prescribed quantity is fully dispensed.
- Historical prescription items should never be modified after dispensing; changes should be tracked through audit history.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
