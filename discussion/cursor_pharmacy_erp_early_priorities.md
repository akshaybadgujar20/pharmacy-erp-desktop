# Pharmacy ERP early priorities
_Exported on 8/25/2026 at 22:40:00 GMT+5:30 from Cursor (3.17.8)_

---

**User**

@docs/pharmacy_erp_architecture_handbook.md anything we can should plan and implement early  from this for @backend or @src ?

---

**Cursor**

I'll read the architecture handbook and check the current state of the backend and src to give you grounded recommendations.

The handbook is large. Let me read it in full, plus get a quick view of the current backend/src structure.

Let me check what foundational pieces already exist versus what's still missing, so my recommendations are grounded.

Let me look at the Angular frontend state and the recent plan file to understand what's already scaffolded.

Let me check whether any feature modules exist yet, and how Electron/Angular currently talk to the backend.

I've now got a clear picture of where things stand. Here's my assessment and what's worth pulling forward.

## Where you are today

Your **foundation is unusually mature**, but you have essentially no *feature* code yet:

- **Backend infra (done):** persistence layer (`UnitOfWork`, `Outbox`, `Sequence`, `InventoryLedger`, `RequestContext`), audit module, structured logging + correlation middleware, `GlobalExceptionFilter` + `ErrorCode` + `ApplicationException`, `ResponseInterceptor` envelope, and a comprehensive Prisma schema (74 models across sales, purchase, inventory, party, financial, pricing, security, sync, config, etc.).
- **Backend features (missing):** only `app.controller.ts` — no sales/inventory/auth modules.
- **Angular (`src/`):** just a `dashboard` + `grid` component, flat routing, `ngx-toastr`. No core/shared structure, no API/data layer, no auth.
- **Electron:** minimal — loads `localhost:4200`, preload only exposes `ping`. Angular presumably talks to Nest over HTTP:3000.

So the question is really: *of the 41 handbook sections, which are cross-cutting foundations that are cheap now but painful to retrofit once feature modules multiply?* That's where to invest early.

## Implement / lock down early (cheap now, expensive later)

These are the retrofit-risk items — every future feature depends on them:

**1. Auth + RBAC (§11, §29) — highest priority.**
Schema already has `user`, `role`, `permission`, `role-permission`, `user-role`, `user-session`. There's no `AuthModule`, no `JwtAuthGuard`, no `RolesGuard`. "Permissions checked in backend, never only UI" is impossible to bolt onto 15 controllers later without touching all of them. Scaffold `AuthModule` + guards now, before feature controllers exist.

**2. RequestContext population (ties to auth).**
`RequestContextService` exists and `OutboxService`/`SequenceGenerator` *need* `companyId`, `branchId`, `userId`, `deviceId` — but **nothing populates it per request today**. You need a guard/interceptor that reads the JWT + local device/branch config and calls `requestContext.run(...)`. Until this exists, every write flow you build will hardcode context or break outbox ordering.

**3. Transport decision: Electron IPC vs HTTP (§6).**
Right now preload exposes only `ping` and Angular likely hits HTTP:3000 directly — which contradicts the handbook's "never expose Node, use `contextBridge`" and CSP goals. Decide *now* whether the data path is HTTP-to-localhost-Nest or IPC-bridged, then build a single Angular `ApiService`/data-access layer against it. Changing this after 10 feature services exist is a massive rewrite.

**4. Angular core/shared skeleton + HTTP interceptor (§7).**
Your backend already returns `{success, data}` / `{success, error}`. Angular needs a matching interceptor to unwrap it, surface errors via toastr, and attach the auth token — plus the `core/` / `shared/` / feature-module folder convention. Establishing this before feature screens is far cheaper than refactoring later.

**5. Config-driven values (§20).**
Schema has `app-setting`, `tax`, `barcode-configuration`, `printer-configuration`. Establish a `SettingsService`/config-read pattern *before* the first feature so GST rates, templates, and printer maps are never hardcoded. This is the classic "un-hardcode later" trap.

