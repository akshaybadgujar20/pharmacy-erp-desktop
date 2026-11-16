# Early Foundations (Implemented)

Cross-cutting platform layer implemented before feature modules (Sales, Inventory, etc.). Covers authentication, request context, config-driven settings, Angular data layer, Electron secure storage, i18n, and keyboard shortcuts.

Handbook references: §11 Authentication, §12 Offline First (local HTTP), §18 Keyboard First, §20 Configuration Driven, §29 Security, §36 Multi Store (branch scoping), §38 Localization.

---

## Architecture overview

```text
Electron (main + preload)
    │  IPC: device info, secure token store
    ▼
Angular renderer (localhost:4200)
    │  HTTP + Bearer JWT + x-device-id
    ▼
NestJS (localhost:3000)
    ├─ CorrelationMiddleware → RequestContext (device, correlation, dev tenant fallbacks)
    ├─ JwtAuthGuard → req.user
    ├─ ContextEnrichInterceptor → userId / companyId / branchId from JWT
    ├─ PermissionsGuard → @RequirePermissions(...)
    └─ Feature handlers → Outbox / Sequence / Settings (read tenant from context)
```

Transport: **HTTP to local Nest** (not IPC for API calls). IPC is used only for device identity and encrypted token storage.

---

## Local development

Run backend and Angular separately:

```bash
# Terminal 1 — Nest API (port 3000)
cd backend
npm run start:dev

# Terminal 2 — Angular dev server (port 4200)
npm start

# Optional — Electron shell loading Angular
npm run dev
```

### Demo login (seeded database)

After `npm run db:seed` or `npm run db:seed:fresh`:

| Username   | Role (seed)   | Password   |
|------------|---------------|------------|
| `admin`    | Administrator | `admin123` |
| `cashier1` | Cashier       | `admin123` |
| `pharmacist1` | Pharmacist | `admin123` |

All seeded users share password `admin123`. Change before any production deployment.

### Fresh database

```bash
cd backend
npm run db:seed:fresh   # wipe seed tables + full reseed
npm run db:reset        # force-reset schema + fresh seed
```

To add more demo rows without wiping: `npm run db:seed`. To re-run later phases only: `npm run db:seed -- --only <phase>`. See [backend/seed/README.md](../../../backend/seed/README.md).

---

## Environment variables (backend)

Set in shell, `.env` (via `@nestjs/config`), or Electron main process before Nest starts.

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `3000` | Nest HTTP listen port |
| `NODE_ENV` | `development` | `production` disables dev-only request-context header overrides |
| `JWT_SECRET` | `pharmacy-erp-dev-secret-change-in-production` | **Change in production** — signs access tokens |
| `DEVICE_ID` | `desktop-dev-001` | Stable device id when client does not send `x-device-id` |
| `COMPANY_ID` | `1` | Tenant company fallback when JWT/context not set (non-dev) |
| `BRANCH_ID` | `1` | Branch fallback when JWT/context not set (non-dev) |
| `LOG_LEVEL` | `debug` (dev) / `info` (prod) | Winston minimum level |
| `LOG_DIR` | `%LOCALAPPDATA%/pharmacy-erp/logs` (Windows) | Rotating log files |

### Recommended production settings

```bash
NODE_ENV=production
JWT_SECRET=<long-random-secret>
DEVICE_ID=<per-machine-stable-id>
COMPANY_ID=1
BRANCH_ID=1
LOG_LEVEL=info
```

Never commit real `JWT_SECRET` values. Generate a cryptographically random string (32+ bytes).

### SMTP (forgot-password OTP email)

Configure in backend environment (not committed):

| Variable | Description |
|----------|-------------|
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | Port (default `587`) |
| `SMTP_SECURE` | `true` for TLS on port 465 |
| `SMTP_USER` | Auth username (optional) |
| `SMTP_PASS` | Auth password (optional) |
| `SMTP_FROM` | From address (required with host) |

Forgot-password OTP is sent only when both `SMTP_HOST` and `SMTP_FROM` are set.

---

## Authentication configuration

Code: `backend/src/auth/constants/auth.constants.ts`

| Setting | Value | Notes |
|---------|-------|-------|
| Access token TTL | `15m` | JWT `expiresIn` |
| Refresh token TTL | `7 days` | `UserSession.expiresAt` |
| Max failed logins | `5` | Before lockout |
| Lockout duration | `15 minutes` | `User.lockedUntil` |
| Password hashing | bcrypt (10 rounds) | `PasswordService` |

