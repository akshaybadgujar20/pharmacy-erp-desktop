# Party

## Purpose

The Party table is the master entity for every person or organization in the Pharmacy ERP.

A Party can represent:

- Customer
- Supplier
- Doctor
- Employee
- Company
- Any future business entity

Instead of storing duplicate information in separate tables, common information is stored once in Party, while specific roles are maintained in PartyRole.

---

## Business Rules

- Every party must have a unique UUID.
- Every customer, supplier, doctor, and employee must have exactly one Party record.
- A Party can have multiple roles.
- A Party can have multiple addresses.
- A Party can have multiple contact numbers.
- Soft delete should be used.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```text
Party (1)
│
├── PartyRole (Many)
├── PartyAddress (Many)
├── PartyContact (Many)
│
├── Customer (Optional 1)
├── Supplier (Optional 1)
├── Doctor (Optional 1)
└── Employee (Optional 1)
```

---

## Columns

| Category     | Column           | SQLite   | PostgreSQL   | Nullable | Description                       |
|--------------|------------------|----------|--------------|----------|-----------------------------------|
| Primary Key  | id               | INTEGER  | BIGINT       | No       | Auto increment primary key        |
| Identifier   | uuid             | TEXT     | UUID         | No       | Global unique identifier for sync |
| Basic        | partyType        | TEXT     | VARCHAR(30)  | No       | PERSON or ORGANIZATION            |
| Basic        | displayName      | TEXT     | VARCHAR(200) | No       | Name displayed throughout ERP     |
| Person       | firstName        | TEXT     | VARCHAR(100) | Yes      | First name                        |
| Person       | middleName       | TEXT     | VARCHAR(100) | Yes      | Middle name                       |
| Person       | lastName         | TEXT     | VARCHAR(100) | Yes      | Last name                         |
| Organization | organizationName | TEXT     | VARCHAR(200) | Yes      | Company/Organization name         |
| Status       | isActive         | INTEGER  | BOOLEAN      | No       | Active status                     |
| Audit        | createdAt        | DATETIME | TIMESTAMP    | No       | Record creation timestamp         |
| Audit        | updatedAt        | DATETIME | TIMESTAMP    | No       | Last update timestamp             |
| Audit        | deletedAt        | DATETIME | TIMESTAMP    | Yes      | Soft delete timestamp             |
| Audit        | version          | INTEGER  | INTEGER      | No       | Optimistic locking version        |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- CHECK partyType IN ('PERSON', 'ORGANIZATION')
- version >= 1

---

## Indexes

- PK_Party (id)
- UK_Party_UUID (uuid)
- IDX_Party_DisplayName
- IDX_Party_PartyType
- IDX_Party_IsActive

---

## Sample Records

| id | uuid      | partyType    | displayName | firstName | lastName | organizationName   |
|----|-----------|--------------|-------------|-----------|----------|--------------------|
| 1  | xxxxx-111 | PERSON       | John Doe    | John      | Doe      | NULL               |
| 2  | xxxxx-222 | ORGANIZATION | ABC Pharma  | NULL      | NULL     | ABC Pharma Pvt Ltd |

---

## Prisma Model

```prisma
enum PartyType {
  PERSON
  ORGANIZATION
}

model Party {
  id               BigInt    @id @default(autoincrement())
  uuid             String    @unique
  partyType        PartyType @map("party_type")   
  displayName      String    @map("display_name")

  firstName        String? @map("first_name")
  middleName       String? @map("middle_name")
  lastName         String? @map("last_name")

  organizationName String? @map("organization_name")

  isActive         Boolean   @default(true) @map("is_active")

  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  deletedAt        DateTime?

  version          Int       @default(1)

  partyRoles       PartyRole[]
  addresses        PartyAddress[]
  contacts         PartyContact[]

  customer         Customer?
  supplier         Supplier?
  doctor           Doctor?
  employee         Employee?

  @@index([displayName])
  @@index([partyType])
  @@index([isActive])
}
```

---

## Notes

- This is the most important master table in the database.
- Avoid storing duplicate personal or organization information elsewhere.
- Role-specific data should be stored in Customer, Supplier, Doctor, Employee, etc.
- Contact details should be stored in PartyContact.
- Address information should be stored in PartyAddress.
- Designed for offline-first synchronization using UUID.



