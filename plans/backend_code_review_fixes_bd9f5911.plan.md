---
name: Backend code review fixes
overview: Remediate the issues found across the NestJS backend (auth, party, persistence/common, reporting, settings, audit) in severity-ordered phases, starting with cross-cutting BigInt serialization and Prisma error-mapping fixes that remove entire classes of 500 errors, then module-specific security, correctness, and validation fixes.
todos:
  - id: phase0
    content: "Cross-cutting: BigInt/Decimal JSON serialization in response interceptor + exception filter; map P2002/P2025 in prisma-error.mapper; log 4xx ApplicationExceptions"
    status: in_progress
  - id: phase1
    content: "Auth security: JWT secret/algorithm, hash refresh tokens, branch authorization, persist session branch, active-role permissions, lockout/password checks, atomic refresh rotation, rate limiting, auth audit logging"
    status: pending
  - id: phase2
    content: "Persistence: full BigInt ID sync, atomic outbox seq + idempotent operationId, inventory concurrency/reserved qty, DAILY reset, robust UoW retry, prod tenant/deviceId context, config-driven DB path + shutdown hooks, pipe/log hardening"
    status: pending
  - id: phase3
    content: "Party: soft-delete recreation, PartyRole enforcement, unique-code pre-checks, delete version DTO, child-guard on party delete, list party filters, isPrimary/isDefault, safe BigInt transforms, decimal/contact validation, util cleanup"
    status: pending
  - id: phase4
    content: "Reporting: CSV/XLSX formula-injection sanitization, full-dataset export semantics + consistent totals, date filters, branch/ctx threading, PDF/XLSX/filename hardening"
    status: pending
  - id: phase5
    content: "Settings & audit: JSON-safe DTOs, dataType validation, UoW+version+audit on update, dedupe/cache/getter fixes, audit input validation + tenant columns"
    status: pending
  - id: phase6
    content: "Low-severity polish: dead code, DTO validations, guard semantics, trust proxy, query select optimizations, naming/edge cases"
    status: pending
  - id: validate
    content: Per-phase lint, targeted unit/persistence tests, new spec coverage, and migrations + db:reset for schema changes
    status: pending
isProject: false
---

# Backend Code Review Remediation Plan

Full remediation of all findings from the module reviews (auth, party, persistence/common, reporting, settings, audit). Phases are ordered so cross-cutting fixes land first (they resolve many downstream symptoms), then Critical/High, then Medium, then Low.

Note: this overrides the additive-only change policy in `.cursor/rules/00-project-context.mdc` for the specific files listed, since you approved fixing pre-existing issues. Preserve CRLF/LF and keep diffs minimal. Run `npm run lint` and relevant tests after each phase.

## Phase 0 — Cross-cutting foundations (do first)

These remove whole classes of failures.

