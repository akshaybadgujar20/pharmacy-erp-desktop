# UserSession

## Purpose

The UserSession table tracks user login sessions within the Pharmacy ERP.

It records authentication events, active sessions, logout history, and device information for security auditing and session management.

This table is especially useful for:

- Login auditing
- Session timeout handling
- Concurrent login control
- Device tracking
- Security investigations

---

## Business Rules

- Every session belongs to exactly one User.
- A User can have multiple sessions.
- Only active sessions should be considered for authentication.
- Sessions expire automatically after the configured timeout.
- Logging out should mark the session as inactive instead of deleting it.
- Expired sessions should remain for audit purposes.
- Soft delete should rarely be required because session history is valuable.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
User (1)
    │
    └──────< UserSession (Many)
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Foreign Key | userId | INTEGER | BIGINT | No | References User.id |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Authentication | sessionToken | TEXT | VARCHAR(255) | No | Unique session identifier |
| Authentication | refreshToken | TEXT | TEXT | Yes | Refresh token if applicable |
| Device | deviceName | TEXT | VARCHAR(100) | Yes | Device name |
| Device | deviceType | TEXT | VARCHAR(50) | Yes | Desktop, Laptop, Tablet |
| Device | operatingSystem | TEXT | VARCHAR(100) | Yes | Windows, Linux, macOS |
| Device | applicationVersion | TEXT | VARCHAR(30) | Yes | ERP application version |
| Network | ipAddress | TEXT | VARCHAR(50) | Yes | Client IP address |
| Network | loginTime | DATETIME | TIMESTAMP | No | Login timestamp |
| Network | lastActivityAt | DATETIME | TIMESTAMP | No | Last activity timestamp |
| Network | logoutTime | DATETIME | TIMESTAMP | Yes | Logout timestamp |
| Network | expiresAt | DATETIME | TIMESTAMP | No | Session expiration time |
| Status | isActive | INTEGER | BOOLEAN | No | Indicates active session |
| Status | logoutReason | TEXT | VARCHAR(50) | Yes | USER_LOGOUT, TIMEOUT, FORCE_LOGOUT |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Foreign Key (userId → User.id)
- Unique (uuid)
- Unique (sessionToken)
- CHECK logoutReason IN ('USER_LOGOUT','TIMEOUT','FORCE_LOGOUT','SYSTEM_RESTART')
- CHECK version >= 1

---

## Indexes

- PK_UserSession (id)
- UK_UserSession_UUID
- UK_UserSession_Token
- IDX_UserSession_User
- IDX_UserSession_Active
- IDX_UserSession_LoginTime
- IDX_UserSession_ExpiresAt

---

## Sample Records

| id | userId | sessionToken | loginTime | expiresAt | isActive |
|----|--------|--------------|------------|-----------|----------|
| 1 | 1 | sess_a81d9f | 2026-08-04 09:00 | 2026-08-04 17:00 | Yes |
| 2 | 2 | sess_b12f4c | 2026-08-04 09:15 | 2026-08-04 17:15 | Yes |
| 3 | 3 | sess_c72aa1 | 2026-08-03 10:00 | 2026-08-03 18:00 | No |

---

## Prisma Model

```prisma
model UserSession {
  id                  BigInt   @id @default(autoincrement())

  userId              BigInt

  uuid                String   @unique 

  sessionToken        String   @unique
  refreshToken        String?

  deviceName          String?
  deviceType          String?
  operatingSystem     String?
  applicationVersion  String?

  ipAddress           String?

  loginTime           DateTime
  lastActivityAt      DateTime
  logoutTime          DateTime?
  expiresAt           DateTime

  isActive            Boolean  @default(true)
  logoutReason        String?

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  deletedAt           DateTime?

  version             Int      @default(1)

  user                User     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([isActive])
  @@index([loginTime])
  @@index([expiresAt])
}
```

---

## Notes

- Maintains complete authentication history for auditing.
- Supports automatic session timeout and forced logout.
- Multiple active sessions per user can be enabled or restricted through business rules.
- Stores device information to help identify suspicious login activity.
- Useful for compliance, troubleshooting, and security reporting.
- In the current Electron + NestJS offline architecture, session tracking can be simplified while retaining this schema for future cloud synchronization.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
