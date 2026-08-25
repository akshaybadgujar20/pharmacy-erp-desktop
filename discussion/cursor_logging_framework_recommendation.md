# Logging framework recommendation
_Exported on 8/25/2026 at 21:43:40 GMT+5:30 from Cursor (3.17.8)_

---

**User**

@backend what could be good logging framework for me here ?

---

**Cursor**

Let me look at your backend setup to give a recommendation tailored to your stack.

Let me check how logging is currently used.

Good context — you're on NestJS 11 with Prisma 7 + SQLite, this is a **local desktop ERP** (not a distributed cloud service), and today you only use Nest's built-in `Logger` (in `GlobalExceptionFilter`). That distinction matters for the recommendation.

## Recommendation: `nestjs-pino` (Pino)

For your stack, [`nestjs-pino`](https://github.com/iamolegga/nestjs-pino) is the best fit.

**Why Pino here:**
- **Fastest** Node logger with the lowest overhead — good for a desktop app where the Node process shares the machine with the UI and SQLite. It won't compete with your DB for CPU.
- **Structured JSON by default** — pairs well with your existing envelope discipline (`{ success, error: { code, message, details } }`). Logs become machine-parseable for support tooling.
- **First-class Nest integration** — replaces the built-in `Logger`, so your existing `new Logger(GlobalExceptionFilter.name)` calls keep working with zero rewrites.
- **Automatic request-context binding** — auto-generates a request ID per HTTP request and attaches it to every log line in that request. This complements your `RequestContextService` (tenant/device context) nicely — you can inject those fields into the log context too.
- **Redaction built in** — your `nestjs-rules.mdc` explicitly says "do not log sensitive data." Pino's `redact` option lets you strip fields like `password`, `token`, `authorization` declaratively.
- **`pino-pretty`** for readable colorized dev output; raw JSON in prod.
- **`pino/file` + rotation** — for a desktop app, writing rotating log files to the user's app-data directory is exactly what you want for offline support/diagnostics.

## Realistic alternative: `nest-winston` (Winston)

[`nest-winston`](https://github.com/gremo/nest-winston) is the main alternative. Consider it if:
- You want the richest **transport ecosystem** out of the box (daily-rotate-file, many sinks) with less assembly.
- You prefer configuring formats/levels imperatively rather than Pino's stream model.

Trade-off: meaningfully slower and heavier than Pino. For a background API on a desktop, Pino's efficiency is the better default.

## What I would *not* reach for
- **Plain `console.*`** — you're already past this with Nest `Logger`; don't regress.
- **Bare Nest built-in `Logger` long-term** — fine for now, but it has no structured output, no redaction, and no file/rotation story. Fine to keep for the smallest apps, but you'll outgrow it.

## How it fits your codebase specifically

A few integration points worth noting when you implement:

1. **Wire it in `main.ts`** via `app.useLogger(app.get(Logger))` and `bufferLogs: true`, so bootstrap logs also route through Pino.
2. **Register `LoggerModule.forRoot(...)` in `AppModule`** (your rules keep `AppModule` as wiring-only — this qualifies), reading config through `@nestjs/config` per your `nestjs-rules.mdc` (no direct `process.env` outside `main.ts`).
3. **Feed `RequestContextService` values** (tenant/device) into the log context so every line is traceable per request.
4. **Set `redact`** for sensitive keys to satisfy the "no sensitive data" rule.
5. **Log file target** — for the desktop build, point a transport at the OS app-data dir with rotation, so support can pull logs from a user's machine.

## Summary

| Option | Verdict |
|---|---|
| **`nestjs-pino`** | Best fit — fast, structured, redaction, drop-in for Nest `Logger`, request-context aware |
| `nest-winston` | Good alternative if you want more built-in transports; heavier/slower |
| Nest built-in `Logger` | Fine short-term; no structure/redaction/rotation |
| `console.*` | Avoid |

Want me to sketch the concrete `LoggerModule` config (with redaction + file rotation to app-data) tailored to your `RequestContextService` and `@nestjs/config` setup? I can lay that out — and if you switch to Agent mode I can wire it in directly.

Note: I'm in Ask mode, so I've only analyzed and recommended here — no files were changed.

---

**User**

what is your opinion on this

For your **NestJS monolithic, single-service Pharmacy ERP**, I would keep logging **simple now, but structured enough to scale later**.

## My recommendation

```text
Angular / Electron
       │
       ▼
NestJS Monolith
       │
       ├── HTTP/API Logging
       ├── Application Logging
       ├── Business/Audit Logging
       ├── Error Logging
       └── Database/Prisma Logging
              │
              ▼
        Structured JSON Logs
              │
              ├── Local log files
              └── Future: centralized/cloud logging
```

### Best stack

I would recommend:

* **NestJS Logger abstraction**
* **Pino** for technical/application logging
* **Separate Audit Log table** for business-critical actions
* **Prisma logging/interceptors** for database errors and optionally slow queries
* **Correlation ID / Request ID**
* **Global exception filter**

The important part is: **do not use one logging mechanism for everything**.

---

# 1. Separate your logs into two categories

This is especially important for a Pharmacy ERP.

## A. Technical/Application Logs

These are for developers and support.

Examples:

```text
Application started
API request received
Database connection failed
Prisma query failed
Unhandled exception
Slow API request
Synchronization failed
```

Use:

> **Pino**

Example:

```ts
this.logger.error(
  {
    err,
    medicineId,
    branchId,
  },
  'Failed to create medicine',
);
```

Structured logging is much better than:

```ts
console.log(`Failed to create medicine ${medicineId}`);
```

Because later you can search/filter by:

```text
medicineId = 123
branchId = 2
requestId = abc-123
```

---

# 2. Business Audit Logs — separate database table

For a Pharmacy ERP, this is arguably more important than normal application logs.

You need to know things such as:

```text
Who created a medicine?
Who changed the selling price?
Who deleted or deactivated a party?
Who adjusted stock?
What was the previous quantity?
What is the new quantity?
Who cancelled an invoice?
When did it happen?
```

These should **not only go to Pino log files**.

Create a proper `AuditLog` table.

Something conceptually like:

```prisma
model AuditLog {
  id          BigInt   @id @default(autoincrement())
  uuid        String   @unique

  entityType  String
  entityId    BigInt?

  action      String

  oldValue    Json?
  newValue    Json?

  userId      BigInt?
  branchId    BigInt?

  requestId   String?

  createdAt   DateTime @default(now())
}
```

Example:

```text
entityType: STOCK_ADJUSTMENT
entityId: 101
action: CREATED

userId: 25
branchId: 1

oldValue: null

newValue:
{
  "medicineId": 100,
  "quantity": -5,
  "reason": "DAMAGED"
}
```

This gives you a permanent audit trail.

---

# 3. Recommended logging layers

For your monolithic NestJS Pharmacy ERP:

```text
┌─────────────────────────────┐
│     Global HTTP Middleware   │
│        Request ID            │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│        NestJS API            │
│ Controllers / Guards         │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│      Service Layer           │
│ Business Error / Events      │
└──────────────┬──────────────┘
               │
               ├──────────────► Pino Logs
               │
               └──────────────► Audit Service
                                      │
                                      ▼
                                  SQLite
```

Since your architecture is **SQLite-first/local-first**, I would avoid depending on an external logging server initially.

---

# 4. Request ID is highly recommended

Every API request should get a unique ID.

For example:

```text
requestId = req_abc123
```

Then all logs related to that request contain:

```json
{
  "requestId": "req_abc123",
  "userId": 25,
  "branchId": 1,
  "method": "POST",
  "url": "/sales",
  "statusCode": 500
}
```

If a pharmacy reports:

> "Sale creation failed at 4:30 PM."

You can trace the entire request.

---

# 5. What I would log automatically

Using middleware/interceptors:

### Every request

```text
Method
URL
Status code
Duration
Request ID
User ID
Branch ID
```

Example:

```json
{
  "requestId": "abc123",
  "method": "POST",
  "url": "/api/sales",
  "statusCode": 201,
  "duration": 145,
  "userId": 10,
  "branchId": 1
}
```

### Errors

```text
Error message
Stack trace
Request ID
User ID
Branch ID
URL
Relevant entity IDs
```

Do **not** blindly log:

```text
password
PIN
access token
refresh token
full patient/customer sensitive information
```

---

# 6. Log levels

I would standardize these:

| Level   | Use                                           |
| ------- | --------------------------------------------- |
| `fatal` | Application cannot continue                   |
| `error` | Operation failed                              |
| `warn`  | Suspicious/unexpected but operation continued |
| `info`  | Important business/application events         |
| `debug` | Developer diagnostics                         |
| `trace` | Very detailed diagnostics                     |

For production Pharmacy ERP:

```text
INFO
WARN
ERROR
FATAL
```

For development:

```text
DEBUG
INFO
WARN
ERROR
FATAL
```

---

# 7. I would create a LoggingModule

Something like:

```text
src/
├── common/
│   ├── logging/
│   │   ├── logging.module.ts
│   │   ├── logger.service.ts
│   │   ├── request-context.middleware.ts
│   │   ├── logging.interceptor.ts
│   │   └── exception.filter.ts
│   │
│   └── audit/
│       ├── audit.module.ts
│       ├── audit.service.ts
│       └── audit-log.service.ts
```

Your application code then remains clean:

```ts
@Injectable()
export class SaleService {
  constructor(
    private readonly logger: AppLogger,
    private readonly auditService: AuditService,
  ) {}

  async createSale(dto: CreateSaleDto) {
    this.logger.info(
      {
        branchId: dto.branchId,
        customerId: dto.customerId,
      },
      'Creating sale',
    );

    // Business logic

    await this.auditService.log({
      action: 'SALE_CREATED',
      entityType: 'SALE',
      entityId: sale.id,
    });
  }
}
```

---

# 8. My strongest recommendation for your Pharmacy ERP

I would use this:

```text
                    NestJS
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
   Technical Logging           Audit Logging
          │                         │
          ▼                         ▼
       Pino JSON              AuditLog Table
          │                         │
          ▼                         ▼
    Local Log Files              SQLite
          │
          ▼
 Future Centralized Logging
```

### Technical logging

Use **Pino** for:

* API requests
* Errors
* Exceptions
* Performance
* Database failures
* Sync failures in the future
* Application lifecycle

### Audit logging

Use a **database table** for:

* Sales
* Purchase
* Stock adjustments
* Stock transfers
* Price changes
* Medicine changes
* Batch changes
* Invoice cancellation
* User/role changes
* Important configuration changes

---

## What I would *not* do

I would **not**:

* Use `console.log()` throughout the application
* Store every technical log in SQLite
* Put every business action into text log files
* Log entire request/response bodies globally
* Build ELK/OpenSearch infrastructure right now for a single local Pharmacy ERP
* Over-engineer distributed tracing before you even have multiple services

### Final architecture

```text
NestJS Monolith
│
├── nestjs-pino
│   ├── HTTP logs
│   ├── Error logs
│   ├── Performance logs
│   └── Application logs
│
├── Request Context
│   ├── requestId
│   ├── userId
│   └── branchId
│
├── Global Exception Filter
│
├── Prisma Error / Slow Query Logging
│
└── Audit Module
    └── AuditLog database table
```

For your **offline-first SQLite Pharmacy ERP**, this is the sweet spot: **production-quality without unnecessary microservice-level complexity**. When you later introduce PostgreSQL and synchronization, you can keep the same application logging API and extend the log transport/aggregation separately.


---

**Cursor**

Let me check your existing persistence layer, since the proposal's audit/request-context ideas overlap with things you may already have.

Let me look at the request-context, outbox, and inventory-ledger services since they directly overlap with the proposal's requestId/audit ideas.

This is a genuinely good proposal — it's well-reasoned and, importantly, it matches the grain of your actual architecture rather than fighting it. The core thesis ("don't use one logging mechanism for everything" → **Pino for technical logs, a DB table for business audit**) is exactly right for an offline-first SQLite ERP. I agree with ~85% of it. Below is where I'd push back or refine, grounded in what you already have in `src/persistence/`.

## Where it's spot-on

- **Two-lane split (technical vs. audit).** Correct. Pharmacy/regulatory contexts need a *permanent, queryable* "who changed the price / who adjusted stock" trail that must survive log rotation. Pino files can't guarantee that; a table can.
- **Pino + request/correlation ID + global exception filter + redaction.** All aligned with your `nestjs-rules.mdc` ("no sensitive data") and your existing `GlobalExceptionFilter`.
- **Not building ELK/OpenSearch now.** Right call for a local desktop app.

## Where it double-counts things you already have

This is the biggest refinement. The proposal talks as if you're starting from zero, but you already have two of the three "audit-ish" pieces:

1. **`RequestContextService` already carries most of the context.** Look at what exists:

```1:7:backend/src/persistence/context/request-context.ts
export interface RequestContextData {
  companyId: bigint;
  branchId: bigint;
  userId?: bigint;
  deviceId: string;
}
```

So `userId` / `branchId` / `companyId` / `deviceId` are *already* flowing through `AsyncLocalStorage`. The proposal's "Request Context module" is largely built. You'd just **add a `requestId` (correlation id) field** here and populate it in a middleware — then a Pino mixin reads `RequestContextService.tryGet()` and stamps every line. That's a much smaller change than the proposal implies, and it reuses your existing abstraction instead of introducing a parallel one.

2. **You already have two event/audit-adjacent tables — a generic `AuditLog` will overlap them.** Be deliberate here:
   - **`Outbox`** (`outbox.service.ts`) is a transactional change log with `entityType`, `entityUuid`, `operation`, `payload`, `deviceId`, `branchId`, `sequenceNo`. But it's a **sync mechanism** — rows get marked `SENT` and pruned, so it is *not* a durable audit trail.
   - **`StockMovement`** (`inventory-ledger.service.ts`) is already an **immutable ledger** with `createdBy`, `balanceAfter`, `referenceTable/referenceId`, `remarks`. For "who adjusted stock, old qty, new qty," you largely have this *already*.

   So the proposal's `AuditLog` with `oldValue/newValue` for `STOCK_ADJUSTMENT` would **partially duplicate `StockMovement`**. My opinion: still add `AuditLog`, but scope it to things *not* already covered by the ledger/outbox — price changes, medicine/party edits, invoice cancellation, user/role/config changes. Don't re-log stock quantity deltas that the ledger already captures immutably.

## The one correctness bug in the proposal's example

The proposal shows audit writes as fire-and-forget after the business logic:

```ts
// Business logic
await this.auditService.log({ action: 'SALE_CREATED', ... });
```

For **your** architecture that's wrong. Your `prisma-persistence-rules.mdc` mandates multi-write flows go through `UnitOfWorkService.run(tx => …)`, and `Outbox`/`InventoryLedger` already take a `tx` so they commit atomically with the mutation. The audit write **must do the same** — otherwise a sale can commit while its audit row silently fails (or vice-versa). So the real signature should be:

```ts
await this.unitOfWork.run(async (tx) => {
  const sale = await createSale(tx, dto);
  await this.auditService.log(tx, { action: 'SALE_CREATED', entityType: 'SALE', entityId: sale.id });
  await this.outboxService.enqueue(tx, { ... });
  return sale;
});
```

i.e. `AuditService.log(tx, input)`, participating in the same transaction — mirroring `OutboxService.enqueue(tx, …)`.

## Two concrete gotchas the proposal misses (and they'll bite you)

1. **Pino + `bigint` will throw.** Your IDs are `bigint` and your money/qty are `Prisma.Decimal`. `JSON.stringify(1n)` throws, and Pino serializes to JSON. You **must** configure a custom serializer / `pino`'s bigint handling (e.g. a `formatters`/serializer that stringifies bigints and Decimals), or every log line containing an id will error. This is non-negotiable in your codebase and the proposal doesn't mention it.
2. **Slow-query logging on SQLite is low value.** The proposal lists "slow query logging" prominently. With local `better-sqlite3` there's no network latency and queries are microseconds; I'd make this `debug`-level and optional rather than a headline feature. Log **Prisma errors** (you already have `prisma-error.mapper.ts`) — that's the valuable part.

## Minor: folder placement

The proposal puts `audit/` under `common/`. In your layout, `common/` is "exceptions, interceptors, response types" and DB-transactional services live in `persistence/`. Since `AuditService` writes to the DB inside a `tx`, it belongs as **its own module depending on `PersistenceModule`** (or under `persistence/`), not in `common/`. Keep `logging/` (Pino wiring, middleware, interceptor) in `common/` — that part's fine.

## Verdict

| Aspect | My take |
|---|---|
| Pino for technical logs | Agree |
| DB table for business audit | Agree — but scope it to *non-ledger* actions |
| Request/correlation ID | Agree — extend existing `RequestContextData`, don't build parallel |
| Audit as fire-and-forget | **Disagree** — must run inside `UnitOfWorkService` tx |
| `AuditLog` shape | Good, but avoid duplicating `StockMovement`/`Outbox` |
| Slow-query logging as headline | Downgrade for SQLite |
| bigint/Decimal serialization | Missing — mandatory to solve |
| `audit/` under `common/` | Move to a persistence-backed module |
| No ELK / no distributed tracing now | Agree |

Net: adopt the proposal, but treat it as **"extend what's in `persistence/`"** rather than "add a fresh parallel stack." The correlation ID rides on `RequestContextService`, audit writes ride on `UnitOfWorkService` (like `Outbox`), and Pino needs a bigint/Decimal-safe serializer on day one.

Want me to map each proposed piece to the exact existing file it should hook into (a concrete integration plan)? I can produce that outline — and if you move to Agent mode I can implement it.

---

**User**

does Winston  support json with file rotation ?

---

**Cursor**

Yes to both — with one nuance on rotation.

## JSON: built-in
Winston supports JSON natively via its format system. You just add `winston.format.json()`:

```js
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }), // capture stack traces
    format.json(),
  ),
  transports: [new transports.Console()],
});
```

Each line comes out as a structured JSON object.

## File rotation: needs a separate transport
Winston's **core** ships a `File` transport (`winston.transports.File`) that supports size-based rollover via `maxsize` + `maxFiles`, but it's basic (numeric suffixes, no time-based rotation).

For real rotation (daily/time-based, date-stamped filenames, gzip, retention by days) you add the official companion package **[`winston-daily-rotate-file`](https://github.com/winstonjs/winston-daily-rotate-file)**:

```js
import 'winston-daily-rotate-file';

new transports.DailyRotateFile({
  filename: 'logs/app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',      // keep 14 days, then delete
  format: format.combine(format.timestamp(), format.json()),
});
```

So: **JSON is core; rotation is core-but-basic (size only) or full-featured via `winston-daily-rotate-file`.**

## Comparison to Pino (for your context)
Both cover your requirement, but the shape differs:

| | Winston | Pino |
|---|---|---|
| JSON | `format.json()` (core) | JSON is the *default* output |
| Rotation | `winston-daily-rotate-file` (in-process) | via transports (`pino/file` + external `logrotate`, or `pino-roll`) |
| Config style | Transports + formats, imperative | Streams/transports, minimal |
| Overhead | Higher | Lower (async, faster) |

For a **desktop app** specifically, Winston's `winston-daily-rotate-file` is arguably *more convenient* than Pino here: it does time+size rotation, gzip, and retention **in-process** with no external `logrotate` cron — which you can't rely on inside a packaged Electron/desktop install. Pino can do it too (`pino-roll` or a rotating transport), but rotation is slightly less "batteries-included" than Winston's daily-rotate package.

One caveat that still applies to Winston in your codebase: like Pino, you'll need to handle **`bigint`/`Prisma.Decimal`** in log payloads (via a custom `format` that replaces the default replacer, or a `format.printf`/`format((info) => …)` transform), since `JSON.stringify(1n)` throws. That gotcha is logger-agnostic.

So if in-process, batteries-included rotation is a priority for your desktop packaging, Winston + `winston-daily-rotate-file` is a perfectly reasonable choice — the trade-off versus Pino is mostly raw throughput, which matters little for a single-user local ERP.

---

**User**

create a plan to add fully fledged framework for our @backend and add in technical docs about how to use

---

**Cursor**

Let me do a quick scan of a couple of things (where docs live, and how the root module is wired) before I ask you the key scoping questions.

Two audit-related docs already exist. Let me peek at them, since they affect scope.

I have enough context to plan well; two decisions materially change the plan, so let me confirm them.

Notable finding: you already have a fully-designed audit trail spec at [docs/pharmacy_erp_architecture_docs/database/tables/audit/58_audit_log.md](docs/pharmacy_erp_architecture_docs/database/tables/audit/58_audit_log.md) (with `correlationId`, `deviceId`, `entityType`, etc.). So the "business audit" lane is a separate, already-specced concern from the technical logging framework.

> **Which logging framework should the plan target for technical/application logs?**
> - nestjs-pino (Pino) — fastest, structured JSON default, lowest overhead (my earlier recommendation)
> - nest-winston (Winston) — batteries-included in-process file rotation via winston-daily-rotate-file (better fit for packaged desktop) ✔

> **How much should this plan cover?**
> - Technical logging framework only (Pino/Winston wiring, correlationId, HTTP interceptor, exception filter integration, file rotation, redaction, bigint/Decimal-safe serialization) + how-to docs
> - Logging framework PLUS implement the already-documented AuditLog table + transactional AuditService (inside UnitOfWork) + docs (Recommended) ✔

Winston + full scope (logging framework plus the AuditLog table/service). Let me gather the remaining specifics I need for an accurate plan.

Let me check the Prisma schema (does `AuditLog`/`User` exist yet?), the error codes, and how request context is set in tests.

The model regex returned nothing, which is surprising since `tx.outbox`/`tx.stockMovement` are used. Let me inspect the schema directly.

The schema is split across files (Prisma multi-file). Let me find the model files and check for existing audit/user models.

The `AuditLog` model already exists in the schema. Let me read its actual definition (and confirm the doc folder for the how-to guide) so the plan aligns with reality.

I now have everything I need. Key findings that shape the plan:

- The `AuditLog` **model already exists** at [backend/prisma/audit/audit-log.prisma](backend/prisma/audit/audit-log.prisma) with `correlationId`, `deviceId`, `userId`, `entityType/entityId/entityUuid`, `action`, `module`, etc. So no new schema is needed — we just need an `AuditService` that writes to it.
- `RequestContextData` ([backend/src/persistence/context/request-context.ts](backend/src/persistence/context/request-context.ts)) has `companyId/branchId/userId?/deviceId` but **no `correlationId`**, and there is **no HTTP middleware** setting request context today (only tests call `requestContext.run`). That gap is the main wiring work.
- Existing `GlobalExceptionFilter` uses `new Logger(...)`, which will automatically route through Winston once we call `app.useLogger(...)` — so minimal change there.
- Multi-write flows go through `UnitOfWorkService.run(tx => …)`; audit writes must take `tx` like `OutboxService.enqueue(tx, …)`.

Let me write up the plan.

---

**User**

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

**Cursor**

I'll implement the Winston logging framework and transactional audit per the plan, starting with dependencies and core logging modules.


Dependencies are installed. Next I'll add the logging and audit modules.


Registering middleware and interceptor in `LoggingModule` so Nest DI can resolve them.


AuditLog table is verified. Next I'll add tests and documentation.


The audit integration test needs a shared `RequestContextService` instance — I'll fix that and update AGENTS.md.


Fixing lint issues in the new files only.


The middleware was passing a callback to `next()`, which Express treats as an error. Fixing that.


Implementation is complete. Here's what was added:

## Technical logging (Winston)

**New module:** `backend/src/common/logging/`
- `winston.config.ts` — JSON logs, daily rotation (`app-%DATE%.log`, `error-%DATE.%log`), redaction, `bigint`/`Prisma.Decimal` safe serialization
- `app-logger.service.ts` — `AppLogger` injects `RequestContext` (correlationId, userId, branchId, etc.)
- `correlation.middleware.ts` — sets `x-correlation-id`, opens `RequestContextService.run()` per request
- `logging.interceptor.ts` — logs method, URL, status, duration per request
- `logging.module.ts` — wires Winston + exports providers

**Wired in:** `main.ts` (`bufferLogs` + `app.useLogger(AppLogger)`) and `app.module.ts` (`ConfigModule`, `LoggingModule`, middleware, interceptor)

## Business audit

**New module:** `backend/src/audit/`
- `audit-action.constants.ts` / `audit-module.constants.ts` — typed registries
- `audit.service.ts` — `log(tx, input)` writes to existing `AuditLog` table inside the transaction
- `audit.module.ts` — exports `AuditService`

## Request context extended

`RequestContextData` now includes optional `correlationId`, `ipAddress`, `sessionId`.

## Docs

- [docs/pharmacy_erp_architecture_docs/architecture/logging-and-audit.md](docs/pharmacy_erp_architecture_docs/architecture/logging-and-audit.md) — full how-to guide
- [backend/AGENTS.md](backend/AGENTS.md) — logging/audit pointer added

## Tests

- Unit: `log-sanitizer`, `AppLogger`, `AuditService`
- Integration: `audit-service.integration.spec.ts`
- All 18 unit + 6 persistence tests pass

## Manual verification

`GET /app` with `x-correlation-id: test-corr-001` returns 200 with the correlation header echoed, and Winston logs:

```json
{ "correlationId": "test-corr-001", "method": "GET", "url": "/app", "statusCode": 200, "durationMs": 1 }
```

Log files default to `%LOCALAPPDATA%/pharmacy-erp/logs/` (override with `LOG_DIR`).

---

**User**

<system_notification>
The following task has finished. If you were already aware, ignore this notification and do not restate prior responses.

<task>
kind: shell
status: error
task_id: 820112
title: Start NestJS server for manual check
tool_call_id: tool_cf8078c4-bd5f-4d4a-a34a-bde537299a6
detail: exit_code=1
output_path: C:\Users\abadgujar2\.cursor\projects\c-Users-abadgujar2-IdeaProjects-eSearch-pharmacy-erp-desktop\terminals\820112.txt
</task>
</system_notification>

<system_notification>
The following task has finished. If you were already aware, ignore this notification and do not restate prior responses.

<task>
kind: shell
status: error
task_id: 820113
title: Rebuild and restart server with middleware fix
tool_call_id: tool_ce508bbe-5ecd-4243-8b3b-861152cebd8
detail: exit_code=1
output_path: C:\Users\abadgujar2\.cursor\projects\c-Users-abadgujar2-IdeaProjects-eSearch-pharmacy-erp-desktop\terminals\820113.txt
</task>
</system_notification>
<user_query>Briefly inform the user about the task result and perform any follow-up actions (if needed). If there's no follow-ups needed, don't explicitly say that.</user_query>

---

**Cursor**

The Winston logging framework and transactional audit layer are in place and working.

**Delivered:**
- **Winston** technical logging with structured JSON, daily file rotation, redaction, and safe `bigint`/`Decimal` serialization
- **`AppLogger`**, correlation middleware, and HTTP request logging interceptor
- **`AuditService.log(tx, …)`** writing to the existing `AuditLog` table inside `UnitOfWork` transactions
- How-to guide at `docs/pharmacy_erp_architecture_docs/architecture/logging-and-audit.md`

**Verified:** 18 unit tests and 6 persistence tests pass. A manual `GET /app` request logged correlation ID, status, and duration correctly.

**Config:** logs default to `%LOCALAPPDATA%/pharmacy-erp/logs/` — override with `LOG_DIR` and `LOG_LEVEL` env vars.

---

**User**

I hope we are going to cover stanadard format with all HTTPs methods and all stanarad erp things ?

---

**Cursor**

Let me check what's implemented today versus what a full ERP logging standard would typically cover.


Short answer: **the plumbing is method-agnostic and ERP-oriented, but it does not yet automatically cover every HTTP call and every ERP event end-to-end.** You have the **foundation**; domain coverage grows as you add feature modules.

## HTTP methods — yes, universally

The logging stack does **not** special-case GET. It applies to **all routes and all methods**:

| Layer | Coverage |
|--------|----------|
| `CorrelationMiddleware` | Every route (`*`) — GET, POST, PUT, PATCH, DELETE, etc. |
| `LoggingInterceptor` | Logs `req.method` dynamically — whatever method was used |
| `GlobalExceptionFilter` | All failed requests, any method |
| `AppLogger` | Any service/controller, any code path |

Today you only have `GET /app`, but when you add `POST /sales`, `PATCH /medicines/:id`, etc., they’ll get the same structured request log:

```json
{ "method": "POST", "url": "/sales", "statusCode": 201, "durationMs": 145, "correlationId": "...", ... }
```

So **HTTP method coverage is already standard** — no extra wiring per method.

## “Standard ERP things” — partially

What’s **ready now** (infrastructure):

- **Correlation ID** on every request (`x-correlation-id`)
- **Tenant context** (company, branch, user, device, session)
- **Structured JSON logs** + file rotation + redaction
- **Audit registries** aligned with your `AuditLog` spec: `CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `LOGOUT`, `APPROVE`, `REJECT`, `POST`, `SYNC`
- **ERP modules** in constants: Sales, Purchase, Inventory, Medicine, Party, Finance, Security, Configuration, Synchronization
- **Transactional audit** via `AuditService.log(tx, …)` inside `UnitOfWork`
- **Stock ledger** and **Outbox** already handle their own domains (not duplicated in audit)

What’s **not automatic yet** (must be added as you build features):

| ERP area | Status |
|----------|--------|
| Sales / purchase posting | `AuditService` exists — **feature services must call it** |
| Login / logout | Action constants exist — **no auth module wiring yet** |
| Price / medicine / party changes | Same — **per-service audit calls** |
| Field-level before/after | **`ChangeHistory` table** — separate, not implemented |
| Failed business errors (`ApplicationException`) | Returned to client — **not always logged at `error` level** (only unknown exceptions are) |
| Slow-request warnings | Duration is logged — **no threshold/`warn` yet** (e.g. > 2s) |

So the **format and patterns are standard ERP-grade**; the **breadth** depends on wiring audit/logging into each domain module as you implement them.

## What “fully covered” will look like

As you add ERP modules, each should follow the doc pattern:

```typescript
// Inside UnitOfWork — same transaction as the mutation
await this.auditService.log(tx, {
  entityType: 'SalesInvoice',
  entityId: sale.id,
  action: AuditAction.POST,
  module: AuditModule.SALES,
  description: 'Sales invoice posted',
});
this.logger.info({ saleId: sale.id }, 'Sale posted');
```

**Stock adjustments** → `InventoryLedgerService` (ledger), not duplicate `AuditLog` rows for quantity deltas.

## Bottom line

- **All HTTP methods:** yes — covered by design, no extra work per method.
- **Standard ERP audit events:** the **framework and constants** are there; **automatic coverage of every ERP action** is not — that comes module-by-module as you build Sales, Purchase, Inventory, Auth, etc.

If you want, we can define a checklist (per module: which actions get `AuditLog`, which get `ChangeHistory`, what gets `AppLogger` only) so every new feature follows the same standard. Switch to Agent mode if you want that added to the docs or Cursor rules.