**6. Outbox/sync contract & versioning (§13) — decide the shape, defer the worker.**
The outbox enqueue service exists but there's no drain worker, no Spring Boot contract, no conflict resolution. You don't need the worker yet, but every feature you build now will write outbox payloads and (per §13) needs `version`/timestamp columns for conflict detection. Lock the **payload envelope, `operationId` idempotency, and version-column convention now**; build the worker later.

**7. Multi-store branch scoping (§36).**
Handbook: "Keep branch identifiers in core models from the beginning" — schema already does. What's missing is the *enforcement convention*: a query-scoping helper so every read/write filters by `branchId` from context. Codify this before feature repos proliferate.

**8. Localization scaffolding (§38) & keyboard-shortcut registry (§18).**
Both are cheap-now/expensive-later. "Never hardcode display text" is trivial with Angular i18n set up on day one, brutal to retrofit across dozens of components. A global keyboard-shortcut service (F2/F4/F8/etc.) is similarly a small core service that's painful to standardize after screens exist.

## Safe to defer

- **Telemetry/analytics (§34), feature flags (§35)** — additive, no schema lock-in.
- **Backup/recovery & disaster recovery (§28, §39)** — operational; needs a documented Prisma migration workflow but the scheduler can wait.
- **Reporting, printing, barcode hardware, migration wizard (§22–25, §37)** — real features, build when their domain lands. Just keep them behind the `PrinterService`/`BarcodeScannerService` interfaces the handbook mentions (§22).
- **Event-driven architecture (§14)** — nice, but don't over-abstract early (respects §2 "avoid unnecessary abstraction"); the outbox already covers reliable cross-boundary delivery.

## Suggested first slice

If you want a concrete starting order: **Auth + RBAC guards → RequestContext population → Angular ApiService + HTTP interceptor + core/shared structure → transport (IPC vs HTTP) decision → SettingsService**. That set unblocks every feature module and is the expensive-to-retrofit core. Then build your first real vertical (Sales or Inventory) as the reference implementation that exercises the whole stack.

