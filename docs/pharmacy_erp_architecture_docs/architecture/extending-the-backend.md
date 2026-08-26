# Extending the Backend

**Status: implemented (backend)** — practical, end-to-end guide for adding new features to the Pharmacy ERP `backend/src` codebase.

This document explains how the backend is structured and gives a step-by-step recipe for building the next pharmacy domain module (sales, inventory, purchase, finance, etc.) on top of the existing foundations. It is written to be self-contained: read it top to bottom before adding a feature, then use the checklist at the end as you work.

Related docs:

- [Application architecture](./application-architecture.md) — Angular / Electron / NestJS layers
- [Persistence patterns](../database/persistence-patterns.md) — UnitOfWork, Outbox, Sequence, InventoryLedger
- [Reporting](./reporting.md) — read-only report registry and export
- [Logging and audit](./logging-and-audit.md) — Winston logging and `AuditService`
- [Testing](./testing.md) — unit, persistence, e2e commands
- [Database overview](../database/database_overview.md) — schema and table specs

---

## 1. Mental model

The backend is a **NestJS 11 + Prisma 7 + SQLite** service. Every request flows through a fixed pipeline, and every feature module follows the same shape. Once you understand the pipeline and the "feature module anatomy", extending the app is repetitive and safe.

### Request pipeline

```
HTTP request
  → CorrelationMiddleware        establishes RequestContext (correlationId, deviceId, tenant scope)
  → JwtAuthGuard                 validates JWT, attaches request.user  (skip with @Public())
  → PermissionsGuard             enforces @RequirePermissions('DOMAIN:ENTITY:ACTION')
  → ContextEnrichInterceptor     merges JWT user (userId/companyId/branchId/sessionId) into RequestContext
  → LoggingInterceptor           request timing logs
  → Controller method            thin — delegates to a service, returns raw data
  → Service                      business logic; reads via PrismaService, writes via UnitOfWorkService
  → ResponseInterceptor          wraps result as { success: true, data, [pagination] }
  ← (on throw) GlobalExceptionFilter → { success: false, error: { code, message, details } }
```

The wiring lives in `backend/src/app.module.ts` — global filter, interceptors, guards, and the correlation middleware are registered there via `APP_FILTER`, `APP_INTERCEPTOR`, `APP_GUARD` tokens.

### Feature module anatomy

Every feature module (see `party/` as the reference implementation) uses the same folder layout:

```
<feature>/
  <feature>.module.ts        wires controllers + services, imports Prisma/Persistence/Audit
  <feature>.controller.ts    thin HTTP layer, permission-guarded, returns raw data
  <feature>.service.ts       business logic; reads (PrismaService) + writes (UnitOfWorkService)
  <feature>.service.spec.ts  unit tests
  dto/                       class-validator request DTOs
  mappers/                   Prisma entity → JSON-safe response (bigint/Decimal → string)
  constants/                 (optional) enums, error/permission codes
  utils/                     (optional) shared helpers (not-found/conflict throwers, etc.)
```

### Golden rules

1. **Controllers are thin.** No business logic, no Prisma calls, no envelope building. They validate input (via DTOs), enforce permissions, and call a service.
2. **Reads go direct; writes go through a transaction.** List/get use `this.prisma.client.*`. Every create/update/delete runs inside `this.unitOfWork.run(tx => …)`.
3. **Every mutation writes audit + outbox in the same transaction.** `auditService.log(tx, …)` and `outboxService.enqueue(tx, …)` participate in the same `tx` so they commit or roll back atomically with the change.
4. **Never leak `bigint` or `Decimal` into JSON.** Map entities to responses; serialize IDs and money to strings.
5. **Everything is tenant-scoped.** Filter by `companyId` / `branchId` from `RequestContext`.
6. **Additive-only.** Add new files and guarded logic; do not refactor or "fix" unrelated code (see the change policy in `.cursor/rules/00-project-context.mdc`).

---

## 2. The shared building blocks you extend

These are the reusable pieces every feature depends on. Import them; do not reinvent them.

### Persistence layer (`persistence/`, exported globally via `PersistenceModule`)

