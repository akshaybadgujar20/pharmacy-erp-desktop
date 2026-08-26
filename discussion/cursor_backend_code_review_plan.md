# Backend code review plan
_Exported on 8/26/2026 at 13:21:36 GMT+5:30 from Cursor (3.17.8)_

---

**User**

@backend/src reivew all the code and find issue and create a plan to fix those issues

---

**Cursor**

I'll review the backend code thoroughly. Let me start by exploring the structure and then dig into the code.

This is a large codebase (133 files). Let me launch parallel exploration agents to review different modules thoroughly for issues.

The reviews are comprehensive. Let me verify a few of the most critical findings before building the plan, since these agents can occasionally misread code.

Let me check whether there's a global BigInt serialization patch anywhere, which determines if the "BigInt breaks JSON" findings are real.

I've completed a thorough review across all modules and verified the most critical findings against the actual code. A few confirmations:

- There is **no** global `BigInt.prototype.toJSON` patch in `main.ts` or anywhere, so the BigInt-serialization findings are real: any endpoint returning raw Prisma entities with `bigint` fields (e.g. `GET /settings`, `PUT /settings/:key`) will throw `TypeError: Do not know how to serialize a BigInt` and return a 500. The party module dodges this via mappers, but settings and error `details` do not.
- The default JWT secret, refresh-token branch reset, and inactive-role permission leak in auth are all confirmed real.

The review surfaced 100+ findings across auth, party, persistence/common, reporting, settings, and audit. Before I write the remediation plan, one scoping decision drives its size significantly.

> **How much of the review do you want the remediation plan to cover?**
> - Critical + High severity only (correctness/security bugs that cause 500s, auth bypass, data corruption) (Recommended)
> - Critical + High + Medium (adds validation gaps, error-mapping, logging/security hardening)
> - Everything, including Low severity (naming, edge cases, cosmetic) ✔
> - Only the security-related issues (auth, injection, tenant isolation, secret handling)

Understood — full coverage including Low severity. I'll organize the 100+ findings into prioritized phases, starting with cross-cutting fixes that eliminate whole classes of 500s, then per-module work. Let me write the plan.

---

**User**

Backend Code Review Remediation Plan

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

**Cursor**

I'll start with Phase 0 — the cross-cutting foundations that fix whole classes of 500 errors across the backend.


Implementing Phase 0: creating the shared serializer and updating the interceptor, exception filter, and Prisma error mapper.


Phase 0 is in place. Moving on to Phase 1 — auth security.


Implementing Phase 1: schema changes, auth utilities, and the auth service rewrite.


The plan includes a schema reset for dev SQLite. Proceeding with `db:reset` using your implementation consent.


Implementing Phase 2 persistence fixes in batch.


All tests pass. Marking the remaining todos complete.


The full remediation plan is implemented. Summary by phase:

### Phase 0 — Cross-cutting
- Added `serializeForJson()` and applied it in `ResponseInterceptor` and `GlobalExceptionFilter`
- Mapped Prisma `P2025` → `NOT_FOUND` (with existing `P2002` handling)
- Added warn-level logging for 4xx `ApplicationException`s with correlation ID

### Phase 1 — Auth security
- JWT secret via `ConfigService` (required in production); `HS256` pinned
- Refresh tokens hashed at rest (SHA-256); atomic rotation with reuse detection
- `UserBranch` model + seed data for branch authorization
- `companyId`/`branchId` persisted on `UserSession` and reused on refresh
- Permissions loaded only from active roles; reloaded from DB in `validateSession`
- Lockout, `passwordChangedAt`, and `mustChangePassword` enforced
- Rate limiting via `@nestjs/throttler` on auth endpoints
- Auth events audit-logged; login DTO validation hardened

### Phase 2 — Persistence
- Full BigInt ID sync via SQLite table introspection
- Outbox: deterministic `operationId`, atomic `sequenceNo` with `@@unique([deviceId, sequenceNo])`
- Inventory: reserved-quantity checks, batch/medicine validation, concurrent-create handling
- `ResetPolicy.DAILY` implemented; UoW retry with backoff + `retryable` flag
- Production tenant/device context fixes; `ConfigService` DB path; shutdown hooks + trust proxy

### Phase 3 — Party
- Soft-delete restore, `PartyRole` enforcement, unique-code pre-checks
- `DeleteEntityQueryDto` on all delete endpoints
- Party delete child-guard; list filters for deleted parties
- `isPrimary`/`isDefault` enforcement; contact/address validation; safe BigInt transforms

### Phase 4 — Reporting
- CSV/XLSX formula-injection sanitization
- Full-dataset exports (10k cap); consistent totals; end-of-day `toDate`
- `ReportContext` threading; PDF/XLSX/filename hardening

### Phase 5 — Settings & audit
- JSON-safe setting DTOs; `dataType` validation on update
- UoW + optimistic version + audit on settings updates
- Cache/dedupe/getter fixes; audit input validation + `companyId`/`branchId` columns

### Phase 6 — Polish
- `@CurrentUser()` decorator; `PermissionsGuard` AND semantics
- Global `formatDocumentNumber` replace; correlation middleware fixes

### Validation
- `npm run lint` — clean
- `npm run test` — **60/60** unit tests passing
- `npm run test:persistence` — **6/6** integration tests passing
- Schema pushed (UserSession, UserBranch, Outbox unique, AuditLog tenant columns); DB reseeded

**Note:** Set `JWT_SECRET` in production. Existing refresh tokens are invalid after the hashing change — users must log in again.

