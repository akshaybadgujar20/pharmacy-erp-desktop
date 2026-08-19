# UserRole

## Purpose

The UserRole table maps Users to Roles and completes the Role-Based Access Control (RBAC) implementation.

A User can have multiple Roles, and a Role can be assigned to multiple Users. Users inherit all permissions through their assigned roles.

Examples:

- A pharmacist may have both **PHARMACIST** and **INVENTORY_MANAGER** roles.
- An administrator may also act as a cashier.

---

## Business Rules

- Every record must reference one User.
- Every record must reference one Role.
- A User cannot be assigned the same Role more than once.
- A User must have at least one active Role to access the application.
- Roles determine permissions; direct permission assignment to Users is not supported.
- Soft delete should be used.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
User (1)
   │
   ├──────< UserRole >────── Role (1)
                                  │
                                  └──────< RolePermission
                                              │
                                              ▼
                                         Permission
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Foreign Key | userId | INTEGER | BIGINT | No | References User.id |
| Foreign Key | roleId | INTEGER | BIGINT | No | References Role.id |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Business | assignedAt | DATETIME | TIMESTAMP | No | Role assignment timestamp |
| Business | assignedByUserId | INTEGER | BIGINT | Yes | User who assigned the role |
| Status | isActive | INTEGER | BOOLEAN | No | Active role assignment |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Foreign Key (userId → User.id)
- Foreign Key (roleId → Role.id)
- Foreign Key (assignedByUserId → User.id)
- Unique (uuid)
- Unique (userId, roleId)
- CHECK version >= 1

---

## Indexes

- PK_UserRole (id)
- UK_UserRole_UUID
- UK_UserRole_User_Role
- IDX_UserRole_User
- IDX_UserRole_Role
- IDX_UserRole_Active
- IDX_UserRole_AssignedAt

---

## Sample Records

| id | userId | roleId | assignedAt | assignedByUserId | isActive |
|----|--------|--------|------------|------------------|----------|
| 1 | 1 | 1 | 2026-08-04 09:00 | 1 | Yes |
| 2 | 2 | 2 | 2026-08-04 09:15 | 1 | Yes |
| 3 | 2 | 4 | 2026-08-04 09:16 | 1 | Yes |
| 4 | 3 | 3 | 2026-08-04 09:30 | 1 | Yes |

---

## Prisma Model

```prisma
model UserRole {
  id                BigInt   @id @default(autoincrement())

  userId            BigInt
  roleId            BigInt

  uuid              String   @unique 

  assignedAt        DateTime @default(now())
  assignedByUserId  BigInt?

  isActive          Boolean  @default(true)

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  deletedAt         DateTime?

  version           Int      @default(1)

  user              User     @relation("UserRoles", fields: [userId], references: [id])
  role              Role     @relation(fields: [roleId], references: [id])

  assignedBy        User?    @relation("AssignedRoles", fields: [assignedByUserId], references: [id])

  @@unique([userId, roleId])

  @@index([userId])
  @@index([roleId])
  @@index([isActive])
  @@index([assignedAt])
}
```

---

## Notes

- This is the junction table implementing the many-to-many relationship between Users and Roles.
- Users inherit all permissions through their assigned Roles.
- A user can perform multiple business functions by having multiple active roles.
- Role assignments should be audited for security and compliance.
- Deactivating a UserRole immediately revokes permissions associated with that role.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
