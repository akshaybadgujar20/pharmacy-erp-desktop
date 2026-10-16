# Testing

How to run unit, integration, persistence, and end-to-end tests in **pharmacy-erp-desktop**. All commands assume dependencies are installed (`npm install` in repo root and `cd backend && npm install`).

**Canonical reference** for agents and developers. Cursor rule: `.cursor/rules/testing-rules.mdc`.

---

## Test suites overview

| Suite | Location | Config | Command (from `backend/`) | DB / network |
|-------|----------|--------|---------------------------|--------------|
| **Backend unit** | `backend/src/**/*.spec.ts` | `package.json` `jest` | `npm run test` | Mocked — no DB |
| **Persistence integration** | `backend/test/persistence/**/*.integration.spec.ts` | `test/persistence/jest-persistence.json` | `npm run test:persistence` | Seeded `db/pharmacy.test.sqlite` |
| **HTTP API integration** | `backend/test/integration/**/*.integration.spec.ts` | `test/integration/jest-integration.json` | `npm run test:integration` | Seeded `db/pharmacy.test.sqlite` + HTTP |
| **Backend e2e** | `backend/test/e2e/*.e2e-spec.ts` | `test/jest-e2e.json` | `npm run test:e2e` | Seeded `db/pharmacy.test.sqlite` + HTTP |
| **Angular unit** | `src/**/*.spec.ts` | `jest.config.ts` (repo root) | `npm test` (repo root) | jsdom — no backend |

Persistence, HTTP integration, and e2e use the **test database** (`db/pharmacy.test.sqlite`). Dev data stays in `db/pharmacy.sqlite`. All three DB-backed suites run with `--runInBand` where configured in `package.json`.

### Before persistence / integration / e2e tests

```bash
cd backend
npm run db:test:prepare   # delete test DB → schema push → seed:fresh into pharmacy.test.sqlite
```

Run `db:test:prepare` manually when the schema or seed changes, or when tests fail due to stale data. Day-to-day dev on `pharmacy.sqlite` still uses `npm run db:seed:fresh` / `db:seed`. Seed modes: [backend/seed/README.md](../../../backend/seed/README.md).

HTTP integration and e2e tests load `DATABASE_URL` from [backend/.env.test](../../../backend/.env.test) via `test/setup/test-env.setup.ts`. Shared helpers: `test/support/http-test.helpers.ts`.

---

## Backend — all suites

Run from `backend/`:

```bash
# Unit tests (all co-located specs under src/)
npm run test

# Watch mode (unit)
npm run test:watch

# Coverage (unit, output in backend/coverage/)
npm run test:cov

# Debug unit tests (Node inspector)
npm run test:debug

# Persistence integration (serial, seeded DB)
npm run test:persistence

# HTTP API integration (per-module APIs)
npm run test:integration

# HTTP e2e (auth, party, app smoke)
npm run test:e2e
```

### Lint and format (run before or with tests)

```bash
cd backend
npm run lint
npm run format
npm run build          # optional compile check
```

---

## Backend unit tests — by feature

Use `--testPathPatterns` (Jest 30) to filter by path or filename. Patterns are regex matched against full paths.

```bash
cd backend

# Auth
npm run test -- --testPathPatterns=auth

# Party (customers, suppliers, party service)
npm run test -- --testPathPatterns=party

# Reporting (registry, exporters, party reports provider)
npm run test -- --testPathPatterns=reporting

# Settings
npm run test -- --testPathPatterns=settings

# Audit
npm run test -- --testPathPatterns=audit

# Common (interceptors, exceptions, logging, pagination)
npm run test -- --testPathPatterns=src/common

# App smoke
npm run test -- --testPathPatterns=app.controller.spec
```

### Single file (unit)

Pass a path relative to `backend/src/` (Jest `rootDir`):

```bash
cd backend
npm run test -- reporting/core/report-registry.service.spec.ts
npm run test -- party/customer.service.spec.ts
npm run test -- auth/auth.service.spec.ts
```

