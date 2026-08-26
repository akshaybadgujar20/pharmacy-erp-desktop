# Testing

How to run unit, integration, persistence, and end-to-end tests in **pharmacy-erp-desktop**. All commands assume dependencies are installed (`npm install` in repo root and `cd backend && npm install`).

**Canonical reference** for agents and developers. Cursor rule: `.cursor/rules/testing-rules.mdc`.

---

## Test suites overview

| Suite | Location | Config | Command (from `backend/`) | DB / network |
|-------|----------|--------|---------------------------|--------------|
| **Backend unit** | `backend/src/**/*.spec.ts` | `package.json` `jest` | `npm run test` | Mocked — no DB |
| **Persistence integration** | `backend/test/persistence/**/*.integration.spec.ts` | `test/persistence/jest-persistence.json` | `npm run test:persistence` | Seeded `db/pharmacy.sqlite` |
| **Backend e2e** | `backend/test/*.e2e-spec.ts` | `test/jest-e2e.json` | `npm run test:e2e` | Seeded SQLite + HTTP |
| **Angular unit** | `src/**/*.spec.ts` | `jest.config.ts` (repo root) | `npm test` (repo root) | jsdom — no backend |

Persistence and e2e tests share the SQLite file — run persistence with `--runInBand` (already set in `test:persistence` script).

### Before persistence / e2e tests

```bash
cd backend
npm run db:seed:fresh   # recommended: clean baseline before integration/e2e
# npm run db:seed       # append only if DB already matches schema and you need more rows
```

Seed modes: `db:seed:fresh` wipes and reseeds; `db:seed` appends; `--only <phase>` resumes from a phase. Details: [backend/seed/README.md](../../../backend/seed/README.md).

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

| Feature / area | Unit (`backend/`) | Persistence | E2e | Angular (root) |
|----------------|-------------------|-------------|-----|----------------|
| Auth | `npm run test -- --testPathPatterns=auth` | — | `npm run test:e2e -- --testPathPatterns=auth.e2e-spec` | `npm test -- --testPathPatterns=auth.service.spec` |
| Party | `npm run test -- --testPathPatterns=party` | — | `npm run test:e2e -- --testPathPatterns=party.e2e-spec` | — |
| Reporting | `npm run test -- --testPathPatterns=reporting` | — | — | — |
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
npm run lint
npm run test
npm run test:persistence
npm run test:e2e
```

### Before opening a PR (full stack touch)

```bash
npm test                    # Angular unit (repo root)
cd backend && npm run lint && npm run test && npm run test:persistence && npm run test:e2e
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

### Backend e2e (`backend/test/`)

| File | Area |
|------|------|
| `auth.e2e-spec.ts` | Auth HTTP API |
| `party.e2e-spec.ts` | Party HTTP API |
| `app.e2e-spec.ts` | App bootstrap |

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