### API endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/login` | Public | Username/password → access + refresh tokens |
| `POST` | `/auth/refresh` | Public | Refresh token → new tokens |
| `POST` | `/auth/forgot-password/request` | Public | Username → email OTP (generic response) |
| `POST` | `/auth/forgot-password/confirm` | Public | Username + OTP + new password |
| `POST` | `/auth/change-required-password` | Public | For `mustChangePassword` accounts |
| `POST` | `/auth/change-required-pin` | Public | For `mustChangePin` (PIN login blocked) |
| `POST` | `/auth/change-pin` | JWT | Authenticated PIN change |
| `POST` | `/auth/login-with-pin` | Public | Username + 6-digit PIN |
| `POST` | `/auth/logout` | JWT | Deactivates session |
| `GET` | `/auth/me` | JWT | Current user profile (includes `mustChangePin`) |

Login body may include optional `branchId` (bigint). If omitted, head-office branch is used.

### JWT claims

`sub` (userId), `sessionId`, `companyId`, `branchId`, `roles[]`, `permissions[]`.

Permissions use format `MODULE:RESOURCE:ACTION` (e.g. `SALES:SALES_INVOICE:CREATE`), matching `Permission` rows in the database.

### Guards and decorators

- `@Public()` — skip JWT on login/refresh routes
- `@RequirePermissions('MODULE:RESOURCE:ACTION')` — RBAC on controller/handler
- Global `JwtAuthGuard` + `PermissionsGuard` registered in `AppModule`

### Auth error codes

`AUTH_INVALID_CREDENTIALS`, `AUTH_ACCOUNT_LOCKED`, `AUTH_SESSION_EXPIRED`, `AUTH_PERMISSION_DENIED`

---

## Request context and tenant scoping

`CorrelationMiddleware` opens `RequestContextService` for every HTTP request.

**Production:** `companyId`, `branchId`, and `userId` come from the JWT via `ContextEnrichInterceptor` after `JwtAuthGuard`. Do not trust client `x-company-id` / `x-branch-id` / `x-user-id` headers.

**Development** (`NODE_ENV !== 'production'`): those headers may override tenant/user for integration tests and manual API exploration.

Always sent by the Angular client:

| Header | Source |
|--------|--------|
| `Authorization` | `Bearer <accessToken>` |
| `x-device-id` | Electron `getDeviceInfo()` or dev fallback |
| `x-correlation-id` | Optional; server generates if missing |

Branch scoping helper: `backend/src/persistence/context/tenant-scope.util.ts`

- `getTenantScope(requestContext)` → `{ companyId, branchId }`
- `withBranchScope(scope, where)` / `withCompanyScope(scope, where)` for Prisma queries

---

## Security hardening

`backend/src/main.ts`:

- `helmet()` — standard HTTP security headers
- CORS origin: `http://localhost:4200` (Angular dev / Electron renderer)
- Global `ValidationPipe` (`whitelist`, `transform`, `forbidNonWhitelisted`)

Electron: `contextIsolation: true`, `nodeIntegration: false`, preload exposes only `electronAPI`.

---

## Configuration-driven settings (`AppSetting`)

Handbook §20 — do not hardcode GST, templates, printers, etc. Read via `SettingsService`.

Code: `backend/src/settings/`

| API | Permission |
|-----|------------|
| `GET /settings?category=` | `CONFIGURATION:APP_SETTING:READ` |
| `GET /settings/:key` | `CONFIGURATION:APP_SETTING:READ` |
| `POST /settings` | `CONFIGURATION:APP_SETTING:CREATE` |
| `PUT /settings/:key` | `CONFIGURATION:APP_SETTING:UPDATE` — body requires `{ version, settingValue }` |
| `DELETE /settings/:key?version=` | `CONFIGURATION:APP_SETTING:DELETE` |

Resolution order: **branch-scoped row** → **company-wide row** (`branchId` null) → error or caller default.

Typed getters: `getString`, `getNumber`, `getBoolean`, `getJson` (driven by `dataType`). Short-lived in-memory cache (60s); invalidated on update.

### Canonical setting keys (code constants)

Defined in `backend/src/settings/setting-keys.constants.ts` — use these in feature code instead of string literals:

