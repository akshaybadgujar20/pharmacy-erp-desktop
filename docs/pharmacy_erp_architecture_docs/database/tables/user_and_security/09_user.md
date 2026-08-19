# User

## Purpose

The User table stores application login accounts used to authenticate employees into the Pharmacy ERP.

A User account is separate from the Employee record because not every employee requires system access, and authentication details should remain independent of employee master data.

---

## Business Rules

- Every User must be linked to exactly one Employee.
- An Employee can have at most one User account.
- Username must be unique.
- Passwords must never be stored in plain text.
- Passwords must be stored using a secure hashing algorithm (Argon2id or bcrypt).
- User permissions are assigned through Roles.
- Accounts can be locked after repeated failed login attempts.
- Soft delete should be used instead of physical deletion.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Employee (1)
     │
     └────── User (1)
                 │
                 ├── UserRole
                 ├── UserSession
                 ├── AuditLog
                 └── ChangeHistory
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Foreign Key | employeeId | INTEGER | BIGINT | No | References Employee.id |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Authentication | username | TEXT | VARCHAR(100) | No | Login username |
| Authentication | passwordHash | TEXT | TEXT | No | Secure password hash |
| Authentication | passwordChangedAt | DATETIME | TIMESTAMP | Yes | Last password change |
| Security | failedLoginAttempts | INTEGER | INTEGER | No | Failed login count |
| Security | lockedUntil | DATETIME | TIMESTAMP | Yes | Account lock expiry |
| Security | lastLoginAt | DATETIME | TIMESTAMP | Yes | Last successful login |
| Status | isActive | INTEGER | BOOLEAN | No | Active account |
| Status | mustChangePassword | INTEGER | BOOLEAN | No | Force password change |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Foreign Key (employeeId → Employee.id)
- Unique (uuid)
- Unique (employeeId)
- Unique (username)
- CHECK failedLoginAttempts >= 0
- CHECK version >= 1

---

## Indexes

- PK_User (id)
- UK_User_UUID
- UK_User_Username
- UK_User_Employee
- IDX_User_Active
- IDX_User_LastLogin
- IDX_User_LockedUntil

---

## Sample Records

| id | employeeId | username | isActive | failedLoginAttempts | lastLoginAt |
|----|------------|----------|----------|----------------------|-------------|
| 1 | 1 | admin | Yes | 0 | 2026-08-04 09:15 |
| 2 | 2 | pharmacist01 | Yes | 1 | 2026-08-03 18:40 |
| 3 | 3 | cashier01 | Yes | 0 | 2026-08-04 10:05 |

---

## Prisma Model

```prisma
model User {
  id                    BigInt   @id @default(autoincrement())
  employeeId            BigInt   @unique

  uuid                  String   @unique 

  username              String   @unique
  passwordHash          String

  passwordChangedAt     DateTime?

  failedLoginAttempts   Int      @default(0)
  lockedUntil           DateTime?
  lastLoginAt           DateTime?

  isActive              Boolean  @default(true)
  mustChangePassword    Boolean  @default(false)

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  deletedAt             DateTime?

  version               Int      @default(1)

  employee              Employee @relation(fields: [employeeId], references: [id])

  userRoles             UserRole[]
  userSessions          UserSession[]

  @@index([isActive])
  @@index([lastLoginAt])
  @@index([lockedUntil])
}
```

---

## Notes

- Stores authentication information only.
- Personal details belong in **Party**.
- Employment information belongs in **Employee**.
- Authorization is managed through **Role**, **Permission**, and **UserRole**.
- Passwords must be stored only as secure hashes (never plaintext).
- Multi-factor authentication (MFA) can be added in the future without changing the core schema.
- User sessions should be tracked in the **UserSession** table.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
