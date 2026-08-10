# PartyRole

## Purpose

The PartyRole table defines the business roles assigned to a Party.

A single Party can have one or more roles, allowing the same person or organization to participate in multiple business processes without duplicating master data.

Examples:

- Customer
- Supplier
- Doctor
- Employee

This enables a pharmacy to maintain a single master record while supporting multiple business functions.

---

## Business Rules

- Every Party must exist before a role can be assigned.
- A Party can have multiple roles.
- The same role cannot be assigned more than once to the same Party.
- A role can be activated or deactivated without deleting the Party.
- Soft delete should be used.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Party (1)
    │
    └──────< PartyRole (Many)
                    │
                    ├── CUSTOMER
                    ├── SUPPLIER
                    ├── DOCTOR
                    └── EMPLOYEE
```

---

## Columns

| Category    | Column    | SQLite   | PostgreSQL  | Nullable | Description                          |
|-------------|-----------|----------|-------------|----------|--------------------------------------|
| Primary Key | id        | INTEGER  | BIGINT      | No       | Auto increment primary key           |
| Foreign Key | partyId   | INTEGER  | BIGINT      | No       | References Party.id                  |
| Identifier  | uuid      | TEXT     | UUID        | No       | Global unique identifier             |
| Basic       | roleType  | TEXT     | VARCHAR(30) | No       | CUSTOMER, SUPPLIER, DOCTOR, EMPLOYEE |
| Status      | isPrimary | INTEGER  | BOOLEAN     | No       | Indicates the primary/default role   |
| Status      | isActive  | INTEGER  | BOOLEAN     | No       | Whether the role is active           |
| Audit       | createdAt | DATETIME | TIMESTAMP   | No       | Record creation timestamp            |
| Audit       | updatedAt | DATETIME | TIMESTAMP   | No       | Last update timestamp                |
| Audit       | deletedAt | DATETIME | TIMESTAMP   | Yes      | Soft delete timestamp                |
| Audit       | version   | INTEGER  | INTEGER     | No       | Optimistic locking version           |

---

## Constraints

- Primary Key (id)
- Foreign Key (partyId → Party.id)
- Unique (uuid)
- Unique (partyId, roleType)
- CHECK roleType IN ('CUSTOMER','SUPPLIER','DOCTOR','EMPLOYEE')
- version >= 1

---

## Indexes

- PK_PartyRole (id)
- UK_PartyRole_UUID (uuid)
- UK_PartyRole_Party_Role (partyId, roleType)
- IDX_PartyRole_Party
- IDX_PartyRole_RoleType
- IDX_PartyRole_IsActive

---

## Sample Records

| id | partyId | uuid     | roleType | isPrimary | isActive |
|----|---------|----------|----------|-----------|----------|
| 1  | 1       | role-111 | CUSTOMER | 1         | 1        |
| 2  | 1       | role-112 | DOCTOR   | 0         | 1        |
| 3  | 2       | role-113 | SUPPLIER | 1         | 1        |

---

## Prisma Model

```prisma
model PartyRole {
  id         BigInt   @id @default(autoincrement())
  partyId    BigInt

  uuid       String   @unique @db.Uuid

  roleType   String

  isPrimary  Boolean  @default(false)
  isActive   Boolean  @default(true)

  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  deletedAt  DateTime?

  version    Int      @default(1)

  party       Party    @relation(fields: [partyId], references: [id])

  @@unique([partyId, roleType])
  @@index([partyId])
  @@index([roleType])
  @@index([isActive])
}
```

---

## Notes

- PartyRole enables a single Party to participate in multiple ERP modules.
- Role-specific attributes should **not** be stored here; they belong in their respective tables (Customer, Supplier, Doctor, Employee).
- This table serves as the bridge between the generic Party master and specialized business entities.
- Designed for offline-first synchronization using UUID and soft-delete support.