| Constant | Key | Typical use |
|----------|-----|-------------|
| `SettingKey.GST_DEFAULT_RATE` | `gst.default_rate` | Default GST % |
| `SettingKey.INVOICE_TEMPLATE_ID` | `invoice.template_id` | Receipt/A4 template |
| `SettingKey.BARCODE_FORMAT` | `barcode.format` | Barcode generation |
| `SettingKey.PRINTER_RECEIPT_MAPPING` | `printer.receipt_mapping` | Printer routing JSON |
| `SettingKey.STORE_DISPLAY_NAME` | `store.display_name` | UI / receipt header |

Add new keys to this file when introducing features that need config.

### Seeded settings (demo database)

From `backend/seed/data/configuration/app-setting.json`:

| Key | Default | Category | Editable | Notes |
|-----|---------|----------|----------|-------|
| `DEFAULT_CURRENCY` | `INR` | GENERAL | No | Company-wide |
| `DEFAULT_TAX_INCLUSIVE` | `false` | SALES | Yes | Tax-inclusive pricing |
| `FEFO_ENABLED` | `true` | INVENTORY | Yes | Batch selection |
| `SYNC_INTERVAL_MINUTES` | `15` | SYNC | Yes | Background sync interval |
| `BRANCH_RECEIPT_PREFIX` | `RCP-PUNE` / `RCP-MUM` | SALES | Yes | Per-branch |
| `LOYALTY_POINTS_RATIO` | `1` | LOYALTY | Yes | Points per rupee |
| `PRESCRIPTION_MANDATORY_SCHEDULE_H` | `true` | SALES | No | Schedule H Rx rule |
| `NEAR_EXPIRY_DAYS` | `90` | INVENTORY | Yes | Expiry alert window |
| `DEFAULT_PAYMENT_MODE` | `CASH` | SALES | Yes | Billing default |

