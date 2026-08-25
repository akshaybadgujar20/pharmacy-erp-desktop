# Security

## Application Security

- Context Isolation enabled
- Node Integration disabled
- Content Security Policy
- Signed application builds
- Encrypted sensitive data
- Principle of least privilege
- Input validation everywhere
- Secure IPC APIs only

HTTP hardening (`helmet`, CORS, `ValidationPipe`) — see [Early foundations — Security hardening](./early-foundations.md#security-hardening).

## Authentication

Use JWT between Angular and NestJS.

### Implemented

The local Nest backend implements JWT auth, session-backed refresh tokens, bcrypt passwords, account lockout, and global RBAC guards. Full setup, env vars, demo credentials, and API details:

**[Early foundations — Authentication](./early-foundations.md#authentication-configuration)**

Roles (seed):

- Admin
- Pharmacist
- Cashier
- Manager
- Procurement

Permissions should always be checked in the backend, never only in the UI. Format: `MODULE:RESOURCE:ACTION` (e.g. `SALES:SALES_INVOICE:CREATE`).

## Configuration-Driven Security

Do not hardcode GST rates, invoice templates, barcode formats, printer mappings, store settings, or permissions. Store these in configuration tables (`AppSetting` and related config entities).

`SettingsService` reads `AppSetting` with branch → company fallback. See [Early foundations — Configuration-driven settings](./early-foundations.md#configuration-driven-settings-appsetting).

## Related docs

- [Early foundations](./early-foundations.md)
- [Logging and audit](./logging-and-audit.md) — audit trail for security events
