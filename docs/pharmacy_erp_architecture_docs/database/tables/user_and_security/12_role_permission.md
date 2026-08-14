# RolePermission

## Purpose

The RolePermission table maps Roles to Permissions and forms the core of the Role-Based Access Control (RBAC) system.

A Role can have many Permissions, and a Permission can belong to many Roles.

This table enables flexible security management without changing application code.

---

## Business Rules

- Every record must reference one Role.
- Every record must reference one Permission.
- A Role cannot have the same Permission assigned more than once.
- System roles inherit permissions through this table.
- Soft delete should be used.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Role (1)
   │
   ├──────< RolePermission >────── Permission (1)
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Foreign Key | roleId | INTEGER | BIGINT | No | References Role.id |
| Foreign Key | permissionId | INTEGER | BIGINT | No | References Permission.id |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Status | isGranted | INTEGER | BOOLEAN | No | Whether permission is granted |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Foreign Key (roleId → Role.id)
- Foreign Key (permissionId → Permission.id)
- Unique (uuid)
- Unique (roleId, permissionId)
- CHECK version >= 1

---

## Indexes

- PK_RolePermission (id)
- UK_RolePermission_UUID
- UK_RolePermission_Role_Permission
- IDX_RolePermission_Role
- IDX_RolePermission_Permission
- IDX_RolePermission_Granted

---

## Sample Records

| id | roleId | permissionId | isGranted |
|----|--------|--------------|-----------|
| 1 | 1 | 1 | Yes |
| 2 | 1 | 2 | Yes |
| 3 | 2 | 1 | Yes |
| 4 | 2 | 15 | No |

---

## Prisma Model

```prisma
model RolePermission {
  id             BigInt   @id @default(autoincrement())

  roleId         BigInt
  permissionId   BigInt

  uuid           String   @unique @db.Uuid

  isGranted      Boolean  @default(true)

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  deletedAt      DateTime?

  version        Int      @default(1)

  role           Role       @relation(fields: [roleId], references: [id])
  permission     Permission @relation(fields: [permissionId], references: [id])

  @@unique([roleId, permissionId])

  @@index([roleId])
  @@index([permissionId])
  @@index([isGranted])
}
```

---

## Notes

- This is the junction table implementing the many-to-many relationship between Roles and Permissions.
- Permissions should always be assigned through this table.
- Removing a permission from a role immediately affects all users assigned to that role.
- The `isGranted` column allows future support for explicit deny rules if required.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
