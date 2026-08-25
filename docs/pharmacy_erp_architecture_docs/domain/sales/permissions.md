# Sales — Permissions

## Purpose

Define authorization for sales operations using the system-wide RBAC pattern `MODULE:RESOURCE:ACTION`. Sales staff at the counter need controlled ability to create and view invoices without access to purchasing, pricing admin, or cross-branch data.

**Database reference:** [Sales overview](../../database/tables/sales/sales.md)

## Responsibilities

- Document required permissions for invoice lifecycle
- Map seed permissions to canonical codes
- Describe branch and tenant enforcement beyond permission checks

## Scope

### In Scope

- Sales invoice create and read
- Implicit needs for payment recording on invoice (same module today)
- Branch-scoped data access rules

### Out of Scope

- Role definitions and role-permission assignments (security seed / admin UI)
- JWT and session mechanics (Auth module)

## Related Entities

- `Permission` seed: `SALES_CREATE`, `SALES_VIEW` map to canonical codes below
- `User`, `Role`, `RolePermission`
- `SalesInvoice` and related documents

## Business Rules

- Permission format: `MODULE:RESOURCE:ACTION` (colon-separated).
- **Canonical sales permissions (current seed):**

| Code | permissionCode (seed) | Description |
|------|----------------------|-------------|
| `SALES:SALES_INVOICE:CREATE` | `SALES_CREATE` | Create draft, edit draft, post invoice, record payment on invoice |
| `SALES:SALES_INVOICE:READ` | `SALES_VIEW` | List and view invoices, lines, payments, returns |

- Future permissions (not in seed yet): `SALES:SALES_INVOICE:CANCEL`, `SALES:SALES_RETURN:APPROVE`, `SALES:SALES_INVOICE:EXPORT`.
- Permission check runs after JWT auth and before handler; `PermissionsGuard` reads `@RequirePermissions()`.
- Branch isolation: user must belong to invoice `branchId` even with READ permission.
- System permissions (`isSystemPermission: true`) cannot be deleted by tenant admin.

## Domain Events

- Authorization failures do not emit domain events; audit may log `ACCESS_DENIED` via application logger.

## State Model

Not applicable — permissions are boolean grants on roles, not document states.

## Integrations

- **Auth:** JWT payload carries permission codes resolved at login from roles
- **Audit:** Optional audit on denied post attempts
- **Request context:** `branchId`, `userId`, `companyId` from token + session

## Security

- Least privilege: cashiers get CREATE + READ on own branch only.
- Managers receive cancel/return approve when those permissions are added.
- Sensitive fields (patient on Schedule H) still require READ — redaction is UI policy, not separate permission in v1.

## Performance

- Permission list cached in JWT (15m access token) — role changes require re-login or refresh.
- Avoid per-line permission checks; gate at controller operation level.

## Future

- Field-level permissions for discount override
- Shift-based temporary elevation with audit trail
- Align seed `permissionCode` strings with canonical `MODULE:RESOURCE:ACTION` display
