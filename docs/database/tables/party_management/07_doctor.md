# Doctor

## Purpose

The Doctor table stores doctor-specific professional information used for prescriptions, patient history, sales reporting, and regulatory compliance.

General information such as doctor's name, address, phone numbers, and email addresses are maintained in the Party, PartyAddress, and PartyContact tables.

This table stores only medical practice-related information.

---

## Business Rules

- Every Doctor must reference exactly one Party.
- A Party can have at most one Doctor record.
- The Party must have the DOCTOR role assigned in PartyRole.
- Registration Number should be unique.
- Doctors can be marked inactive instead of deleting them.
- Prescriptions should always reference Doctor.
- Soft delete should be used.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Party (1)
    │
    ├── PartyRole (DOCTOR)
    │
    └────── Doctor (1)
                  │
                  ├── Prescription
                  ├── SalesInvoice
                  └── Patient History
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Foreign Key | partyId | INTEGER | BIGINT | No | References Party.id |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Business | doctorCode | TEXT | VARCHAR(30) | No | Unique doctor code |
| Professional | registrationNumber | TEXT | VARCHAR(50) | No | Medical registration number |
| Professional | qualification | TEXT | VARCHAR(150) | Yes | MBBS, MD, BAMS, etc. |
| Professional | specialization | TEXT | VARCHAR(100) | Yes | Physician, Pediatrician, Cardiologist, etc. |
| Professional | hospitalName | TEXT | VARCHAR(200) | Yes | Affiliated hospital or clinic |
| Professional | consultationFee | REAL | NUMERIC(10,2) | Yes | Consultation fee |
| Status | isVisitingDoctor | INTEGER | BOOLEAN | No | Indicates visiting consultant |
| Status | isActive | INTEGER | BOOLEAN | No | Active doctor |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Foreign Key (partyId → Party.id)
- Unique (uuid)
- Unique (partyId)
- Unique (doctorCode)
- Unique (registrationNumber)
- `consultationFee` should not be negative; enforce this in the application layer.

---

## Indexes

- PK_Doctor (id)
- UK_Doctor_UUID
- UK_Doctor_Code
- UK_Doctor_Registration
- UK_Doctor_Party
- IDX_Doctor_Specialization
- IDX_Doctor_Active
- IDX_Doctor_Hospital

---

## Sample Records

| id | partyId | doctorCode | registrationNumber | qualification | specialization | hospitalName |
|----|---------|------------|--------------------|---------------|----------------|--------------|
| 1 | 40 | DOC00001 | MMC123456 | MBBS | General Physician | City Care Hospital |
| 2 | 41 | DOC00002 | MMC654321 | MD | Cardiologist | Heart Care Clinic |
| 3 | 42 | DOC00003 | MMC998877 | BAMS | Ayurveda | Wellness Clinic |

---

## Prisma Model

```prisma
model Doctor {
  id                  BigInt   @id @default(autoincrement())
  partyId             BigInt   @unique @map("party_id")

  uuid                String   @unique

  doctorCode          String   @unique @map("doctor_code")
  registrationNumber  String   @unique @map("registration_number")

  qualification       String?
  specialization      String?
  hospitalName        String? @map("hospital_name")

  consultationFee     Decimal? @map("consultation_fee")

  isVisitingDoctor    Boolean  @default(false) @map("is_visiting_doctor")
  isActive            Boolean  @default(true) @map("is_active")

  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @updatedAt @map("updated_at")
  deletedAt           DateTime? @map("deleted_at")

  version             Int      @default(1)

  party               Party    @relation(fields: [partyId], references: [id])

  @@index([specialization])
  @@index([hospitalName])
  @@index([isActive])
}
```

---

## Notes

- Stores only doctor-specific professional information.
- Personal information belongs in Party.
- Contact information belongs in PartyContact.
- Address information belongs in PartyAddress.
- A doctor must have the DOCTOR role assigned in PartyRole.
- Prescription and Sales modules should reference Doctor instead of Party.
- Registration Number should comply with the applicable medical council requirements.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.

