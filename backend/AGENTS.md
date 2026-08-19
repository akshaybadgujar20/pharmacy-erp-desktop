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
npm run test             # unit tests
npm run test:persistence # persistence integration tests (--runInBand)
npm run test:e2e         # end-to-end tests
npm run db:seed          # seed database
npm run db:seed:fresh    # wipe + seed
npm run db:reset         # force-reset schema + fresh seed
```

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

### Validation

Global `ValidationPipe` with `whitelist`, `transform`, `forbidNonWhitelisted`. All request DTOs use class-validator decorators.

## Cursor rules

Scoped rules in `.cursor/rules/` (repo root):

| Rule file | Scope |
|-----------|-------|
| `00-project-context.mdc` | Always applied — layout, commands, change policy |
| `typescript-rules.mdc` | `backend/**/*.ts` — formatting, naming, types |
| `nestjs-rules.mdc` | `backend/src/**/*.ts` — modules, DI, DTOs, errors |
| `prisma-persistence-rules.mdc` | `backend/src/persistence/**`, `backend/seed/**` |
| `testing-rules.mdc` | `backend/**/*.spec.ts`, `backend/test/**` |

## Architecture docs

- [Persistence patterns](../docs/pharmacy_erp_architecture_docs/database/persistence-patterns.md)
- [Database overview](../docs/pharmacy_erp_architecture_docs/database/database_overview.md)
- [Prisma/SQLite/Postgres alignment](../docs/pharmacy_erp_architecture_docs/database/prisma_sqlite_jpa_postgres_alignment.md)
- Table specs: `docs/pharmacy_erp_architecture_docs/database/tables/`

## Before finishing

1. Run `npm run lint` on touched files
2. Run relevant tests (`npm run test` and/or `npm run test:persistence`)
3. Add new `ErrorCode` entries for new domain errors
4. Follow additive-only change policy — do not fix unrelated pre-existing issues
