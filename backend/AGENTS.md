# Pharmacy ERP Backend — Agent Guide

NestJS 11 backend for the pharmacy ERP desktop app. Local SQLite database, Prisma ORM, transactional persistence layer.

## Stack

| Layer | Technology |
|-------|------------|
| Framework | NestJS 11 |
| Language | TypeScript 5.7 |
| ORM | Prisma 7 (`@prisma/adapter-better-sqlite3`) |
| Database | SQLite (`../db/pharmacy.sqlite`) |
| Validation | class-validator + class-transformer |
| Testing | Jest 30 |
| Lint / format | ESLint 9 + Prettier |

## Project layout

```
backend/
  src/
    common/           exceptions, interceptors, response types
    persistence/      UnitOfWork, Outbox, Sequence, InventoryLedger, RequestContext
    app.module.ts     root module
    main.ts           bootstrap + global ValidationPipe
  seed/               deterministic seed data + generators
  test/
    persistence/      integration tests (seeded SQLite)
  prisma.config.ts    Prisma configuration
```

## Commands

Run from `backend/`:

```bash
npm run start:dev        # dev server (port 3000)
npm run build            # compile
npm run lint             # ESLint with auto-fix
npm run format           # Prettier write
npm run test             # unit tests (src/**/*.spec.ts)
npm run test:watch       # unit watch mode
npm run test:cov         # unit coverage
npm run test:persistence # persistence integration (--runInBand)
npm run test:e2e         # HTTP e2e tests
npm run db:seed          # append seed (no wipe; adds demo data)
npm run db:seed:fresh    # wipe seed tables + full reseed
npm run db:seed -- --only sales   # resume from phase (see seed/README.md)
npm run db:reset         # force-reset schema + fresh seed
```

Feature / file examples (from `backend/`):

```bash
npm run test -- --testPathPatterns=reporting
npm run test -- party/customer.service.spec.ts
npm run test:persistence -- --testPathPatterns=sequence-generator
npm run test:e2e -- --testPathPatterns=auth.e2e-spec
```

Full guide: [testing.md](../docs/pharmacy_erp_architecture_docs/architecture/testing.md).

## Key conventions

### Error handling

Business errors use `ApplicationException` with codes from `ErrorCode`:

```typescript
throw new ApplicationException(
  ErrorCode.STOCK_INSUFFICIENT,
  'Insufficient stock',
  HttpStatus.CONFLICT,
  { batchId },
);
```

`GlobalExceptionFilter` maps these to `{ success: false, error: { code, message, details } }`.

### Response envelope

`ResponseInterceptor` wraps successful responses as `{ success: true, data: … }`. Controllers return raw data — do not build the envelope manually.

### Persistence

Multi-write flows use `UnitOfWorkService.run(tx => …)` with `RequestContextService.run()` for tenant/device context. Key services:

- `SequenceGeneratorService` — document numbers
- `OutboxService` — sync event enqueue (same transaction)
- `InventoryLedgerService` — stock movements

See [persistence-patterns.md](../docs/pharmacy_erp_architecture_docs/database/persistence-patterns.md).

### Reporting

Read-only reports use `PrismaService` directly (no UnitOfWork). Domain modules register `ReportDefinition`s into `ReportRegistryService` at startup.

- Endpoints: `GET /reports`, `GET /reports/:reportId`
- Export: `format=json|csv|xlsx|pdf`
- Guide: [reporting.md](../docs/pharmacy_erp_architecture_docs/architecture/reporting.md)

### Validation

Global `ValidationPipe` with `whitelist`, `transform`, `forbidNonWhitelisted`. All request DTOs use class-validator decorators.

### Logging and audit

- **Technical logs:** inject `AppLogger` (`src/common/logging/app-logger.service.ts`) for structured Winston logging
- **Business audit:** `AuditService.log(tx, …)` inside `UnitOfWorkService.run()` — same transaction as the mutation
- **Correlation:** HTTP requests get `correlationId` via `CorrelationMiddleware`; propagated to logs and `AuditLog`
- Full guide: [logging-and-audit.md](../docs/pharmacy_erp_architecture_docs/architecture/logging-and-audit.md)

## Cursor rules

Scoped rules in `.cursor/rules/` (repo root):

