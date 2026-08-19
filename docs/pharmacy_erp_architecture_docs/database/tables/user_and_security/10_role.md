# Role

## Purpose

The Role table defines security roles used for Role-Based Access Control (RBAC) within the Pharmacy ERP.

Roles group permissions together so that users can be assigned business responsibilities without granting permissions individually.

Examples:

- Administrator
- Pharmacist
- Cashier
- Store Manager
- Purchase Manager
- Inventory Manager

---

## Business Rules

- Every role must have a unique code.
- Role names should be unique.
- A role can be assigned to multiple users.
- A user can have multiple roles.
- Permissions are assigned through the RolePermission table.
- System roles cannot be deleted.
- Roles can be marked inactive instead of deleting them.
- Soft delete should be used.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Role (1)
    │
    ├──────< UserRole (Many)
    │
    └──────< RolePermission (Many)
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Business | roleCode | TEXT | VARCHAR(30) | No | Unique role code |
| Business | roleName | TEXT | VARCHAR(100) | No | Display name of the role |
| Business | description | TEXT | TEXT | Yes | Role description |
| Status | isSystemRole | INTEGER | BOOLEAN | No | Indicates built-in system role |
| Status | isActive | INTEGER | BOOLEAN | No | Active status |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- Unique (roleCode)
- Unique (roleName)
- CHECK version >= 1

---

## Indexes

- PK_Role (id)
- UK_Role_UUID
- UK_Role_Code
- UK_Role_Name
- IDX_Role_Active
- IDX_Role_SystemRole

---

## Sample Records

| id | roleCode | roleName | isSystemRole | isActive |
|----|----------|----------|--------------|----------|
| 1 | ADMIN | Administrator | Yes | Yes |
| 2 | PHARMACIST | Pharmacist | Yes | Yes |
| 3 | CASHIER | Cashier | Yes | Yes |
| 4 | STORE_MANAGER | Store Manager | No | Yes |

---

## Prisma Model

```prisma
model Role {
  id             BigInt   @id @default(autoincrement())

  uuid           String   @unique 

  roleCode       String   @unique
  roleName       String   @unique

  description    String?

  isSystemRole   Boolean  @default(false)
  isActive       Boolean  @default(true)

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  deletedAt      DateTime?

  version        Int      @default(1)

  userRoles        UserRole[]
  rolePermissions  RolePermission[]

  @@index([isActive])
  @@index([isSystemRole])
}
```

---

## Notes

- Implements Role-Based Access Control (RBAC).
- Roles should represent business responsibilities rather than individual permissions.
- Permissions are assigned through the RolePermission table.
- Users receive permissions through one or more assigned roles.
- Built-in roles (Administrator, Pharmacist, Cashier) should be marked as system roles to prevent accidental deletion.
- New roles can be added without changing application code.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