Equivalent using `npx jest` from `backend/`:

```bash
npx jest reporting/core/report-registry.service.spec.ts
npx jest --watch party/customer.service.spec.ts
```

### Single test name

```bash
npm run test -- --testPathPatterns=customer.service.spec -t "CUSTOMER_NOT_FOUND"
```

---

## Persistence integration — by feature

```bash
cd backend
npm run test:persistence

# Single integration file (pattern match)
npm run test:persistence -- --testPathPatterns=sequence-generator
npm run test:persistence -- --testPathPatterns=outbox-in-transaction
npm run test:persistence -- --testPathPatterns=inventory-ledger
npm run test:persistence -- --testPathPatterns=atomic-workflow
npm run test:persistence -- --testPathPatterns=audit-service
```

Helpers: `backend/test/persistence/persistence-test.helpers.ts` (`createPersistenceTestContext`, `runWithTestContext`, `loadSeededBranch`). See [Persistence patterns](../database/persistence-patterns.md).

---

## HTTP API integration — by feature

```bash
cd backend

# All integration specs
npm run test:integration

# Purchase orders
npm run test:integration -- --testPathPatterns=purchase-order.integration

# Financial year guard, reports, sync push (set SYNC_CLOUD_URL in test env or use mock)
npm run test:integration -- --testPathPatterns="financial-year|reports|sync-run"
```

## Backend e2e — by feature

```bash
cd backend

# All e2e
npm run test:e2e

# Auth login / refresh / permissions
npm run test:e2e -- --testPathPatterns=auth.e2e-spec

# Party CRUD APIs
npm run test:e2e -- --testPathPatterns=party.e2e-spec

# App bootstrap smoke
npm run test:e2e -- --testPathPatterns=app.e2e-spec

# Sync push run (uses cloud-sync-mock when SYNC_CLOUD_URL points at it)
npm run test:e2e -- --testPathPatterns=sync-run.e2e-spec
```

Auth e2e resets user password hashes to `admin123` in `beforeEach`.

---

## Angular unit tests

Run from **repository root** (not `backend/`):

```bash
# All Angular unit tests
npm test

# Watch
npm run test:watch

# Coverage
npm run test:coverage

# CI (coverage + runInBand)
npm run test:ci

# Core services only
npm test -- --testPathPatterns=src/app/core

# Auth + API services
npm test -- --testPathPatterns="auth.service.spec|api.service.spec"

# Single file
npm test -- --testPathPatterns=auth.service.spec
```

Config: `jest.config.ts`, setup: `setup-jest.ts`, tests: `src/**/*.spec.ts`.

**Note:** Root `README.md` still mentions `ng test` (Karma). This project uses **Jest** for Angular unit tests via `npm test`.

---

## Quick reference — feature → command

| Feature / area | Unit (`backend/`) | Persistence | Integration | E2e | Angular (root) |
|----------------|-------------------|-------------|-------------|-----|----------------|
| Auth | `npm run test -- --testPathPatterns=auth` | — | — | `npm run test:e2e -- --testPathPatterns=auth.e2e-spec` | `npm test -- --testPathPatterns=auth.service.spec` |
| Party | `npm run test -- --testPathPatterns=party` | — | — | `npm run test:e2e -- --testPathPatterns=party.e2e-spec` | — |
| Purchase | `npm run test -- --testPathPatterns=purchase` | — | `npm run test:integration -- --testPathPatterns=purchase-order` | — | — |
| Reporting | `npm run test -- --testPathPatterns=reporting` | — | `npm run test:integration -- --testPathPatterns=reports.integration` | — | — |
| Financial year | — | — | `npm run test:integration -- --testPathPatterns=financial-year` | — | — |
| Sync push | — | — | `npm run test:integration -- --testPathPatterns=sync-run` | `npm run test:e2e -- --testPathPatterns=sync-run` | — |
| Settings | `npm run test -- --testPathPatterns=settings` | — | — | — |
| Persistence layer | — | `npm run test:persistence` | — | — |
| Sequence | — | `npm run test:persistence -- --testPathPatterns=sequence-generator` | — | — |
| Outbox | — | `npm run test:persistence -- --testPathPatterns=outbox` | — | — |
| Inventory ledger | — | `npm run test:persistence -- --testPathPatterns=inventory-ledger` | — | — |
| API client | — | — | — | `npm test -- --testPathPatterns=api.service.spec` |