| Rule file | Scope |
|-----------|-------|
| `00-project-context.mdc` | Always applied — layout, commands, change policy |
| `typescript-rules.mdc` | `backend/**/*.ts` — formatting, naming, types |
| `nestjs-rules.mdc` | `backend/src/**/*.ts` — modules, DI, DTOs, errors |
| `prisma-persistence-rules.mdc` | `backend/src/persistence/**`, `backend/seed/**` |
| `testing-rules.mdc` | `backend/**/*.spec.ts`, `backend/test/**` |
| `inventory-module.mdc` | `backend/src/inventory/**` — see [module memory doc](../.cursor/rules/docs/inventory-module.md) |
| `purchase-module.mdc` | `backend/src/purchase/**` — see [module memory doc](../.cursor/rules/docs/purchase-module.md) |
| `finance-module.mdc` | `backend/src/finance/**` — see [module memory doc](../.cursor/rules/docs/finance-module.md) |
| `party-module.mdc` | `backend/src/party/**` — see [module memory doc](../.cursor/rules/docs/party-module.md) |
| `medicine-module.mdc` | `backend/src/medicine/**` — see [module memory doc](../.cursor/rules/docs/medicine-module.md) |
| `security-module.mdc` | `backend/src/security/**` — see [module memory doc](../.cursor/rules/docs/security-module.md); auth password flows in `backend/src/auth/` (`change-password`, `change-required-password`) |
| `sales-module.mdc` | `backend/src/sales/**` — see [module memory doc](../.cursor/rules/docs/sales-module.md) |
| `pricing-module.mdc` | `backend/src/pricing/**` — see [module memory doc](../.cursor/rules/docs/pricing-module.md) |
| `prescription-module.mdc` | `backend/src/prescription/**` — see [module memory doc](../.cursor/rules/docs/prescription-module.md) |
| `audit-module.mdc` | `backend/src/audit/**` — see [module memory doc](../.cursor/rules/docs/audit-module.md) |
| `configuration-module.mdc` | `backend/src/configuration/**` — see [module memory doc](../.cursor/rules/docs/configuration-module.md) |
| `sync-module.mdc` | `backend/src/sync/**` — see [module memory doc](../.cursor/rules/docs/sync-module.md) |
| `masters-module.mdc` | `backend/src/masters/**` — see [module memory doc](../.cursor/rules/docs/masters-module.md) |

## Module memory docs

Implementation-grounded agent references in [`.cursor/rules/docs/`](../.cursor/rules/docs/) (API catalog, file map, workflows). Currently: [inventory-module.md](../.cursor/rules/docs/inventory-module.md), [purchase-module.md](../.cursor/rules/docs/purchase-module.md), [finance-module.md](../.cursor/rules/docs/finance-module.md), [party-module.md](../.cursor/rules/docs/party-module.md), [medicine-module.md](../.cursor/rules/docs/medicine-module.md), [sales-module.md](../.cursor/rules/docs/sales-module.md), [security-module.md](../.cursor/rules/docs/security-module.md), [pricing-module.md](../.cursor/rules/docs/pricing-module.md), [prescription-module.md](../.cursor/rules/docs/prescription-module.md), [audit-module.md](../.cursor/rules/docs/audit-module.md), [configuration-module.md](../.cursor/rules/docs/configuration-module.md), [sync-module.md](../.cursor/rules/docs/sync-module.md), [masters-module.md](../.cursor/rules/docs/masters-module.md).

**Settings API note:** `PUT /settings/:key` requires `version` and `settingValue` in the body (optimistic locking). AppSetting create validates `branchId` belongs to JWT company.

## Architecture docs

- [Backend developer guide](../docs/pharmacy_erp_architecture_docs/architecture/backend-developer-guide.md) — onboarding, module wiring, non-trivial files, appendices (glossary, auth chain, troubleshooting), find-by-concern
- [Early foundations](../docs/pharmacy_erp_architecture_docs/architecture/early-foundations.md) — auth, env vars, settings, Angular/Electron layer
- [Extending the backend](../docs/pharmacy_erp_architecture_docs/architecture/extending-the-backend.md) — step-by-step guide for adding new feature modules
- [Testing](../docs/pharmacy_erp_architecture_docs/architecture/testing.md) — unit, persistence, e2e, feature/file commands
- [Reporting](../docs/pharmacy_erp_architecture_docs/architecture/reporting.md) — report registry, API, extension guide
- [Persistence patterns](../docs/pharmacy_erp_architecture_docs/database/persistence-patterns.md)
- [Logging and audit](../docs/pharmacy_erp_architecture_docs/architecture/logging-and-audit.md)
- [Database overview](../docs/pharmacy_erp_architecture_docs/database/database_overview.md)
- [Prisma/SQLite/Postgres alignment](../docs/pharmacy_erp_architecture_docs/database/prisma_sqlite_jpa_postgres_alignment.md)
- Table specs: `docs/pharmacy_erp_architecture_docs/database/tables/<category>/<category>.md`; Prisma models in `backend/prisma/schema.prisma`

## Before finishing

1. Run `npm run lint` on touched files
2. Run relevant tests (`npm run test` and/or `npm run test:persistence`)
3. Add new `ErrorCode` entries for new domain errors
4. Follow additive-only change policy — do not fix unrelated pre-existing issues