| Service | Purpose | Public API |
|---|---|---|
| `UnitOfWorkService` | Wrap multi-write flows in a transaction (retries once on serialization conflict) | `run<T>(fn: (tx) => Promise<T>): Promise<T>` |
| `SequenceGeneratorService` | Allocate human-readable document numbers (invoice, GRN, etc.) with reset policies | `next(tx, { documentType, companyId, branchId })` → `{ sequenceValue, documentNumber }` |
| `OutboxService` | Enqueue a sync event for offline-first replication (same transaction) | `enqueue(tx, { entityType, entityUuid, operation, payload, ... })` |
| `InventoryLedgerService` | Apply stock IN/OUT movements with balance + optimistic version guards | `applyMovement(tx, { ... })` |
| `RequestContextService` | Read the current tenant/user/device context (AsyncLocalStorage) | `get()`, `tryGet()`, `getDeviceId()`, `run(ctx, fn)` |

### Common layer (`common/`)

| Piece | Path | Use it for |
|---|---|---|
| `ApplicationException` | `common/exceptions/application.exception.ts` | Throwing domain errors with a code + HTTP status + details |
| `ErrorCode` | `common/exceptions/error-code.ts` | Central registry of error code strings — add new codes here |
| `ResponseInterceptor` | `common/interceptors/response.interceptor.ts` | (automatic) wraps success responses |
| `GlobalExceptionFilter` | `common/exceptions/global-exception.filter.ts` | (automatic) maps errors to the error envelope |
| `PaginatedResult` | `common/response/paginated-result.ts` | Returning paginated lists (`PaginatedResult.of(data, pagination)`) |
| `PaginationQueryDto` | `common/dto/pagination-query.dto.ts` | Standard `page` / `pageSize` / `search` query params |
| `ParseBigIntPipe` | `common/pipes/parse-bigint.pipe.ts` | Converting a `:id` route param string to `bigint` |
| `AppLogger` | `common/logging/app-logger.service.ts` | Structured Winston logging inside services |

### Auth layer (`auth/`)

| Piece | Path | Use it for |
|---|---|---|
| `@RequirePermissions(...)` | `auth/decorators/require-permissions.decorator.ts` | Guarding a route with a permission code |
| `@Public()` | `auth/decorators/public.decorator.ts` | Marking a route as auth-exempt |
| `AuthenticatedUser` | `auth/interfaces/authenticated-user.interface.ts` | Typing `request.user` |

### Audit (`audit/`)

`AuditService.log(tx, { entityType, entityId, entityUuid, action, module })` — call inside `unitOfWork.run` on every mutation. Actions live in `audit/audit-action.constants.ts`, modules in `audit/audit-module.constants.ts`.

---

## 3. Step-by-step: add a new feature module

The running example below adds a `Prescription` feature (a natural pharmacy entity). Substitute your own domain (sales invoice, purchase order, stock adjustment, etc.).

### Step 0 — Design the model and the API

Before writing code, decide:

- **Table + columns** (BIGINT `id`, `uuid`, tenant columns `companyId`/`branchId`, a `version` column for optimistic concurrency, audit timestamps).
- **Endpoints** — typically `GET /prescriptions`, `GET /prescriptions/:id`, `POST /prescriptions`, `PATCH /prescriptions/:id`, `DELETE /prescriptions/:id`.
- **Permission codes** — `PRESCRIPTION:READ`, `PRESCRIPTION:CREATE`, `PRESCRIPTION:UPDATE`, `PRESCRIPTION:DELETE`.
- **Whether it touches inventory** — dispensing reduces stock, so it would call `InventoryLedgerService`.
- **Whether it needs a document number** — if yes, register a `documentType` and use `SequenceGeneratorService`.

### Step 1 — Add the Prisma model and migrate

Add the model to the multi-file Prisma schema under `backend/prisma/<domain>/`, following the conventions of existing models (see [Database overview](../database/database_overview.md) and existing schema files). Include:

