# Backend testing (quick guide)

Run all commands from `backend/`.

## Two databases

| File | Used for |
|------|----------|
| `../db/pharmacy.sqlite` | Local dev (`npm run start:dev`), `db:seed`, `db:reset` |
| `../db/pharmacy.test.sqlite` | Persistence, HTTP integration, and e2e tests |

Tests load the test DB via [`.env.test`](.env.test) (`DATABASE_URL=file:../db/pharmacy.test.sqlite`).

## Prepare the test database

Run this **manually** when the Prisma schema or seed changes, or when DB-backed tests fail due to stale data:

```bash
npm run db:test:prepare
```

This deletes `pharmacy.test.sqlite`, runs `prisma db push`, then `seed --fresh`.

## Test suites

| Command | What it runs |
|---------|----------------|
| `npm run test` | Unit tests (`src/**/*.spec.ts`), mocked — no DB |
| `npm run test:persistence` | UnitOfWork, outbox, sequences, ledger (`test/persistence/`) |
| `npm run test:integration` | Per-module HTTP APIs (`test/integration/`) |
| `npm run test:e2e` | Cross-cutting HTTP flows (`test/e2e/`) |

Persistence, integration, and e2e run **serially** (`--runInBand`) to avoid SQLite lock issues.

### Typical workflow before a PR

```bash
npm run db:test:prepare
npm run lint
npm run test
npm run test:persistence
npm run test:integration
npm run test:e2e
```

### Run one file or area

```bash
npm run test -- party/customer.service.spec.ts
npm run test:persistence -- --testPathPatterns=sequence-generator
npm run test:integration -- --testPathPatterns=purchase-order
npm run test:e2e -- --testPathPatterns=auth.e2e-spec
npm run test:integration -- --testPathPatterns="financial-year|reports|sync-run"
```

Sync integration/e2e specs expect `SYNC_CLOUD_URL` (see `test/support/cloud-sync-mock.ts` or `.env.test`).

## Layout

```
test/
  setup/test-env.setup.ts      # loads .env.test for DB suites
  support/http-test.helpers.ts # createHttpTestApp, loginAs, etc.
  support/cloud-sync-mock.ts   # minimal HTTP server for SYNC_CLOUD_URL in sync tests
  persistence/*.integration.spec.ts
  integration/*.integration.spec.ts
  e2e/*.e2e-spec.ts
```

HTTP integration and e2e specs should use the shared helpers instead of duplicating `ValidationPipe` and login boilerplate.

## Writing HTTP tests

1. Use a unique marker string in remarks/codes and **delete matching rows in `beforeAll`** before creating new data.
2. Resolve seeded IDs with Prisma or `/auth/me` — do not hardcode seed IDs.
3. Assert the API envelope: `{ success, data, error }`.

## More detail

Full reference: [docs/pharmacy_erp_architecture_docs/architecture/testing.md](../docs/pharmacy_erp_architecture_docs/architecture/testing.md).
