# Backend testing

NestJS **unit** (Jest — not JUnit), **persistence integration**, **HTTP integration**, and **HTTP e2e** tests. Run commands from **`backend/`**.

**Angular (`src/`)** unit tests and **Playwright** UI smoke: [../TESTING.md](../TESTING.md)

---

## Quick reference — unit, integration, e2e

| Suite | Jest config | Command | Database |
|-------|-------------|---------|----------|
| **Unit** | `package.json` → `jest` | `npm run test` | None (mocks) |
| **Persistence integration** | `test/persistence/jest-persistence.json` | `npm run test:persistence` | `../db/pharmacy.test.sqlite` |
| **HTTP integration** | `test/integration/jest-integration.json` | `npm run test:integration` | Test DB + Supertest |
| **HTTP e2e** | `test/jest-e2e.json` | `npm run test:e2e` | Test DB + Supertest |

Before any row that uses the test DB:

```bash
npm run db:test:prepare
```

Filter one file or area (Jest 30):

```bash
npm run test -- auth/auth.service.spec.ts
npm run test:integration -- --testPathPatterns=purchase-invoice
npm run test:e2e -- --testPathPatterns=auth.e2e-spec
npm run test:persistence -- --testPathPatterns=stock-transfer-in-transit
```

Browser UI smoke (login, counter, GRN, month-end) is **not** in this folder — from repo root: `npm run test:e2e:ui` (see [../TESTING.md](../TESTING.md)).

---

## Prerequisites

```bash
cd backend
npm install
```

For DB-backed suites, ensure the test database exists (see below).

---

## Two databases

| File | Used for |
|------|----------|
| `../db/pharmacy.sqlite` | Local dev (`npm run start:dev`), `db:seed`, `db:reset` |
| `../db/pharmacy.test.sqlite` | Persistence, HTTP integration, and e2e tests |

Tests load the test DB via [`.env.test`](.env.test) (`DATABASE_URL=file:../db/pharmacy.test.sqlite`).

---

## Step 1 — Prepare the test database (DB suites only)

Required before **persistence**, **integration**, or **e2e** when the schema/seed changed or data is stale. **Not** needed for unit tests (`npm run test`).

```bash
npm run db:test:prepare
```

This deletes `pharmacy.test.sqlite`, runs `prisma db push`, then fresh seed.

If you see `EBUSY` on Windows, close other processes using the file (dev server, another Jest run), then retry.

---

## Step 2 — Unit tests (mocked, no DB)

Co-located specs: `src/**/*.spec.ts`

```bash
npm run test
npm run test:watch          # optional
npm run test:cov            # coverage; thresholds in package.json (phased by module)
```

Single file or area:

```bash
npm run test -- party/customer.service.spec.ts
npm run test -- --testPathPatterns=auth
```

---

## Step 3 — Persistence integration (SQLite)

`test/persistence/*.integration.spec.ts` — UnitOfWork, outbox, sequences, ledger, etc.

```bash
npm run test:persistence
npm run test:persistence -- --testPathPatterns=sequence-generator
```

Runs **`--runInBand`** (one worker) to reduce SQLite lock issues.

---

## Step 4 — HTTP integration (SQLite + Supertest)

`test/integration/*.integration.spec.ts` — per-module APIs, auth, envelopes.

```bash
npm run test:integration
npm run test:integration -- --testPathPatterns=purchase-order
npm run test:integration -- --testPathPatterns="financial-year|reports|sync-run"
```

Helpers: [`test/support/http-test.helpers.ts`](test/support/http-test.helpers.ts) (`createHttpTestApp`, `loginAs`, `loginAsAdmin`, `TEST_MARKER`).

Sync specs: set `SYNC_CLOUD_URL` (see [`test/support/cloud-sync-mock.ts`](test/support/cloud-sync-mock.ts) or `.env.test`).

---

## Step 5 — E2e HTTP flows (SQLite + Supertest)

`test/e2e/*.e2e-spec.ts` — auth, party, purchase/sales/month-end smokes, sync, app health.

```bash
npm run test:e2e
npm run test:e2e -- --testPathPatterns=auth.e2e-spec
```

---

## Typical workflow before a PR (backend)

```bash
npm run db:test:prepare
npm run lint
npm run build              # optional compile check
npm run test:cov           # unit + coverage gate
npm run test:persistence
npm run test:integration
npm run test:e2e
```

CI runs the same sequence (plus root `npm run test:ci` for Angular): [`.github/workflows/backend-tests.yml`](../.github/workflows/backend-tests.yml).

---

## Test matrix and scaffolding

Module-level tracking: [test/TEST_MATRIX.md](test/TEST_MATRIX.md).

```bash
npm run test:list-untested
npm run test:scaffold-specs -- src/party   # optional minimal specs for a module
```

---

## Layout

```
test/
  setup/test-env.setup.ts      # loads .env.test for DB suites
  setup/otplib.mock.ts         # Jest mapper for integration/e2e/persistence
  support/http-test.helpers.ts
  support/cloud-sync-mock.ts
  persistence/*.integration.spec.ts
  integration/*.integration.spec.ts
  e2e/*.e2e-spec.ts
```

---

## Writing HTTP tests

1. Use a unique marker string in remarks/codes and **delete matching rows in `beforeAll`** before creating new data.
2. Resolve seeded IDs with Prisma or `/auth/me` — do not hardcode seed IDs.
3. Assert the API envelope: `{ success, data, error }`.

---

## More detail

Full reference: [docs/pharmacy_erp_architecture_docs/architecture/testing.md](../docs/pharmacy_erp_architecture_docs/architecture/testing.md)
