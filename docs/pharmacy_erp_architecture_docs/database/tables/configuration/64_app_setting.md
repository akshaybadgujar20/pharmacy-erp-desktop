# AppSetting

## Purpose

The AppSetting table stores configurable application settings used throughout the Pharmacy ERP.

Unlike Company or Branch, which store business entities, AppSetting stores runtime configuration values that control application behavior without requiring code changes.

Typical settings include:

- Inventory Configuration
- Billing Configuration
- Purchase Configuration
- Security Configuration
- UI Preferences
- Synchronization Settings
- Printing Options
- Barcode Configuration References

Settings may be global (Company level) or Branch-specific.

---

## Business Rules

- Every setting has a unique Setting Key.
- Setting Keys are immutable once created.
- Settings may be Company-wide or Branch-specific.
- Branch settings override Company settings.
- Setting values must match their declared data type.
- Sensitive settings should be encrypted.
- Changes should be audited.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Company
    │
    ▼
AppSetting
    ▲
    │
 Branch
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Foreign Key | companyId | INTEGER | BIGINT | No | References Company.id |
| Foreign Key | branchId | INTEGER | BIGINT | Yes | References Branch.id (NULL = Company-wide) |
| Business | settingKey | TEXT | VARCHAR(100) | No | Unique configuration key |
| Business | settingName | TEXT | VARCHAR(150) | No | Display name |
| Business | settingValue | TEXT | TEXT | Yes | Configuration value |
| Business | dataType | TEXT | VARCHAR(20) | No | STRING, INTEGER, DECIMAL, BOOLEAN, JSON |
| Business | category | TEXT | VARCHAR(50) | No | BILLING, INVENTORY, SECURITY, UI, SYNC, SYSTEM |
| Business | defaultValue | TEXT | TEXT | Yes | Default value |
| Business | description | TEXT | TEXT | Yes | Description |
| Status | isEditable | INTEGER | BOOLEAN | No | User editable |
| Status | isEncrypted | INTEGER | BOOLEAN | No | Value stored encrypted |
| Status | isActive | INTEGER | BOOLEAN | No | Active setting |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- Foreign Key (companyId → Company.id)
- Foreign Key (branchId → Branch.id)
- Unique (companyId, branchId, settingKey)
- CHECK (dataType IN ('STRING','INTEGER','DECIMAL','BOOLEAN','JSON'))
- CHECK (category IN ('BILLING','INVENTORY','SECURITY','UI','SYNC','SYSTEM'))
- CHECK (version >= 1)

---

## Indexes

- PK_AppSetting
- UK_AppSetting_UUID
- UK_AppSetting_Key
- IDX_AppSetting_Company
- IDX_AppSetting_Branch
- IDX_AppSetting_Category
- IDX_AppSetting_Active

---

## Sample Records

| id | settingKey | settingValue | category |
|----|------------|--------------|----------|
| 1 | billing.allowNegativeStock | false | BILLING |
| 2 | inventory.defaultExpiryWarningDays | 90 | INVENTORY |
| 3 | sync.intervalMinutes | 5 | SYNC |
| 4 | ui.defaultTheme | LIGHT | UI |

---

## Prisma Model

```prisma
model AppSetting {
  id              BigInt   @id @default(autoincrement())

  uuid            String   @unique 

  companyId       BigInt
  branchId        BigInt?

  settingKey      String
  settingName     String

  settingValue    String?

  dataType        String
  category        String

  defaultValue    String?

  description     String?

  isEditable      Boolean  @default(true)
  isEncrypted     Boolean  @default(false)
  isActive        Boolean  @default(true)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  deletedAt       DateTime?

  version         Int      @default(1)

  company         Company @relation(fields: [companyId], references: [id])
  branch          Branch? @relation(fields: [branchId], references: [id])

  @@unique([companyId, branchId, settingKey])

  @@index([companyId])
  @@index([branchId])
  @@index([category])
  @@index([isActive])
}
```

---

## Notes

- Stores runtime configuration only—not business data.
- Company-level settings act as defaults.
- Branch-level settings override Company settings when present.
- Sensitive values such as API keys, SMTP passwords, and synchronization secrets should be encrypted before storage.
- The application should cache frequently used settings for performance and invalidate the cache when settings change.
- Historical configuration changes should be recorded through AuditLog and ChangeHistory.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
