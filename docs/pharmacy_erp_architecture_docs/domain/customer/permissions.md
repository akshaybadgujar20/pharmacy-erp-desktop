# Customer — Permissions

## Purpose

Document authorization requirements for customer master-data and loyalty adjustment operations using the `MODULE:RESOURCE:ACTION` RBAC model.

## Responsibilities

- Map domain operations to permission codes.
- Clarify read vs write access for POS and back-office roles.

## Scope

### In Scope

- Party and Customer CRUD, loyalty manual adjustments (planned).

### Out of Scope

- Sales invoice permissions (`SALES:*`).
- Finance receipt permissions.

## Related Entities

Customer data protected under Party resource. Seed reference: `PARTY_MANAGE` in `backend/seed/data/security/permission.json`.

## Permission Model

Canonical format: **`MODULE:RESOURCE:ACTION`**

| Permission code | Module | Resource | Action | Seeded |
|-----------------|--------|----------|--------|--------|
| `PARTY:PARTY:UPDATE` | PARTY | PARTY | UPDATE | Yes (`PARTY_MANAGE`) |
| `PARTY:PARTY:READ` | PARTY | PARTY | READ | Planned |
| `LOYALTY:TRANSACTION:CREATE` | LOYALTY | TRANSACTION | CREATE | Planned |

## Operation Matrix

| Operation | Required permission | Notes |
|-----------|---------------------|-------|
| View customer list / search | `SALES:VIEW` or `PARTY:PARTY:READ` | POS may use sales read |
| Register customer | `PARTY:PARTY:UPDATE` | WF-C01 |
| Update profile, addresses | `PARTY:PARTY:UPDATE` | |
| Change credit limit | `PARTY:PARTY:UPDATE` | Supervisor role mapping TBD |
| Deactivate / archive | `PARTY:PARTY:UPDATE` | |
| Manual loyalty adjustment | `LOYALTY:TRANSACTION:CREATE` | Future; supervisor only |
| View loyalty history | `SALES:VIEW` or dedicated read | |

## Business Rules

- Permission checks run in guards before controller and again in application service for defense in depth.
- System permissions (`isSystemPermission = true`) cannot be removed from admin role.

## Domain Events

Audit log captures `userId` and permission context on mutating operations.

## State Model

No permission distinction between Active and Inactive for read; write on Archived blocked.

## Integrations

- `@RequirePermissions('PARTY:PARTY:UPDATE')` decorator on NestJS controllers.
- JWT payload carries permission codes resolved from User → Role → RolePermission.

## Security Considerations

- Principle of least privilege: cashiers get read + register; managers get `PARTY:PARTY:UPDATE`.
- PII export requires explicit future permission `PARTY:PARTY:EXPORT`.
- All mutations audited via `AuditService` in same transaction.

## Performance Considerations

- Permission set cached in JWT for 15m access token lifetime; refresh on role change.

## Future Enhancements

- Field-level ACL (credit limit vs address edit).
- Branch-scoped customer visibility for multi-branch chains.
