# Permission

## Purpose

The Permission table defines the smallest unit of authorization within the Pharmacy ERP.

Permissions represent specific actions that can be performed on application resources. Roles are assigned collections of permissions, and users inherit permissions through their assigned roles.

Examples:

- Create Medicine
- Edit Medicine
- Delete Medicine
- View Purchase Invoice
- Approve Purchase Order
- Print Sales Invoice

---

## Business Rules

- Every permission must have a unique code.
- Permission names should be unique.
- Permissions are assigned to Roles through the RolePermission table.
- Users should never be assigned permissions directly.
- Permission codes should remain stable once released.
- System permissions cannot be deleted.
- Soft delete should be used.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Permission (1)
      │
      └──────< RolePermission (Many)
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Business | permissionCode | TEXT | VARCHAR(100) | No | Unique permission identifier |
| Business | permissionName | TEXT | VARCHAR(150) | No | Display name |
| Business | module | TEXT | VARCHAR(50) | No | Functional module (Sales, Purchase, Inventory, etc.) |
| Business | resource | TEXT | VARCHAR(100) | No | Business resource (Medicine, Supplier, Invoice, etc.) |
| Business | action | TEXT | VARCHAR(30) | No | VIEW, CREATE, UPDATE, DELETE, APPROVE, PRINT, EXPORT |
| Business | description | TEXT | TEXT | Yes | Permission description |
| Status | isSystemPermission | INTEGER | BOOLEAN | No | Built-in permission |
| Status | isActive | INTEGER | BOOLEAN | No | Active permission |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- Unique (permissionCode)
- Unique (module, resource, action)
- CHECK action IN ('VIEW','CREATE','UPDATE','DELETE','APPROVE','PRINT','EXPORT','IMPORT')
- CHECK version >= 1

---

## Indexes

- PK_Permission (id)
- UK_Permission_UUID
- UK_Permission_Code
- UK_Permission_Module_Resource_Action
- IDX_Permission_Module
- IDX_Permission_Action
- IDX_Permission_Active

---

## Sample Records

| id | permissionCode | module | resource | action |
|----|----------------|--------|----------|--------|
| 1 | SALES_INVOICE_VIEW | Sales | SalesInvoice | VIEW |
| 2 | SALES_INVOICE_CREATE | Sales | SalesInvoice | CREATE |
| 3 | MEDICINE_UPDATE | Medicine | Medicine | UPDATE |
| 4 | PURCHASE_APPROVE | Purchase | PurchaseOrder | APPROVE |
| 5 | INVENTORY_EXPORT | Inventory | Stock | EXPORT |

---

## Prisma Model

```prisma
model Permission {
  id                  BigInt   @id @default(autoincrement())

  uuid                String   @unique @db.Uuid

  permissionCode      String   @unique
  permissionName      String

  module              String
  resource            String
  action              String

  description         String?

  isSystemPermission  Boolean  @default(false)
  isActive            Boolean  @default(true)

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  deletedAt           DateTime?

  version             Int      @default(1)

  rolePermissions     RolePermission[]

  @@unique([module, resource, action])

  @@index([module])
  @@index([action])
  @@index([isActive])
}
```

---

## Notes

- Permission is the smallest authorization unit in the system.
- Permissions should represent business actions rather than UI components.
- Users inherit permissions through Roles; direct user-permission assignments are intentionally avoided.
- Permission codes should remain stable because they may be referenced by application code.
- System permissions should not be modified or deleted after deployment.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
