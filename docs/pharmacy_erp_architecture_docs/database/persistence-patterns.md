# Persistence patterns (NestJS + Prisma)

This document describes the shared persistence foundation used by the NestJS backend against the local SQLite database (`../db/pharmacy.sqlite`).

## Module layout

| Component | Location | Role |
|-----------|----------|------|
| `PersistenceModule` | `src/persistence/persistence.module.ts` | Wires services; import in feature modules |
| `PrismaModule` | `src/prisma.module.ts` | `PrismaService` lifecycle |
| `UnitOfWorkService` | `src/persistence/unit-of-work/` | `$transaction` boundary + error mapping |
| `RequestContextService` | `src/persistence/context/` | AsyncLocalStorage for tenant + device |
| `SequenceGeneratorService` | `src/persistence/sequence/` | Branch-scoped document numbers |
| `OutboxService` | `src/persistence/outbox/` | Transactional outbox enqueue |
| `InventoryLedgerService` | `src/persistence/inventory/` | Stock + movement ledger |

## Request context

Every business transaction should run inside `RequestContextService.run()` so downstream services can read:

- `companyId`, `branchId`, optional `userId`
- `deviceId` (required for outbox ordering)

Outbox `sequenceNo` is allocated per `deviceId` inside the same DB transaction as the business write.

## Unit of work

Use `UnitOfWorkService.run()` instead of calling `prisma.$transaction()` directly:

- Maps Prisma errors to `ApplicationException` (`prisma-error.mapper.ts`)
- Retries once on optimistic conflicts (`P2034`, `SEQUENCE_CONFLICT`)

## Document sequences

`SequenceGeneratorService.next(tx, { companyId, branchId, documentType, branchCode? })`:

- Loads the active `SequenceGenerator` row for the branch + document type
- Applies reset policy (`NEVER`, `YEARLY`, `MONTHLY`) using `updatedAt` vs current period
- Updates `currentNumber` with optimistic lock on `version`
- Returns `{ sequenceValue, documentNumber }` using `formatDocumentNumber()`

## Inventory ledger

`InventoryLedgerService.applyMovement(tx, …)`:

- Allocates `STOCK_MOVEMENT` document number via sequence service
- Upserts `Stock` for `(branchId, batchId)`
- Guards negative stock on `OUT` (`STOCK_INSUFFICIENT`)
- Inserts immutable `StockMovement` with `balanceAfter`

## Outbox

`OutboxService.enqueue(tx, { entityType, entityUuid, operation, payload, … })` writes a row in the same transaction as the business mutation. Sync uses `entityUuid` and idempotent `operationId`.

## BIGINT primary keys

SQLite schemas omit autoincrement for some tables. `createPrismaClient()` extends Prisma `create` to assign BIGINT ids via `nextBigIntId()` when `id` is omitted.

## Integration tests

Persistence integration tests use the seeded SQLite file and run with:

```bash
npm run test:persistence
```

See `test/persistence/` for examples (`runWithTestContext`, `deviceId: test-device-001`).

## Related docs

- [prisma_sqlite_jpa_postgres_alignment.md](./prisma_sqlite_jpa_postgres_alignment.md)
- [database_overview.md](./database_overview.md)
- Outbox table: `tables/synchronization/55_outbox.md`
- Sequence table: `tables/configuration/63_sequence_generator.md`
