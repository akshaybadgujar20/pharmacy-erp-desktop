# Frontend testing (`src/`)

Angular unit tests live next to components and services under **`src/app/**/*.spec.ts`**. They use **Jest** (not Karma or JUnit) with **jsdom** — no backend process and no SQLite.

**Backend** (NestJS unit, integration, HTTP e2e): [backend/TESTING.md](backend/TESTING.md)  
**Full matrix** (all suites + CI): [docs/pharmacy_erp_architecture_docs/architecture/testing.md](docs/pharmacy_erp_architecture_docs/architecture/testing.md)

---

## Test types — where to run what

This repo does **not** use Java JUnit. **Unit** tests on both stacks are **Jest** (`*.spec.ts`). **Integration** and **e2e** are backend-only unless noted.

| What | Where | Working directory | Command | Needs test DB? |
|------|--------|-------------------|---------|----------------|
| **Angular unit** | `src/**/*.spec.ts` | repo root | `npm test` / `npm run test:ci` | No |
| **Backend unit** | `backend/src/**/*.spec.ts` | `backend/` | `npm run test` | No |
| **Persistence integration** | `backend/test/persistence/` | `backend/` | `npm run test:persistence` | Yes — `npm run db:test:prepare` first |
| **HTTP integration** | `backend/test/integration/` | `backend/` | `npm run test:integration` | Yes — prepare first |
| **HTTP e2e** | `backend/test/e2e/` | `backend/` | `npm run test:e2e` | Yes — prepare first |
| **UI e2e (browser)** | `e2e/smoke.spec.ts` | repo root | `npm run test:e2e:ui` | Yes — prepare + Playwright starts API + Angular |

Prepare the test database once (or after schema/seed changes):

```bash
cd backend
npm run db:test:prepare
```

Full backend steps: [backend/TESTING.md](backend/TESTING.md).

---

## Prerequisites

From the **repository root**:

```bash
npm install
```

---

## Commands (run from repo root)

| Command | Purpose |
|---------|---------|
| `npm test` | Run all `src/**/*.spec.ts` once |
| `npm run test:watch` | Watch mode |
| `npm run test:coverage` | Coverage report (local) |
| `npm run test:ci` | CI-style: coverage + `--runInBand` (same as GitHub Actions) |

Config: [`jest.config.ts`](jest.config.ts)  
Setup: [`setup-jest.ts`](setup-jest.ts)

---

## Typical workflow before a PR

```bash
npm test
# or, to match CI:
npm run test:ci
```

Optional lint (if you use the root ESLint setup for the app):

```bash
npm run lint
```

---

## Run one area or file

Use `--testPathPatterns` (Jest 30). Patterns match the full path.

```bash
# Single spec file
npm test -- --testPathPatterns=auth.service.spec

# Feature folder
npm test -- --testPathPatterns=src/app/features/party

# Core services
npm test -- --testPathPatterns=src/app/core

# Several patterns (regex)
npm test -- --testPathPatterns="mfa-enroll|masters-import"
```

---

## Writing specs

- Mock **`ApiService`** or use **`HttpClientTestingModule`** for HTTP; assert envelope handling the same way the app does in production.
- For standalone components, prefer **`compileComponents()`** (not `compile()`), stub heavy child components with **`overrideComponent`**, and mock services injected in `ngOnInit` (keyboard shortcuts, Electron barcode, active-screen save, etc.).
- List/grid screens: follow existing patterns (e.g. `customer-list.component.spec.ts`, `purchase-order-list.component.spec.ts`) — stub `app-toolbar` / `app-grid` and mock the feature service.

---

## Browser smoke (Playwright)

Playwright targets the **Angular dev server** at `http://localhost:4200` with the Nest API at `http://localhost:3000`. Config: [`playwright.config.ts`](playwright.config.ts). Specs: [`e2e/smoke.spec.ts`](e2e/smoke.spec.ts).

Prerequisites: prepared SQLite test DB (same as backend integration tests) when running in CI — see [backend/TESTING.md](backend/TESTING.md) `db:test:prepare`.

| Command | Purpose |
|---------|---------|
| `npm run test:e2e:ui` | Login, counter, GRN wizard, month-end, sync smoke |

Environment (optional):

| Variable | Default |
|----------|---------|
| `E2E_USERNAME` | `admin` |
| `E2E_PASSWORD` | `admin123` |
| `PLAYWRIGHT_BASE_URL` | `http://127.0.0.1:4200` |
| `PLAYWRIGHT_API_URL` | `http://127.0.0.1:3000` |

First-time local run: `npx playwright install chromium`

---

## Full-stack reference

Architecture doc (backend + frontend + CI): [docs/pharmacy_erp_architecture_docs/architecture/testing.md](docs/pharmacy_erp_architecture_docs/architecture/testing.md)