- **BigInt/Decimal JSON serialization** (Critical). No global serializer exists (`[backend/src/main.ts](backend/src/main.ts)` has none). Add a shared `serializeForJson(value)` helper (reuse logic from `[backend/src/party/utils/party.util.ts](backend/src/party/utils/party.util.ts)` `serializeBigInt` and `log-sanitizer`'s `safeSerializeValue`). Apply it in:
  - `[backend/src/common/interceptors/response.interceptor.ts](backend/src/common/interceptors/response.interceptor.ts)` for `data`/paginated `data`.
  - `[backend/src/common/exceptions/global-exception.filter.ts](backend/src/common/exceptions/global-exception.filter.ts)` for `error.details`.
  - Simplest robust option: also register a global replacer / `BigInt.prototype.toJSON` in `main.ts` as defense-in-depth. Choose one primary approach (interceptor+filter) and document it.
- **Prisma error mapping** (Critical/High). Extend `[backend/src/persistence/prisma/prisma-error.mapper.ts](backend/src/persistence/prisma/prisma-error.mapper.ts)` to map `P2002` -> `CONFLICT` and `P2025` -> `NOT_FOUND`, and ensure `GlobalExceptionFilter` calls the mapper for raw `PrismaClientKnownRequestError` (currently falls through to 500).
- **Log ApplicationExceptions**: add `warn`-level logging (with correlation id, no secrets) for 4xx business/security codes in `GlobalExceptionFilter`.

## Phase 1 — Auth security (Critical/High)

File: `[backend/src/auth/auth.service.ts](backend/src/auth/auth.service.ts)`, `[backend/src/auth/constants/auth.constants.ts](backend/src/auth/constants/auth.constants.ts)`, `[backend/src/auth/jwt.strategy.ts](backend/src/auth/jwt.strategy.ts)`.

- Remove hardcoded default `JWT_SECRET`; fail fast on startup if unset in production. Move to `JwtModule.registerAsync()` + `ConfigService`. Pin `algorithms: ['HS256']` in strategy and module.
- Hash refresh tokens at rest (store `sha256(refreshToken)`, compare on refresh; return raw token once).
- Enforce user->branch authorization in `resolveTenantScope` (reject branches the user is not assigned to) instead of accepting any valid `branchId`.
- Persist `companyId`/`branchId` on `UserSession` at login and reuse on refresh (fixes silent head-office reset and the `1n` fallback). Requires a Prisma schema/migration addition.
- Load permissions only for **active** roles (bug: `rolePermission` query uses all `roleIds`). Reload roles/permissions from DB in `validateSession` (or add `permissionsVersion`) so revocations take effect.
- Enforce `lockedUntil` on refresh; reject sessions older than `user.passwordChangedAt`; honor `mustChangePassword`.
- Make refresh rotation atomic (compare-and-swap `updateMany` on old token; invalidate session on reuse). Use atomic `increment` for `failedLoginAttempts`. Wrap login writes in a transaction.
- Guard `BigInt()` conversions of JWT claims (try/catch -> 401 instead of 500).
- Add rate limiting (`@nestjs/throttler`) on `/auth/login` and `/auth/refresh`.
- Unify invalid-credentials vs locked responses to prevent user enumeration.
- Audit-log auth events (login success/failure, lockout, logout, refresh) via `AuditService`.

## Phase 2 — Persistence & data integrity (Critical/High/Medium)

- **ID sync gap** `[backend/src/persistence/prisma/sync-prisma-id-sequence.ts](backend/src/persistence/prisma/sync-prisma-id-sequence.ts)`: cover all BigInt-PK tables (registry or introspection) so `nextBigIntId()` cannot collide. Extend `prisma-client.factory` hook to `createMany`.
- **Outbox** `[backend/src/persistence/outbox/outbox.service.ts](backend/src/persistence/outbox/outbox.service.ts)`: make `sequenceNo` allocation atomic + add `@@unique([deviceId, sequenceNo])`; make `operationId` deterministic for idempotency; validate `branchId` against context.
- **Inventory** `[backend/src/persistence/inventory/inventory-ledger.service.ts](backend/src/persistence/inventory/inventory-ledger.service.ts)`: handle concurrent first-`IN` `P2002` with retry/upsert; account for `reservedQuantity` on `OUT`; validate `medicineId` matches batch; use `ENTITY_VERSION_CONFLICT` (not `SEQUENCE_CONFLICT`) for stock conflicts.
- **Sequence** `[backend/src/persistence/sequence/sequence-generator.service.ts](backend/src/persistence/sequence/sequence-generator.service.ts)`: implement missing `ResetPolicy.DAILY` case.
- **UnitOfWork** `[backend/src/persistence/unit-of-work/unit-of-work.service.ts](backend/src/persistence/unit-of-work/unit-of-work.service.ts)`: replace fragile message-substring retry detection with a typed `retryable` flag / error-code set; add configurable retries with jittered backoff.
- **Request/tenant context**: `request-context.service.ts` should not silently fall back to `desktop-dev-001` for `deviceId` in prod; `correlation.middleware.ts` should not default tenant to `1` in prod; `getRequestContext()` should throw `ApplicationException`; re-run ALS with merged context instead of in-place mutation in `context-enrich.interceptor.ts`.
- **PrismaService**/factory: read DB path from `ConfigService`/`DATABASE_URL` instead of hardcoded `process.cwd()` path; enable `app.enableShutdownHooks()` in `main.ts`.
- **Pipes/logging**: bound `ParseBigIntPipe` input length; make `log-sanitizer` key matching case-insensitive/substring (`password`, `token`, `secret`, `authorization`, `pin`, `apiKey`); strip query strings/PII in `logging.interceptor.ts`.

## Phase 3 — Party module correctness (Critical/High/Medium)

Files under `[backend/src/party/](backend/src/party)`.

- Handle soft-deleted rows blocking recreation: detect by unique key and restore/update in-transaction, and rely on `P2002` mapping (Phase 0) as backstop. Applies to customer/supplier/doctor/employee/party-role/party-contact create paths.
- Enforce required `PartyRole` before/with detail creation (customer/supplier/doctor/employee) per architecture docs; coordinate role<->detail consistency.
- Pre-check globally-unique business codes (`customerCode`, `supplierCode`, `gstin`, `doctorCode`, `registrationNumber`, `employeeCode`) before insert.
- Validate delete `version` query param via a DTO (`@Type(() => Number) @IsInt() @Min(1)`) instead of raw `Number(version)` -> `NaN`.
- Guard party soft-delete against active children (reject or cascade).
- Add `party: { deletedAt: null }` to detail list/search `where` clauses.
- Enforce single `isPrimary` contact / `isDefault` address per type via in-transaction `updateMany`.
- Safe BigInt `@Transform` in address DTOs (validate string before `BigInt()`); validate geographic IDs (or add FK relations).
- Validate decimal fields (`creditLimit >= 0`, `consultationFee`, `salary`) and contact formats (email/phone by type); lowercase emails on write.
- Fix `optimisticUpdate` unused `notFoundCode` param in `[backend/src/party/utils/party.util.ts](backend/src/party/utils/party.util.ts)`; add specific `ErrorCode`s for detail conflicts; align `updatedBy`/`deletedBy` audit attribution across services.

## Phase 4 — Reporting (High/Medium/Low)

Files under `[backend/src/reporting/](backend/src/reporting)`.

- **Formula/CSV injection**: add `sanitizeExportCell()` that prefixes leading `= + - @ \t \r` with `'`; apply in `report.util.ts` (CSV) and `xlsx.exporter.ts` (or force string cell type).
- **Export semantics**: for non-JSON formats, export the full dataset (with a safe cap) or require `exportAll=true`; make totals consistent with exported rows.
- Write totals to CSV export (currently dropped); apply `fromDate`/`toDate` filter in `customer-outstanding` (or reject date params there); make `toDate` end-of-day inclusive.
- Pass effective `branchId` (scope fallback) to exporters; thread `ReportContext` (`ctx`) through `run*` methods; use `bigint` for `branchId` in DTO/params.
- PDF page breaks + export row cap; sanitize/truncate XLSX worksheet name; RFC 5987-encode `Content-Disposition` filename; quote CR-only CSV cells; lazy-init pdfmake fonts.

## Phase 5 — Settings & audit (High/Medium/Low)

Files: `[backend/src/settings/settings.service.ts](backend/src/settings/settings.service.ts)`, `[backend/src/settings/settings.controller.ts](backend/src/settings/settings.controller.ts)`, `[backend/src/audit/audit.service.ts](backend/src/audit/audit.service.ts)`.

- Map `listByCategory`/`updateSetting` responses to JSON-safe DTOs (stringify `bigint`) — also covered by Phase 0 but map explicitly.
- Validate `settingValue` against `dataType` on update; wrap `updateSetting` in `UnitOfWork` + optimistic `version` check + `AuditService.log`.
- Dedupe `listByCategory` by `settingKey` (branch over company); fix cross-branch cache invalidation; fix `getString` empty-string handling; broaden `getBoolean`; wrap `coerceValue` JSON/number parsing with validation; add `category` query DTO validation.
- Audit: validate `entityType`/`action`/`module` at runtime; add `companyId`/`branchId` columns populated from context (schema migration); warn when critical context is missing.

## Phase 6 — Low-severity polish

- Remove dead `sessionToken`; derive expiry from `REFRESH_TOKEN_EXPIRY`; clarify `PermissionsGuard` AND/OR semantics; validate `deviceType`/password min-length in login DTO; replace redundant controller auth checks with a `@CurrentUser()` decorator; configure Express `trust proxy`.
- Reduce post-update extra `findFirstOrThrow` round-trips; `select` only needed fields in report queries; remaining naming/edge-case items (`formatDocumentNumber` global replace, `isRequestContextPopulated` naming, sequence reset start number).

## Validation per phase

- Run `npm run lint` on touched files.
- Run targeted tests: `npm run test -- --testPathPatterns=auth|party|settings|reporting` and `npm run test:persistence`.
- Add/extend spec coverage for each fixed behavior (BigInt serialization, P2002/P2025 mapping, refresh rotation, export sanitization, settings dataType validation).
- Any Prisma schema change (UserSession branch fields, outbox unique index, audit tenant columns) requires a migration + `npm run db:reset` verification.