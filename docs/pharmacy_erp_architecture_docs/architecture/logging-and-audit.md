# Logging and Audit

Technical logging (Winston) and business audit (`AuditLog` table) are separate concerns. Use both where appropriate — never one mechanism for everything.

## When to use what

| Concern | Mechanism | Examples |
|---------|-----------|----------|
| Developer / support diagnostics | `AppLogger` (Winston) | API requests, errors, slow paths, sync failures, startup |
| Regulatory / business trail | `AuditService.log(tx, …)` | Price changes, invoice posting, user login, config changes |
| Stock quantity deltas | `StockMovement` (existing) | Immutable ledger via `InventoryLedgerService` |
| Sync payloads | `Outbox` (existing) | Transactional outbox for cloud sync — not a durable audit trail |

## Technical logging (`AppLogger`)

### Injection

```typescript
import { AppLogger } from '../common/logging/app-logger.service';

@Injectable()
export class SaleService {
  constructor(private readonly logger: AppLogger) {}

  async postSale(dto: PostSaleDto) {
    this.logger.info(
      { saleId: dto.saleId, branchId: dto.branchId },
      'Posting sale',
    );
  }
}
```

Nest `Logger` (`new Logger(MyService.name)`) also routes through Winston after bootstrap (`main.ts` sets `app.useLogger(AppLogger)`).

### Log levels

| Level | Use |
|-------|-----|
| `fatal` | Application cannot continue |
| `error` | Operation failed |
| `warn` | Unexpected but operation continued |
| `info` | Important application events (default in production) |
| `debug` | Developer diagnostics (default in development) |
| `verbose` / `trace` | Very detailed diagnostics |

Configure via `LOG_LEVEL` environment variable.

### Structured fields

Prefer structured metadata over string concatenation:

```typescript
// Good
this.logger.info({ medicineId: medicine.id, branchId }, 'Medicine updated');

// Avoid
this.logger.log(`Medicine ${medicine.id} updated`);
```

`bigint` and `Prisma.Decimal` values are serialized to strings automatically. Sensitive keys (`password`, `pin`, `token`, `accessToken`, `refreshToken`, `authorization`) are redacted.

### Correlation ID

Every HTTP request receives a `correlationId`:

- Incoming: `x-correlation-id` header (optional)
- Generated: `randomUUID()` when not provided
- Returned: `x-correlation-id` response header
- Propagated: all `AppLogger` lines and `AuditLog.correlationId` for that request

Related request context headers (dev / desktop client):

| Header | Purpose |
|--------|---------|
| `x-device-id` | Device identifier (fallback: `DEVICE_ID` env) |
| `x-user-id` | Acting user (**dev only** — production uses JWT) |
| `x-company-id` | Tenant company (**dev only** — production uses JWT) |
| `x-branch-id` | Branch (**dev only** — production uses JWT) |
| `x-session-id` | User session (**dev only**) |

In production (`NODE_ENV=production`), tenant and user identity come from the JWT via `ContextEnrichInterceptor` after `JwtAuthGuard`. See [Early foundations](./early-foundations.md#request-context-and-tenant-scoping).

`CorrelationMiddleware` opens `RequestContextService.run()` for the request lifecycle so persistence services and loggers share the same context.

### Log files

| Setting | Default | Description |
|---------|---------|-------------|
| `LOG_DIR` | `%LOCALAPPDATA%/pharmacy-erp/logs` (Windows) | Log directory |
| `LOG_LEVEL` | `debug` (dev) / `info` (prod) | Minimum log level |
| `NODE_ENV` | `development` | Controls console format (pretty vs JSON) |

Files (daily rotation, 14-day retention, gzip archives):

- `app-%DATE%.log` — all levels
- `error-%DATE%.log` — error and above only

Max size per file: 20 MB.

**Support workflow:** copy the `pharmacy-erp/logs` folder from the user's app-data directory.

## Business audit (`AuditService`)

### When to audit

Audit actions that answer: *who did what, when, on which entity?*

- Sales / purchase posting and cancellation
- Medicine, party, price, and configuration changes
- User login/logout and role changes
- Security events

Do **not** audit via `AuditService` when another table already captures the event immutably (e.g. stock deltas → `StockMovement`).

### Writing audit entries

Audit writes must run **inside the same `UnitOfWork` transaction** as the business mutation:

```typescript
import { AuditAction } from '../audit/audit-action.constants';
import { AuditModule } from '../audit/audit-module.constants';

await this.unitOfWork.run(async (tx) => {
  const sale = await this.createSale(tx, dto);

  await this.auditService.log(tx, {
    entityType: 'SalesInvoice',
    entityId: sale.id,
    entityUuid: sale.uuid,
    action: AuditAction.POST,
    module: AuditModule.SALES,
    description: 'Sales invoice posted',
  });

  await this.outboxService.enqueue(tx, { /* … */ });

  return sale;
});
```

`AuditService` pulls `userId`, `deviceId`, `correlationId`, `ipAddress`, and `sessionId` from `RequestContextService` automatically.

### Action and module constants

Use registries — do not scatter string literals:

- Actions: `AuditAction` in `src/audit/audit-action.constants.ts`
- Modules: `AuditModule` in `src/audit/audit-module.constants.ts`

Allowed actions match the `AuditLog` CHECK constraint: `CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `LOGOUT`, `APPROVE`, `REJECT`, `POST`, `SYNC`.

### Field-level changes

`AuditLog` records the action. Field-level before/after values belong in `ChangeHistory` (separate table) — not in Winston log files.

## Architecture

```text
HTTP Request
    │
    ▼
CorrelationMiddleware (RequestContext + correlationId)
    │
    ▼
LoggingInterceptor (method, url, status, duration → AppLogger)
    │
    ▼
Feature Service
    │
    ├─► AppLogger → Winston → console + rotating JSON files
    │
    └─► UnitOfWork.run(tx)
            ├─► AuditService.log(tx) → AuditLog table
            ├─► OutboxService.enqueue(tx) → Outbox table
            └─► InventoryLedgerService → StockMovement table
```

## Module layout

| Path | Role |
|------|------|
| `src/common/logging/` | Winston config, `AppLogger`, middleware, interceptor |
| `src/audit/` | `AuditService`, action/module constants |
| `src/persistence/context/` | `RequestContextService` (tenant + correlation context) |

## Related docs

- [AuditLog table spec](../database/tables/audit/58_audit_log.md)
- [Persistence patterns](../database/persistence-patterns.md)
- [Application architecture](./application-architecture.md)
- [Early foundations](./early-foundations.md) — auth, request context, settings, Angular/Electron