Table spec: [AppSetting](../database/tables/configuration/configuration.md#appsetting)

### Recommended approach for new features

1. Add row to seed `app-setting.json` (or migration) with `dataType`, `category`, `defaultValue`.
2. Add constant to `SettingKey` if the feature will read it often.
3. Read via `SettingsService.getNumber(SettingKey.GST_DEFAULT_RATE)` inside services — never hardcode in components.
4. Audit changes via `AuditService` when exposing settings in admin UI.

---

## Angular client layer

Code: `src/app/core/`

When editing frontend code, follow [01-coding-principles.mdc](../../../.cursor/rules/01-coding-principles.mdc) and [angular-rules.mdc](../../../.cursor/rules/angular-rules.mdc).

| Piece | Role |
|-------|------|
| `ApiService` | HTTP to `http://localhost:3000`, unwraps `{ success, data }` envelope |
| `AuthService` | Login/logout/refresh, `currentUser` signal |
| `TokenStorageService` | Electron `secureStore` or in-memory (ng serve) |
| `DeviceService` | Stable `deviceId` for headers |
| `authInterceptor` | Attaches Bearer + `x-device-id` |
| `refreshInterceptor` | On 401, attempts token refresh once then retries the request |
| `errorInterceptor` | Toastr errors; 401 → clear session → `/login` |
| `authGuard` | Protects routes; attempts refresh before login redirect |
| `KeyboardShortcutService` | Global shortcuts, remapping, F1/? help overlay |
| `ActiveScreenSaveService` | Active detail/counter `Ctrl+S` handler |
| `ActiveScreenSearchService` | Active list `Ctrl+F` → grid search focus |
| `ActiveScreenPrintService` | Active screen `Ctrl+P` print hook |

i18n: `@ngx-translate/core` v18, `public/i18n/en.json`, default locale `en-IN`.

Public routes: `/login`, `/forgot-password`, `/change-required-pin`, `/change-required-password`. Guarded app routes load under main layout (e.g. `/dashboard`).

---

## Reporting API

Implemented read-only reporting with JWT auth (same as other endpoints).

| Endpoint | Purpose |
|----------|---------|
| `GET /reports` | List reports the user may run (`REPORT_VIEW`) |
| `GET /reports/:reportId` | Run report; query `format=json\|csv\|xlsx\|pdf` |

Use the admin demo user for party reports (`REPORT_VIEW` + `REPORT_PARTY_VIEW`). Full API examples, permissions, and extension guide: [Reporting](./reporting.md).

---

## Electron IPC

`electron/preload.js` exposes `window.electronAPI`:

| API | Description |
|-----|-------------|
| `getDeviceInfo()` | `{ deviceId, appVersion, operatingSystem }` |
| `secureStore.get/set/delete(key)` | Token storage via `safeStorage` when available |

Set `DEVICE_ID` in the environment before launch for a stable id across restarts.

**Follow-up (not implemented):** packaged app process manager — who starts Nest and on which port.

---

## Outbox sync contract

Code: `backend/src/persistence/outbox/`

- `entity-type.constants.ts` — canonical entity type strings
- `outbox-payload.types.ts` — `OutboxPayloadEnvelope` with `entityVersion` for conflict detection

Every enqueue should include entity `version` in the payload envelope. Worker/sync drain is deferred.

---

## Keyboard shortcuts

Registry: `src/app/core/keyboard/` (`KeyboardShortcutService`). Help UI: `src/app/shared/components/keyboard-shortcuts/`. Tooltips: `appShortcutTooltip` in `src/app/shared/keyboard/`.

List screens use `bindListScreenShortcuts`; detail screens use `bindDetailScreenShortcuts` (see `src/app/core/keyboard/README.md`). Shell delegates `Ctrl+S`, `Ctrl+F`, and `Ctrl+P` through the active-screen services.

| Key | Default action |
|-----|----------------|
| Ctrl+F | Focus grid search on the active list |
| Ctrl+N | New record (list screens) |
| Ctrl+S | Save (active detail/counter via `ActiveScreenSaveService`) |
| Ctrl+D | Delete (active detail) |
| Ctrl+P | Print (when the screen registers a handler) |
| F5 | Refresh list |
| F2 | Medicine lookup (shell); **sales.new** on sales list/counter when registered |
| F4 | History / lookup (shell) |
| F8 | Payments (counter) |
| Esc | Cancel / close help |
| F1 / ? | Toggle shortcut help overlay |

Toolbar buttons may set `shortcutId`; `app-toolbar` shows inline `<kbd>` labels and hover tooltips. Overrides persist in `localStorage` (`app-keyboard-shortcuts:overrides`).

---

## Tests

See [Testing](./testing.md) for the full command reference (unit, persistence, e2e, Angular, single-file, feature filters).

| Suite | Command |
|-------|---------|
| Auth/settings unit | `cd backend && npm run test -- --testPathPatterns=auth` |
| Party unit | `cd backend && npm run test -- --testPathPatterns=party` |
| Reporting unit | `cd backend && npm run test -- --testPathPatterns=reporting` |
| Auth e2e | `cd backend && npm run test:e2e -- --testPathPatterns=auth.e2e-spec` |
| Party e2e | `cd backend && npm run test:e2e -- --testPathPatterns=party.e2e-spec` |
| Persistence | `cd backend && npm run test:persistence` |
| Angular core | `npm test -- --testPathPatterns=src/app/core` |

Single file examples:

```bash
cd backend && npm run test -- party/customer.service.spec.ts
cd backend && npm run test -- reporting/core/report-registry.service.spec.ts
npm test -- --testPathPatterns=auth.service.spec
```

E2e auth tests reset user password hashes to `admin123` in `beforeEach`.

---

## Related code paths

| Area | Path |
|------|------|
| Auth module | `backend/src/auth/` |
| Settings module | `backend/src/settings/` |
| Reporting module | `backend/src/reporting/` |
| Context enrich | `backend/src/common/interceptors/context-enrich.interceptor.ts` |
| Tenant scope | `backend/src/persistence/context/tenant-scope.util.ts` |
| Angular core | `src/app/core/` |
| Electron | `electron/main.js`, `electron/preload.js` |
| Cursor coding principles | `.cursor/rules/01-coding-principles.mdc` |
| Cursor Angular rules | `.cursor/rules/angular-rules.mdc` |
| Cursor persistence rules | `.cursor/rules/prisma-persistence-rules.mdc` (branch scoping section) |

## Related docs

- [Security](./security.md)
- [Reporting](./reporting.md)
- [Testing](./testing.md)
- [Logging and audit](./logging-and-audit.md)
- [Persistence patterns](../database/persistence-patterns.md)
- [AppSetting table](../database/tables/configuration/configuration.md#appsetting)