Want me to turn any of these into a detailed implementation plan (I'm in Ask mode, so I can spec it out but not edit)? I'd suggest starting with the Auth + RequestContext piece since almost everything else depends on it.

---

**User**

can we plan to implement these ?

---

**Cursor**

This is a large surface, so let me narrow scope before I write a plan. Two decisions drive everything else:

> **How much do you want this first plan to cover?**
> - Just the foundational "first slice": Auth + RBAC guards, RequestContext population, Angular ApiService + HTTP interceptor + core/shared structure, and SettingsService (Recommended)
> - Backend-only foundations for now: Auth + RBAC, RequestContext population, SettingsService, outbox contract/versioning conventions
> - All "implement early" items in one plan (auth, context, transport, Angular layer, settings, outbox contract, branch scoping, i18n, keyboard registry) ✔

> **How should Angular talk to the NestJS backend? (This shapes the Angular data layer and Electron preload.)**
> - Keep HTTP to localhost:3000 (Nest as a local HTTP server) (Recommended - matches current setup) ✔
> - Route through Electron IPC / contextBridge (no direct HTTP from renderer, per handbook §6/§29)
> - Not sure - evaluate both and recommend one in the plan

Both answers noted: full early set, HTTP transport. Let me research the specifics so the plan is accurate. I'll explore backend auth/context/settings/outbox and the Angular/Electron side in parallel.

`CorrelationMiddleware` already populates context from `x-*` headers with env fallbacks — so auth needs to become the trusted source instead of headers. Let me check the security schema, settings/outbox tables, and the Angular/Electron side.

The schema is well-designed for this: `version` columns everywhere, `uuid`, soft deletes, `branchId`/`companyId` scoping, and `Outbox` already has `payloadVersion`, `operationId`, and `sequenceNo`. Now the Angular/Electron side and the outbox service signature.

No Angular services exist yet, and the dashboard has no HTTP calls. Let me confirm the Angular/Electron dependencies and structure.

I now have everything I need. Key findings that shape the plan:

- Backend has **no auth deps** yet (`@nestjs/jwt`, `passport`, `bcrypt` all missing), but the schema is fully ready: `User` has `passwordHash`/`failedLoginAttempts`/`lockedUntil`/`mustChangePassword`, `UserSession` has `sessionToken`/`refreshToken`/`expiresAt`, and `Permission` uses `module`/`resource`/`action`. `ErrorCode` already has `UNAUTHORIZED`/`FORBIDDEN`.
- `CorrelationMiddleware` already populates `RequestContext` from `x-*` headers with env fallbacks — so the auth work is to make the JWT the *trusted* source of `userId`/`companyId`/`branchId` instead of trusting headers.
- The **Outbox contract is essentially already built** (`payloadVersion`, `operationId`, `sequenceNo` all present) — so that item is mostly conventions/docs, not new infra.
- `AppSetting` is ready for config-driven values (`companyId`/`branchId` scoping, `dataType`, `category`, `isEncrypted`).
- Angular 21 standalone, `@angular/common` present but **no `provideHttpClient`, no interceptor, no ApiService, no i18n** — the data/auth layer is greenfield. `helmet` is a backend dep but not enabled in `main.ts`.

A few decisions have real forks (i18n library, password hashing, token storage). I'll bake in recommended defaults and you can adjust them on the plan confirmation screen. Here's the plan.

---

**User**

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

**Cursor**

I'll implement the full early foundations plan, starting with backend auth dependencies and working through each todo.


Creating the backend auth module and related infrastructure files.


Backend builds. Creating the Angular core layer, Electron IPC, and related frontend files.


Creating backend and Angular tests.


All early-foundation todos are complete. Here’s what was implemented:

## Backend (`backend/`)

**Auth + RBAC**
- `AuthModule` with login / refresh / logout / me
- JWT + `UserSession` validation, bcrypt passwords, account lockout
- Global `JwtAuthGuard` + `@Public()`, `PermissionsGuard` + `@RequirePermissions()`
- Auth error codes in `error-code.ts`

**Request context**
- `ContextEnrichInterceptor` fills `userId` / `companyId` / `branchId` / `sessionId` from JWT after auth
- `CorrelationMiddleware` uses header identity only in dev; production relies on env defaults until JWT enriches

**Settings (§20)**
- `SettingsModule` with branch → company fallback, typed getters, cache
- `GET /settings`, `PUT /settings/:key` (permission-gated)

**Conventions**
- `tenant-scope.util.ts` + prisma-persistence-rules update
- `entity-type.constants.ts`, `outbox-payload.types.ts` with versioning envelope

**Security**
- `helmet` + CORS for `http://localhost:4200` in `main.ts`

**Seed**
- Real bcrypt hash for all users: **`admin123`**
- New `CONFIGURATION:APP_SETTING:READ/UPDATE` permissions for admin

## Angular (`src/app/`)

- `core/` — `ApiService`, `AuthService`, token/device storage, envelope unwrap
- HTTP interceptors — Bearer + `x-device-id`, error/toastr + 401 handling
- Login feature, `authGuard`, protected dashboard route
- `@ngx-translate` v18 (`provideTranslateService`), `public/i18n/en.json`, `en-IN` locale
- `KeyboardShortcutService` + help overlay (F1/?, F2/F4/F8/Ctrl+S/Esc placeholders)

## Electron

- IPC: `getDeviceInfo()`, `secureStore` via `safeStorage` (in-memory fallback in `ng serve`)

## Tests

- Backend unit: auth, permissions guard, settings
- Backend e2e: `test/auth.e2e-spec.ts` (all passing)
- Angular: `api.service.spec.ts`, `auth.service.spec.ts` (passing)

## How to run

```bash
# Backend
cd backend
npm run start:dev

# Angular
npm start

# Login (after seed or any time — e2e resets password hash)
# username: admin  password: admin123
```

For a clean DB with new permissions:

```bash
cd backend && npm run db:seed:fresh
```

**Note:** Angular production build may still fail on bundle size budgets (pre-existing ag-grid/chart weight); dev compile is fine. Run backend + Angular separately for local dev (`npm start` + `npm run start:dev` in `backend/`).

---

**User**

add about then and esrly configs and recomendde stting ainto docs

---

**Cursor**

I'll find where docs live and what early-foundation configs exist, then add a doc covering them and recommended settings.


Creating the early-foundations doc and linking it from the architecture docs and AGENTS.md.


Added documentation for the early foundations work, environment config, and recommended settings. Here’s what was created and linked:

## New primary doc

[`docs/pharmacy_erp_architecture_docs/architecture/engineering/early-foundations.md`](docs/pharmacy_erp_architecture_docs/architecture/engineering/early-foundations.md)

Covers:

- Architecture diagram (Electron → Angular → Nest → context/auth)
- **Local dev commands** and demo login (`admin` / `admin123`)
- **Environment variables** (`JWT_SECRET`, `DEVICE_ID`, `COMPANY_ID`, `BRANCH_ID`, `PORT`, `LOG_*`) with production recommendations
- **Auth config** (token TTL, lockout, endpoints, JWT claims, RBAC format)
- **Request context** (JWT as trusted identity in production; dev headers)
- **Security** (helmet, CORS, Electron isolation)
- **AppSetting / SettingsService** — canonical `SettingKey` constants + full **seeded settings table** with defaults
- Angular core layer, Electron IPC, outbox contract, keyboard shortcuts
- Test commands

## Cross-links updated

| File | Change |
|------|--------|
| `backend/AGENTS.md` | Link to early foundations |
| `.cursor/rules/00-project-context.mdc` | Architecture references |
| `architecture/security/authentication.md` | Points to implemented auth |
| `architecture/configuration-driven.md` | Points to `SettingsService` + keys |
| `architecture/logging-and-audit.md` | JWT vs dev headers; related doc link |
| `database/tables/configuration/64_app_setting.md` | `SettingsService` runtime access |
| `architecture/engineering/engineering-checklist.md` | Platform setup reference |

Start with **early-foundations.md** for env vars, demo credentials, and which `AppSetting` keys to use instead of hardcoding.

---

**User**

@docs/pharmacy_erp_architecture_docs/architecture can you optimise this ? this looks too much from signle person perspective, we can merge adn redecue if neeeded as per need right

---

**Cursor**

I'll explore the architecture docs folder structure to understand what's there before proposing a consolidation plan.

Let me sample the content and sizes of these files to gauge the fragmentation.

Most files are thin, one-section verbatim extracts of the handbook. Let me confirm which are substantive vs stubs, and check the knowledge-base README link integrity.

The picture is clear. This folder is ~40 files, and the large majority are thin, verbatim one-section extracts of the handbook (each tagged `> Source: Original Architecture Handbook`). A few are substantive (`logging-and-audit.md`, `engineering/early-foundations.md`, `multi-store.md`). Also notable: the knowledge-base `README.md` links to flat filenames (`vision.md`, `design-principles.md`, etc.) but the files actually live in subfolders — so that index is already largely broken. Let me check the full handbook duplication and inbound links before proposing scope.

I have a clear picture now. Key facts:

- The `architecture/` folder holds ~40 files; the large majority are thin, verbatim one-section extracts of the handbook (each tagged `> Source: Original Architecture Handbook`, often 10-20 lines).
- The complete handbook already exists as a single file at `docs/pharmacy_erp_architecture_handbook.md`, so most split files are effectively a fragmented duplicate.
- Only a few docs are substantive/implementation-backed: `logging-and-audit.md`, `engineering/early-foundations.md`, `multi-store.md` (and the framework skeletons `nestjs/angular/electron-architecture.md`).
- The knowledge-base `README.md` index is already broken — it links to flat filenames (`vision.md`, `prisma.md`, `database-design.md`, `migration.md`, etc.) that either live in subfolders or don't exist.
- Inbound links are limited: `backend/AGENTS.md`, `.cursor/rules/00-project-context.mdc`, and a couple of `database/` docs — manageable to update.

Before I write the plan, two scoping decisions materially change the approach.

> **How aggressively should I consolidate the ~40 architecture files?**
> - Aggressive (Recommended): collapse the ~35 thin handbook stubs into ~6-8 consolidated topic docs (e.g. Overview & Principles, Frontend/Desktop, Backend & API, Product & UX, Integrations, Sync & Multi-store, Engineering Standards), keeping only implementation-backed docs standalone (early-foundations, logging-and-audit). Result ~10 files. ✔
> - Moderate: merge only within each existing subfolder (engineering/*, guidelines/*, integrations/*, sync/*, security/*) into one file per folder; leave root-level files as-is. Result ~15 files.
> - Minimal: keep the structure, just fix the broken README index and merge only the tiniest 1-paragraph stubs.

> **Since the full handbook already exists as one file, how should the thin verbatim stubs be handled?**
> - Consolidate into topic docs that stay the source of truth; treat the monolithic handbook as legacy/archive (Recommended). ✔
> - Delete the thin duplicated stubs entirely and point readers to the single handbook, keeping only enriched/implemented docs.
> - Keep everything; only reorganize/merge, don't remove any content.

Aggressive consolidation with topic docs as the source of truth. Let me read the remaining files so the grouping in the plan is accurate.

I've now reviewed the entire folder. Here's what I found and the consolidation plan.

**Current state**: `architecture/` has ~40 files. ~34 are thin, verbatim one-section handbook extracts (each tagged `> Source: Original Architecture Handbook`, typically 10-20 lines). Only three are real, implementation-backed docs: `logging-and-audit.md`, `engineering/early-foundations.md`, and `multi-store.md`. The full handbook already exists as a single file at `docs/pharmacy_erp_architecture_handbook.md`. The knowledge-base `README.md` index is already broken (links to flat names and non-existent files).

Let me present the plan.

---

**User**

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

**Cursor**

I'll consolidate the architecture docs per the plan — starting with the merged topic docs, then moving the implementation-backed files and fixing inbound links.


Creating the consolidated topic docs from the merged stub content.


Deleting merged stub files and updating inbound links.


Architecture docs are consolidated from ~40 fragmented files down to 13 files.

### New structure (`docs/pharmacy_erp_architecture_docs/architecture/`)

| File | Purpose |
|------|---------|
| `README.md` | Entry index |
| `overview.md` | Vision, diagram, stack, principles, DDD, events |
| `application-architecture.md` | Angular, Electron, NestJS, REST |
| `product-ux.md` | UX, keyboard-first, workflows |
| `data-and-sync.md` | Offline-first, sync, multi-store |
| `integrations.md` | Hardware, printing, barcode, reporting |
| `security.md` | Hardening + auth summary |
| `engineering-standards.md` | Coding, testing, CI/CD, release checklist |
| `early-foundations.md` | Moved up from `engineering/` (implementation detail) |
| `logging-and-audit.md` | Kept as-is (implementation detail) |
| `adrs/`, `templates/` | Unchanged |

### Removed
~35 thin handbook stubs and the empty `engineering/`, `guidelines/`, `integrations/`, `security/`, and `sync/` folders.

### Updated inbound links
- `backend/AGENTS.md`
- `.cursor/rules/00-project-context.mdc`
- `database/tables/configuration/64_app_setting.md`
- `docs/pharmacy_erp_architecture_docs/README.md` (rewritten)
- `docs/pharmacy_erp_architecture_handbook.md` (archived with pointer to `architecture/README.md`)

Start at [architecture/README.md](docs/pharmacy_erp_architecture_docs/architecture/README.md) for navigation.

---

**User**

@docs/pharmacy_erp_architecture_docs/database/tables/party_management/party_management.md similar to this add document in each db folders foreach category . create a plan for the same@docs/pharmacy_erp_architecture_docs/database/tables 

---

**Cursor**

I'll research the example document and the structure of the database tables folders before creating a plan.

Let me see the remaining files, check which folders already have an overview doc, and read the existing catalog and another overview example.

Let me verify the remaining folders' exact files (purchase, pricing, loyalty, prescription) to confirm table numbers like `36_purchase_return` and `47_price_list`.

I have everything I need. There are 14 category folders under `docs/pharmacy_erp_architecture_docs/database/tables`; `party_management/party_management.md` is the rich template and `audit/audit.md` exists only as a bare stub. The other 12 folders have no overview doc. The `table_catalog.md` already contains Purpose/Usage text for every table, which is the source material for these overviews.

Here's my plan.

---

**User**

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

**Cursor**

I'll add per-category overview docs following the `party_management.md` template — starting with user/security and medicine master, then the remaining categories.


All 13 category overview docs are in place, following the `party_management.md` template.

### Created (12 new)
| Folder | File | Tables |
|--------|------|--------|
| `user_and_security/` | `user_and_security.md` | 09–14 |
| `medicine_master/` | `medicine_master.md` | 15–22 |
| `inventory/` | `inventory.md` | 23–29, 71, 72 |
| `purchase/` | `purchase.md` | 30–37 |
| `sales/` | `sales.md` | 38–42 |
| `financial/` | `financial.md` | 43–46 |
| `pricing/` | `pricing.md` | 47–50 |
| `loyalty/` | `loyalty.md` | 51–52 |
| `prescription/` | `prescription.md` | 53–54 |
| `synchronization/` | `synchronization.md` | 55–57 |
| `configuration/` | `configuration.md` | 60–66 |
| `masters/` | `masters.md` | 67–70 |

### Upgraded (1)
- `audit/audit.md` — expanded from a bare link stub to the full template

Each doc includes:
- Category intro
- Mermaid relationship diagram (styled like `party_management.md`)
- “How the Tables Work Together” bullets
- Tables list with `[[NN_table]]` wikilinks

`party_management/party_management.md` was left unchanged as the reference template.

---

**User**

 @docs/pharmacy_erp_architecture_docs/domain @docs/pharmacy_erp_architecture_docs/roadmap @docs/pharmacy_erp_architecture_docs/exiting_product_analysis @docs/pharmacy_erp_architecture_docs/workflows update these as per our prisma and implementation which we decided. create a plan for the same

---

**Cursor**

I'll research the four doc folders and compare them against the actual Prisma schema and implementation decisions. Let me start by mapping everything out.

This is a large surface (120 doc files across four folders, 74 Prisma models). Let me sample representative docs from each folder to gauge how far they diverge from the decided schema before scoping the plan.

Let me check whether any domain docs have real content, and the nature of the `exiting_product_analysis` phase docs, to frame scope precisely.

I now have a clear picture of the divergence:

- **`workflows/`** — already aligned with the decided schema (e.g. `sales-flow.md` references `Stock (branchId, batchId)`, `PriceListItem`, branch-scoped `invoiceNumber`, `Outbox` with `entityUuid`). Likely needs only verification/minor touch-ups across ~8 files.
- **`domain/`** — ~90 files, almost all identical empty placeholder templates ("Rule 1 / Rule 2 / Rule 3", generic "Product/Supplier/Customer/Order/Stock"). These need real, schema-aligned content across 7 bounded contexts (customer, finance, inventory, product, purchasing, sales, supplier).
- **`roadmap/`** — handbook-derived; e.g. `future-roadmap.md` lists "Multi-branch support" as future though it's now foundational. Needs light alignment (implemented vs planned).
- **`exiting_product_analysis/`** — large "Phase 1-14" functional-spec docs describing an aspirational system (the DB-design phase alone estimates "150+ entities, 200-300 tables"), which is far bigger than our actual 74-model Prisma. Treating these as "update to match prisma" is ambiguous.

Two scoping decisions materially change the plan.

> **The domain/ folder is ~90 near-identical empty template files across 7 bounded contexts. How deep should I go?**
> - Author the core docs per context (README, aggregate, business-rules, events, state-machine, validation) with real schema-aligned content; turn the remaining fine-grained files into short, accurate stubs/pointers (Recommended)
> - Fully author every domain file (all ~90) with complete schema-aligned DDD content ✔
> - Only fix factual inconsistencies where a file already has real content; leave pure templates untouched

> **The exiting_product_analysis/ Phase 1-14 docs describe a much larger aspirational system than our 74-model Prisma. How should I handle them?**
> - Leave the analysis intact but add a concise 'As-built alignment' note per phase pointing to the actual Prisma/implementation decisions (Recommended)
> - Rewrite the data/architecture-heavy phases (esp. Phase 4 Database Design, Phase 7 Architecture, Phase 11 Security) to match the actual 74-model schema and implemented backend
> - Exclude this folder from the update for now ✔

Understood — full authoring of all `domain/` files, align `roadmap/` and `workflows/`, and exclude `exiting_product_analysis/`. Let me get the complete file listings for the three in-scope folders and confirm the schema facts I'll anchor to.

I have the complete picture. The three in-scope folders and the anchor facts are clear.

Domain contexts and file counts: customer (13), finance (12), inventory (14), product (14), purchasing (11), sales (13), supplier (12), plus `domain/README.md` — ~90 files, nearly all empty templates. `roadmap/` has 4 content files; `workflows/` has 8 flow files (already largely aligned).

A key part of the alignment is reconciling domain vocabulary to the actual schema (e.g. "Product" → `Medicine`; Sales is invoice-first so `SalesOrder`/`Quotation` are not modeled; Customer/Supplier are `Party` roles). Here's the plan.

---

**User**

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

**Cursor**

Implementing the plan: compiling anchor facts from the schema and seed data, then authoring domain docs in batches.


Creating the anchor reference, then parallelizing domain doc authoring across bounded contexts.


Completing domain README, roadmap, and workflow updates — payment, return, and month-end-closing still use generic templates.


All plan todos are complete. Summary:

### Anchor reference
- **[domain/ANCHOR_FACTS.md](docs/pharmacy_erp_architecture_docs/domain/ANCHOR_FACTS.md)** — identity, inventory model, outbox, auth, vocabulary mapping

### Domain (~90 files)
All bounded-context docs rewritten with schema-aligned DDD content:
- **product/** (14) — Medicine master, not “Product”
- **inventory/** (14) — Batch/Stock/StockMovement, branch scoping
- **sales/** (13) — invoice-first; `sales-order.md` & `quotation.md` marked **NOT MODELED YET**
- **purchasing/** (13) — PO → GRN → invoice → return (+ `goods-receipt.md`, `purchase-invoice.md`)
- **customer/** (13) — Party + Customer, loyalty
- **supplier/** (12) — Party + Supplier; `contracts.md` = future
- **finance/** (12) — Ledger/LedgerEntry, Payment, Receipt, Tax
- **[domain/README.md](docs/pharmacy_erp_architecture_docs/domain/README.md)** — index with table cross-links

### Roadmap (4 files)
- **future-roadmap.md** — “Already implemented” vs near/medium/long-term
- **migration.md** — Prisma/seed reality + planned import wizard
- **localization.md** — `@ngx-translate`, `en-IN`, `AppSetting` currency
- **disaster-recovery.md** — SQLite backup, outbox replay, planned `BackupConfiguration`

### Workflows (8 files)
- **sales-flow**, **purchase-flow**, **inventory-flow**, **stock-adjustment**, **stock-transfer** — already aligned; kept
- **payment-flow**, **return-flow**, **month-end-closing** — rewritten (were generic templates)
- **README.md** — workflow index + cross-cutting `UnitOfWork` note

### Excluded
- `exiting_product_analysis/**` — not changed (per plan)

---

**User**

@backend add@docs/pharmacy_erp_architecture_docs/database/tables/party_management CRUD, list controller, service and end to end API with test cases 
Create a plan for the same

---

**Cursor**

I'll research the backend patterns and the party_management schema before planning. Let me explore in parallel.

Let me read the remaining party_management models and a couple of supporting files to make the plan concrete.

I have a thorough understanding of the backend patterns and all 8 `party_management` models. Two design decisions materially shape the plan, so let me confirm them.

Note from the schema: `Party`, `PartyRole`, `PartyAddress`, `PartyContact`, `Customer`, `Supplier`, `Doctor`, `Employee` are **org-global masters** (no `companyId`/`branchId`), so list endpoints won't be branch-scoped. `Customer`/`Supplier`/`Doctor`/`Employee` each have a unique `partyId` (one-to-one detail on a `Party`).

> **How should the API surface be structured for the 8 party_management entities?**
> - Party as master with role/address/contact as nested sub-resources (/parties/:id/roles|addresses|contacts), plus top-level /customers, /suppliers, /doctors, /employees resources (Recommended) ✔
> - Flat independent REST resources for all 8 (/parties, /party-roles, /party-addresses, /party-contacts, /customers, /suppliers, /doctors, /employees) — no nesting
> - Only Party master + nested role/address/contact now; defer Customer/Supplier/Doctor/Employee

> **What write path should create/update/delete use?**
> - Full repo-standard pattern: UnitOfWork transaction + AuditService log + soft delete (deletedAt) + optimistic version + Outbox enqueue (add new entity-type constants) (Recommended) ✔
> - UnitOfWork + AuditService + soft delete + version, but no Outbox enqueue for these masters yet
> - Simple direct Prisma writes (hard delete, no audit/outbox) — minimal

I have everything I need. Here's the plan.

---

**User**

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

**Cursor**

I'll implement the Party Management CRUD API per the plan, starting with shared infrastructure and working through each todo.


Creating shared infrastructure and constants, then building the party module.


Creating nested resources and detail entities:


Creating nested and detail services:


Fixing conflict error handling and creating controllers.


Updating seed permissions and writing tests.


Import paths are wrong — party files are under `src/party/`, so they need `../` not `../../`. Fixing them across the party module.


Customer create fails validation — `partyId` as `bigint` in DTOs doesn't work well with JSON. Switching to string `partyId` with validation.


Updating the e2e test to fetch the current version before update/delete for reliability.


Aligning the e2e test with `auth.e2e-spec.ts` for stability:


Adding `userSession` to the ID sync list — a pre-existing gap that breaks e2e logins.


Party Management CRUD API is implemented per the plan. Summary:

## What was added

### Shared infrastructure
- `PaginationQueryDto`, `ParseBigIntPipe`, `buildPagination()` helper

### Party module (`backend/src/party/`)
- **8 resources** with paginated list + CRUD:
  - `/parties` — master Party
  - `/parties/:partyId/roles|addresses|contacts` — nested children
  - `/customers`, `/suppliers`, `/doctors`, `/employees` — detail entities
- **Write path**: `UnitOfWork` → audit log → outbox enqueue → soft delete → optimistic `version`
- **Response mappers** stringify `bigint` / `Decimal` for JSON

### Constants & permissions
- Extended `OutboxEntityType`, `ErrorCode` (`*_NOT_FOUND`, `ENTITY_VERSION_CONFLICT`)
- 19 new RBAC permissions in seed data, granted to ADMIN

### Tests
- `party.service.spec.ts`, `customer.service.spec.ts` (7 unit tests)
- `test/party.e2e-spec.ts` — full lifecycle + auth/403 checks

### Supporting fix
- Added `userSession` and `auditLog` to `sync-prisma-id-sequence.ts` so e2e logins don’t collide on session IDs

## Verification
- `npm run build` — passes
- `npx jest src/party` — 7 tests pass
- `npx jest --config ./test/jest-e2e.json test/party.e2e-spec.ts` — 3 tests pass

Re-seed before manual testing so ADMIN gets the new permissions:

```bash
cd backend && npm run db:seed:fresh
```

