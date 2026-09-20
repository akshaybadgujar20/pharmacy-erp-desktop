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
| `LedgerPostingService` | `src/persistence/ledger/` | Double-entry voucher posting and reversal |

## Request context

Every business transaction should run inside `RequestContextService.run()` so downstream services can read:

- `companyId`, `branchId`, optional `userId`
- `deviceId` (required for outbox ordering)

Outbox `sequenceNo` is allocated per `deviceId` inside the same DB transaction as the business write.

### Tenant scope helpers

`src/persistence/context/tenant-scope.util.ts` provides consistent Prisma `where` scoping:

| Function | Purpose |
|----------|---------|
| `getTenantScope(requestContext)` | Returns `{ companyId, branchId }` from JWT-enriched context |
| `withBranchScope(scope, where)` | Merges `branchId` into a Prisma `where` clause |
| `withCompanyScope(scope, where)` | Merges `companyId` into a Prisma `where` clause |
| `isUserContextPopulated(ctx)` | True when `userId` is set (post-auth) |

Branch-scoped modules (purchase, sales, inventory stock ops, prescription, finance payments) use these helpers on list/get and inside `unitOfWork.run()` writes. Org-global modules (party, medicine, masters, security) omit branch filters.

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

**Consumers:** `goods-receipt` (accept), `purchase-return` (approve), `sales-invoice` (post), `sales-return` (approve), `stock-adjustment` (approve), `stock-transfer` (dispatch/receive), `stock-take` (reconcile).

## Ledger posting

`LedgerPostingService` (`src/persistence/ledger/ledger-posting.service.ts`) posts balanced double-entry vouchers:

- `postVoucher(tx, PostVoucherInput)` — validates debits = credits, ledger active status, open financial year
- `reverseVoucher(tx, ReverseVoucherInput)` — creates reversal entries for cancel flows

**Consumers:** `purchase-invoice` (post/cancel), `sales-invoice`, `sales-payment`, `sales-return`, `payment`, `receipt`.

Ledger balance is never stored on `Ledger` — derived from immutable `LedgerEntry` rows.

## Outbox

`OutboxService.enqueue(tx, { entityType, entityUuid, operation, payload, … })` writes a row in the same transaction as the business mutation. Sync uses `entityUuid` and idempotent `operationId`.

## BIGINT primary keys

SQLite schemas omit autoincrement for some tables. `createPrismaClient()` extends Prisma `create` / `createMany` to assign BIGINT ids from the **`IdSequence`** table (one row per Prisma model name) when `id` is omitted. Each `create` runs one atomic DB increment for that model; `createMany` increments by row count in one update. When `create` runs inside an open `$transaction` (for example `UnitOfWorkService.run`), IdSequence updates use that same transaction via AsyncLocalStorage so SQLite does not attempt a nested transaction. `PrismaService.onModuleInit` calls `bootstrapIdSequence()` to ensure counter rows exist and each `currentValue` is at least `MAX(id)` for that table.

## Integration tests

Persistence integration tests use the seeded SQLite file and run with:

```bash
cd backend
npm run db:seed:fresh   # wipe + reseed (recommended before integration tests)
npm run test:persistence
```

Filter by integration file:

```bash
npm run test:persistence -- --testPathPatterns=sequence-generator
npm run test:persistence -- --testPathPatterns=outbox-in-transaction
```

See `test/persistence/` for examples (`runWithTestContext`, `deviceId: test-device-001`). Full test commands: [Testing architecture](../architecture/testing.md).

## Related docs

- [Backend developer guide](../architecture/backend-developer-guide.md) — module index and persistence adoption matrix
- [prisma_sqlite_jpa_postgres_alignment.md](./prisma_sqlite_jpa_postgres_alignment.md)
- [database_overview.md](./database_overview.md)
- Outbox table: [synchronization/synchronization.md](./tables/synchronization/synchronization.md#outbox)
- Sequence table: [configuration/configuration.md](./tables/configuration/configuration.md#sequencegenerator)
