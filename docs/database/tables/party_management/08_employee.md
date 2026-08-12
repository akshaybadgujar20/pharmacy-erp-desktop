# Employee

## Purpose

The Employee table stores employee-specific information required for pharmacy operations.

General information such as employee name, address, phone numbers, and email addresses are maintained in the Party, PartyAddress, and PartyContact tables.

This table contains employment-related information used for user management, billing, inventory operations, auditing, and reporting.

---

## Business Rules

- Every Employee must reference exactly one Party.
- A Party can have at most one Employee record.
- The Party must have the EMPLOYEE role assigned in PartyRole.
- Employee Code must be unique.
- Employees may or may not have a User account.
- Employees can be assigned one or more application Roles through User accounts.
- Employees can be marked inactive instead of deleting them.
- Soft delete should be used.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Party (1)
    │
    ├── PartyRole (EMPLOYEE)
    │
    └────── Employee (1)
                  │
                  ├── User
                  ├── SalesInvoice
                  ├── PurchaseInvoice
                  ├── StockMovement
                  ├── AuditLog
                  └── ChangeHistory
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Foreign Key | partyId | INTEGER | BIGINT | No | References Party.id |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Business | employeeCode | TEXT | VARCHAR(30) | No | Unique employee code |
| Employment | designation | TEXT | VARCHAR(100) | Yes | Pharmacist, Cashier, Manager, Store Keeper, etc. |
| Employment | department | TEXT | VARCHAR(100) | Yes | Sales, Purchase, Inventory, Administration |
| Employment | joiningDate | DATE | DATE | Yes | Date of joining |
| Employment | leavingDate | DATE | DATE | Yes | Date of resignation/termination |
| Employment | salary | REAL | NUMERIC(12,2) | Yes | Monthly salary |
| Employment | licenseNumber | TEXT | VARCHAR(50) | Yes | Pharmacist license number if applicable |
| Status | isPharmacist | INTEGER | BOOLEAN | No | Indicates registered pharmacist |
| Status | isActive | INTEGER | BOOLEAN | No | Active employee |
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
- Unique (employeeCode)
- CHECK salary >= 0

---

## Indexes

- PK_Employee (id)
- UK_Employee_UUID
- UK_Employee_Code
- UK_Employee_Party
- IDX_Employee_Department
- IDX_Employee_Designation
- IDX_Employee_Pharmacist
- IDX_Employee_Active

---

## Sample Records

| id | partyId | employeeCode | designation | department | joiningDate | isPharmacist |
|----|---------|--------------|-------------|------------|-------------|--------------|
| 1 | 60 | EMP00001 | Pharmacist | Sales | 2025-01-15 | Yes |
| 2 | 61 | EMP00002 | Cashier | Sales | 2025-03-01 | No |
| 3 | 62 | EMP00003 | Store Manager | Inventory | 2024-08-10 | No |

---

## Prisma Model

```prisma
model Employee {
  id               BigInt   @id @default(autoincrement())
  partyId          BigInt   @unique

  uuid             String   @unique

  employeeCode     String   @unique

  designation      String?
  department       String?

  joiningDate      DateTime?
  leavingDate      DateTime?

  salary           Decimal?

  licenseNumber    String?

  isPharmacist     Boolean  @default(false)
  isActive         Boolean  @default(true)

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  deletedAt        DateTime?

  version          Int      @default(1)

  party            Party    @relation(fields: [partyId], references: [id])

  @@index([department])
  @@index([designation])
  @@index([isPharmacist])
  @@index([isActive])
}
```

---

## Notes

- Stores only employment-specific information.
- Personal details belong in Party.
- Contact information belongs in PartyContact.
- Address information belongs in PartyAddress.
- Authentication and authorization are handled through the User module.
- Only registered pharmacists should have a pharmacist license number.
- Employees are referenced throughout the ERP for auditing, inventory transactions, purchases, sales, and approvals.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