---

## Recommended workflows

### After changing a backend service

```bash
cd backend
npm run lint
npm run test -- --testPathPatterns=<feature-or-file>
```

### After changing persistence / UnitOfWork / Outbox / Sequence / InventoryLedger

```bash
cd backend
npm run test:persistence
```

### Before opening a PR (backend)

```bash
cd backend
npm run db:test:prepare
npm run lint
npm run test
npm run test:persistence
npm run test:integration
npm run test:e2e
```

### Before opening a PR (full stack touch)

```bash
npm test                    # Angular unit (repo root)
cd backend && npm run db:test:prepare && npm run lint && npm run test && npm run test:persistence && npm run test:integration && npm run test:e2e
```

---

## Test file index

### Backend unit (`backend/src/`)

| File | Area |
|------|------|
| `auth/auth.service.spec.ts` | Login, refresh, JWT |
| `auth/guards/permissions.guard.spec.ts` | `@RequirePermissions` |
| `party/customer.service.spec.ts` | Customer CRUD |
| `party/party.service.spec.ts` | Party CRUD |
| `reporting/core/report-registry.service.spec.ts` | Report registry |
| `reporting/export/report-exporter.service.spec.ts` | CSV/XLSX/PDF export |
| `reporting/providers/party/party-reports.provider.spec.ts` | Party reports |
| `settings/settings.service.spec.ts` | App settings |
| `audit/audit.service.spec.ts` | Audit log writes |
| `common/**/*.spec.ts` | Interceptors, filters, logging, pagination |
| `app.controller.spec.ts` | App health |

### Persistence integration (`backend/test/persistence/`)

| File | Area |
|------|------|
| `sequence-generator.integration.spec.ts` | Document numbers |
| `outbox-in-transaction.integration.spec.ts` | Outbox + transaction |
| `inventory-ledger.integration.spec.ts` | Stock movements |
| `atomic-workflow.integration.spec.ts` | Multi-step transactional flow |
| `audit-service.integration.spec.ts` | Audit in transaction |

### HTTP API integration (`backend/test/integration/`)

| File | Area |
|------|------|
| `purchase-order.integration.spec.ts` | Purchase order HTTP API |
| `financial-year.integration.spec.ts` | Closed FY blocks purchase order create |
| `reports.integration.spec.ts` | Transactional report smoke runs |
| `sync-run.integration.spec.ts` | Push outbox to mock cloud (`test/support/cloud-sync-mock.ts`) |

### Backend e2e (`backend/test/e2e/`)

| File | Area |
|------|------|
| `auth.e2e-spec.ts` | Auth HTTP API |
| `party.e2e-spec.ts` | Party HTTP API |
| `app.e2e-spec.ts` | App bootstrap |
| `sync-run.e2e-spec.ts` | `POST /sync/runs` with mock cloud |

### Angular unit (`src/`)

| File | Area |
|------|------|
| `app/core/services/api.service.spec.ts` | HTTP envelope |
| `app/core/services/auth.service.spec.ts` | Client auth |
| `app/app.component.spec.ts` | Root component |
| `app/components/dashboard/dashboard.component.spec.ts` | Dashboard |
| `app/components/grid/grid.component.spec.ts` | Grid |

---

## Related

- [Persistence patterns](../database/persistence-patterns.md) — integration test helpers
- [Early foundations](./early-foundations.md) — demo login for manual API testing
- [Engineering standards](./engineering-standards.md) — quality expectations
- [Reporting](./reporting.md) — reporting-specific test command
- Backend agent guide: `backend/AGENTS.md`