- `id BigInt @id` (assigned automatically by the client factory's `$extends` hook — do not set it manually)
- `uuid String @unique` (stable identity for sync)
- tenant columns (`companyId`, `branchId`)
- `version Int @default(0)` for optimistic concurrency
- audit timestamps (`createdAt`, `updatedAt`)

Then generate the client and apply the migration from `backend/`:

```bash
npx prisma migrate dev --name add_prescription
npx prisma generate
```

> BIGINT ids are allocated by the app, not the database. The client factory (`persistence/prisma/prisma-client.factory.ts`) auto-assigns `nextBigIntId()` on `create` when `id` is omitted, and `PrismaService.onModuleInit` syncs the in-memory sequence from the DB on boot.

### Step 2 — Add error codes and permission codes

Add domain error codes to `common/exceptions/error-code.ts`:

```typescript
export const ErrorCode = {
  // ... existing ...
  PRESCRIPTION_NOT_FOUND: 'PRESCRIPTION_NOT_FOUND',
  PRESCRIPTION_CONFLICT: 'PRESCRIPTION_CONFLICT',
} as const;
```

Add the permission codes to your seed data (`backend/seed/data/security/permission*`) and grant them to the appropriate role(s) via `role-permission` seed data, so a logged-in user can actually call the endpoints. Re-seed with `npm run db:seed:fresh`.

### Step 3 — Create request DTOs

`prescription/dto/create-prescription.dto.ts` — use `class-validator`. Represent BIGINT foreign keys as **strings** (validated with `@Matches(/^\d+$/)`), because JSON has no bigint:

```typescript
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreatePrescriptionDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+$/)
  patientPartyId!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+$/)
  doctorPartyId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
```

`prescription/dto/update-prescription.dto.ts` — partial update fields plus the current `version` for optimistic concurrency (delete/update require the client to send the version it last read).

The global `ValidationPipe` (`whitelist`, `transform`, `forbidNonWhitelisted`) automatically rejects unknown fields and coerces types — you do not validate manually in the controller.

### Step 4 — Create the response mapper

`prescription/mappers/prescription.mapper.ts` — convert the Prisma entity into a JSON-safe shape. **Serialize `bigint` ids and `Decimal` money to strings; dates to ISO strings.**

```typescript
import type { Prescription } from '@prisma/client';

export interface PrescriptionResponse {
  id: string;
  uuid: string;
  patientPartyId: string;
  doctorPartyId: string;
  notes: string | null;
  version: number;
  createdAt: string;
}

export function toPrescriptionResponse(p: Prescription): PrescriptionResponse {
  return {
    id: p.id.toString(),
    uuid: p.uuid,
    patientPartyId: p.patientPartyId.toString(),
    doctorPartyId: p.doctorPartyId.toString(),
    notes: p.notes ?? null,
    version: p.version,
    createdAt: p.createdAt.toISOString(),
  };
}
```

### Step 5 — Write the service

`prescription/prescription.service.ts` — the heart of the feature. Reads use `PrismaService` directly; writes use `UnitOfWorkService.run` and always emit audit + outbox in the same transaction.

```typescript
import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UnitOfWorkService } from '../persistence/unit-of-work/unit-of-work.service';
import { OutboxService } from '../persistence/outbox/outbox.service';
import { RequestContextService } from '../persistence/context/request-context.service';
import { AuditService } from '../audit/audit.service';
import { ApplicationException } from '../common/exceptions/application.exception';
import { ErrorCode } from '../common/exceptions/error-code';
import { PaginatedResult, buildPagination } from '../common/response/paginated-result';
import type { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { toPrescriptionResponse } from './mappers/prescription.mapper';
import type { CreatePrescriptionDto } from './dto/create-prescription.dto';

@Injectable()
export class PrescriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly outboxService: OutboxService,
    private readonly auditService: AuditService,
    private readonly requestContext: RequestContextService,
  ) {}

  // READ — direct client, tenant-scoped, paginated
  async list(query: PaginationQueryDto) {
    const { companyId, branchId } = this.requestContext.get();
    const where = { companyId, branchId };
    const [rows, total] = await Promise.all([
      this.prisma.client.prescription.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { id: 'desc' },
      }),
      this.prisma.client.prescription.count({ where }),
    ]);
    return PaginatedResult.of(
      rows.map(toPrescriptionResponse),
      buildPagination(query.page, query.pageSize, total),
    );
  }

  async getById(id: bigint) {
    const row = await this.prisma.client.prescription.findFirst({
      where: { id, ...this.requestContext.get() },
    });
    if (!row) {
      throw new ApplicationException(
        ErrorCode.PRESCRIPTION_NOT_FOUND,
        'Prescription not found',
        HttpStatus.NOT_FOUND,
        { id: id.toString() },
      );
    }
    return toPrescriptionResponse(row);
  }

  // WRITE — transaction + audit + outbox
  async create(dto: CreatePrescriptionDto) {
    const { companyId, branchId } = this.requestContext.get();
    return this.unitOfWork.run(async (tx) => {
      const prescription = await tx.prescription.create({
        data: {
          uuid: crypto.randomUUID(),
          companyId,
          branchId,
          patientPartyId: BigInt(dto.patientPartyId),
          doctorPartyId: BigInt(dto.doctorPartyId),
          notes: dto.notes ?? null,
        },
      });

      await this.auditService.log(tx, {
        entityType: 'PRESCRIPTION',
        entityId: prescription.id,
        entityUuid: prescription.uuid,
        action: 'CREATE',
        module: 'PRESCRIPTION',
      });

      await this.outboxService.enqueue(tx, {
        entityType: 'PRESCRIPTION',
        entityUuid: prescription.uuid,
        operation: 'CREATE',
        payload: { uuid: prescription.uuid },
      });

      return toPrescriptionResponse(prescription);
    });
  }
}
```

> For updates and deletes, use **optimistic concurrency**: `updateMany({ where: { id, version }, data: { ..., version: { increment: 1 } } })` and if the returned `count` is `0`, throw a conflict `ApplicationException`. See `party/utils/party.util.ts` for reusable `throwNotFound` / `throwConflict` / `optimisticUpdate` helpers you can mirror.

### Step 6 — Write the controller

`prescription/prescription.controller.ts` — thin, permission-guarded, returns raw data. Use `ParseBigIntPipe` for the `:id` param.

```typescript
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { ParseBigIntPipe } from '../common/pipes/parse-bigint.pipe';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrescriptionService } from './prescription.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';

@Controller('prescriptions')
export class PrescriptionController {
  constructor(private readonly prescriptionService: PrescriptionService) {}

  @Get()
  @RequirePermissions('PRESCRIPTION:READ')
  list(@Query() query: PaginationQueryDto) {
    return this.prescriptionService.list(query);
  }

  @Get(':id')
  @RequirePermissions('PRESCRIPTION:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.prescriptionService.getById(id);
  }

  @Post()
  @RequirePermissions('PRESCRIPTION:CREATE')
  create(@Body() dto: CreatePrescriptionDto) {
    return this.prescriptionService.create(dto);
  }
}
```

Do **not** wrap the return value in `{ success, data }` — `ResponseInterceptor` does that. Paginated results returned as `PaginatedResult` automatically get a `pagination` key.

### Step 7 — Wire the module

`prescription/prescription.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { PersistenceModule } from '../persistence/persistence.module';
import { AuditModule } from '../audit/audit.module';
import { PrescriptionController } from './prescription.controller';
import { PrescriptionService } from './prescription.service';

@Module({
  imports: [PrismaModule, PersistenceModule, AuditModule],
  controllers: [PrescriptionController],
  providers: [PrescriptionService],
  exports: [PrescriptionService],
})
export class PrescriptionModule {}
```

Then register it in `app.module.ts`:

```typescript
@Module({
  imports: [
    // ... existing modules ...
    PartyModule,
    PrescriptionModule,   // ← add
    ReportingModule,
  ],
  // ...
})
export class AppModule {}
```

### Step 8 — Test

- **Unit test** (`prescription/prescription.service.spec.ts`): mock `PrismaService`, `UnitOfWorkService`, `OutboxService`, `AuditService`, `RequestContextService`; assert business logic (not-found throws, conflict throws, audit + outbox called with correct args).
- **Persistence integration test** (`backend/test/persistence/`): run against the seeded SQLite database to verify the transaction actually commits the row + audit + outbox.

From `backend/`:

```bash
npm run test -- prescription/prescription.service.spec.ts
npm run test:persistence -- --testPathPatterns=prescription
```

See [Testing](./testing.md) for the full command matrix.

---

## 4. Common extension scenarios

### A mutation that allocates a document number

Inside `unitOfWork.run`, call the sequence generator before creating the row:

```typescript
return this.unitOfWork.run(async (tx) => {
  const { documentNumber } = await this.sequenceGenerator.next(tx, {
    documentType: 'SALES_INVOICE',
    companyId,
    branchId,
  });
  const invoice = await tx.salesInvoice.create({
    data: { invoiceNumber: documentNumber, /* ... */ },
  });
  // ... audit + outbox ...
});
```

Register the new `documentType` in the sequence constants (`persistence/sequence/document-type.constants.ts`) and seed a `SequenceGenerator` row (`backend/seed/data/configuration/`).

### A mutation that changes stock

Dispensing, sales, purchase receipts, and adjustments must go through `InventoryLedgerService.applyMovement(tx, …)` so `Stock` and `StockMovement` stay consistent with balance + version guards. Call it inside the same `unitOfWork.run` as the parent document write. See [Persistence patterns](../database/persistence-patterns.md).

### Optimistic concurrency on update / delete

The client sends the `version` it last read. The service uses `updateMany`/`deleteMany` with `where: { id, version }`; a `count` of `0` means someone else changed the row first — throw a conflict:

```typescript
const result = await tx.prescription.updateMany({
  where: { id, version: dto.version },
  data: { notes: dto.notes, version: { increment: 1 } },
});
if (result.count === 0) {
  throw new ApplicationException(
    ErrorCode.PRESCRIPTION_CONFLICT,
    'Prescription was modified by another user',
    HttpStatus.CONFLICT,
  );
}
```

### A public (unauthenticated) endpoint

Annotate the handler with `@Public()` to skip `JwtAuthGuard`. Use sparingly (health checks, login).

### A read-only report

Do **not** build a new controller. Register a `ReportDefinition` provider into `ReportRegistryService` (see the `reporting/providers/party/` example) and it is exposed automatically at `GET /reports/:reportId` with CSV/Excel/PDF export. Full guide: [Reporting](./reporting.md).

### Seed data for the new feature

Add JSON masters under `backend/seed/data/<domain>/` and/or a generator under `backend/seed/lib/generators/` wired into the phased `seed.ts` pipeline. After changing master JSON (permissions, sequences, etc.), run `npm run db:seed:fresh`. See [backend/seed/README.md](../../../backend/seed/README.md) for phases, append mode, and `--only` resume.

---

## 5. Do / Don't

| Do | Don't |
|---|---|
| Keep controllers thin; put logic in the service | Call Prisma or build the response envelope in the controller |
| Read with `this.prisma.client.*`; write with `unitOfWork.run` | Do multi-row writes outside a transaction |
| Emit `auditService.log` + `outboxService.enqueue` inside the write transaction | Emit audit/outbox after the transaction commits |
| Serialize `bigint`/`Decimal` to strings in mappers | Return raw `bigint`/`Decimal` in JSON |
| Filter every query by `companyId`/`branchId` | Query across tenants |
| Add new `ErrorCode` entries for new domain errors | Throw raw `Error` or hard-code error strings |
| Guard routes with `@RequirePermissions(...)` and seed the permission | Leave new endpoints unguarded |
| Follow additive-only change policy | Refactor or "fix" unrelated modules while adding a feature |

---

## 6. Extension checklist

1. [ ] Design model, endpoints, permissions; decide if it touches inventory / needs a document number.
2. [ ] Add the Prisma model under `backend/prisma/<domain>/`; run `npx prisma migrate dev` + `npx prisma generate`.
3. [ ] Add `ErrorCode` entries in `common/exceptions/error-code.ts`.
4. [ ] Add permission + role-permission seed data; `npm run db:seed:fresh`.
5. [ ] Create request DTOs in `dto/` (BIGINT FKs as validated strings).
6. [ ] Create the response mapper in `mappers/` (bigint/Decimal → string).
7. [ ] Write the service: reads via `PrismaService`, writes via `UnitOfWorkService.run` + `auditService.log` + `outboxService.enqueue`.
8. [ ] Write the controller: thin, `@RequirePermissions(...)`, `ParseBigIntPipe` for `:id`, return raw data.
9. [ ] Create the feature module importing `PrismaModule`, `PersistenceModule`, `AuditModule`; export the service.
10. [ ] Register the module in `app.module.ts`.
11. [ ] Add unit spec + persistence integration test.
12. [ ] (Optional) Register a `ReportDefinition` for reporting; add seed generators.
13. [ ] Run `npm run lint` and the relevant tests before finishing.
