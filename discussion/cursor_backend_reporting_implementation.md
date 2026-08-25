# Backend reporting implementation
_Exported on 8/25/2026 at 23:04:28 GMT+5:30 from Cursor (3.17.8)_

---

**User**

@backend how should be implement reporting ?

---

**Cursor**

I'll explore the backend structure to understand your patterns before recommending a reporting approach.

Let me check a couple of specifics before answering.

Here's how I'd implement reporting given your existing backend conventions. There's no reporting code yet (no `groupBy`/`_sum`/`queryRaw` anywhere), so this is a greenfield module that should mirror the `party` pattern.

## Core principle: reporting is a read-only bounded context

Reports read from the transactional tables (`SalesInvoice`, `StockMovement`, `LedgerEntry`, etc.) but never mutate. That means you skip most of the write-side machinery:

| Machinery | Use in reporting? |
|---|---|
| `PrismaService.client` (direct reads) | ✅ Yes |
| `RequestContextService` + tenant scope helpers | ✅ Yes (always) |
| `PaginationQueryDto` / `PaginatedResult` | ✅ Yes |
| `PermissionsGuard` / `@RequirePermissions` | ✅ Yes |
| `UnitOfWorkService` | ❌ No (writes only) |
| `OutboxService` / `AuditService` | ❌ No (no mutations) |
| `InventoryLedgerService` | ❌ No |

This matches how `CustomerService.list` already does reads — no `UnitOfWork`, just `this.prisma.client.customer.count/findMany`.

## Recommended structure

```
backend/src/reporting/
├── reporting.module.ts
├── controllers/
│   ├── sales-report.controller.ts
│   ├── inventory-report.controller.ts
│   ├── purchase-report.controller.ts
│   └── financial-report.controller.ts
├── services/
│   ├── sales-report.service.ts
│   ├── inventory-report.service.ts
│   └── ...
├── dto/
│   ├── report-query.dto.ts          # shared base
│   ├── sales-summary-query.dto.ts
│   └── ...
├── mappers/                          # serialize Decimal/BigInt/Date → string
│   └── sales-report.mapper.ts
└── constants/
    └── reporting.constants.ts
```

Register it in `app.module.ts` alongside `PartyModule`.

## 1. A shared report query DTO (date range + pagination)

Extend the existing `PaginationQueryDto` so tabular reports get paging for free:

```typescript
export class ReportQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  // Optional branch override; otherwise default to context branch
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  branchId?: number;
}
```

Add a `REPORT_INVALID_DATE_RANGE` code to `error-code.ts` and validate `fromDate <= toDate` in the service, throwing `ApplicationException`.

## 2. Two report shapes — pick per endpoint

**(a) Summary / aggregate** → use Prisma `groupBy` + `_sum`/`_count`. Return a plain object (goes through the non-paginated envelope).

```typescript
async salesSummary(q: ReportQueryDto) {
  const { branchId } = withBranchScope(getTenantScope(), q.branchId);
  const rows = await this.prisma.client.salesInvoice.groupBy({
    by: ['paymentStatus'],
    where: {
      branchId,
      deletedAt: null,
      status: 'POSTED',
      invoiceDate: { gte: new Date(q.fromDate!), lte: new Date(q.toDate!) },
    },
    _sum: { netAmount: true, grossAmount: true },
    _count: { _all: true },
  });
  return rows.map(toSalesSummaryRow); // serialize Decimals to string
}
```

**(b) Drill-down / list** → use `findMany` + `count` + `PaginatedResult.of(...)`, exactly like `CustomerService.list`. The `ResponseInterceptor` adds the `pagination` block automatically.

## 3. Always scope by tenant, always respect soft-delete

Every query must include `deletedAt: null` and a `branchId`/`companyId` from `getTenantScope()` + `withBranchScope()`. This is the single easiest thing to get wrong in reports and it directly affects correctness of totals.

## 4. Lean on the existing indexes

Your schema already has the right composite indexes for reporting date-range scans:
- `SalesInvoice`: `@@index([branchId, invoiceDate])`, `@@index([status])`, `@@index([paymentStatus])`
- `StockMovement`: `@@index([branchId, medicineId, movementDate])`
- `LedgerEntry`: `@@index([transactionDate])`, `@@index([voucherType, voucherId])`

Design report filters to hit these (branch + date first).

## 5. When `groupBy` isn't enough → raw SQL

Prisma `groupBy` can't do multi-table joins, running balances, or complex GST breakups. For those, use `this.prisma.client.$queryRaw` with a **parameterized** template (never string interpolation). Keep raw SQL isolated in the service, and be aware it's SQLite locally / PostgreSQL cloud — stick to portable SQL (avoid dialect-specific functions), per your `prisma_sqlite_jpa_postgres_alignment.md`.

## 6. Permissions + serialization

- Seed `REPORT:SALES:READ`, `REPORT:INVENTORY:READ`, etc. into `permission.json` / `role-permission.json` following the `PARTY:*` pattern, and guard each endpoint with `@RequirePermissions(...)`.
- Reuse the `serializeDecimal` helper from the party mappers so money/qty go out as strings — don't leak `Decimal`/`BigInt` into JSON.

## 7. One caveat to decide up front

The sales/purchase/inventory/financial **write modules don't exist yet** — only their Prisma tables (and whatever the seed populates). So you can build reporting against these tables now, but real data won't flow until those transactional modules land. Worth confirming which reports you actually need first (Sales register, Stock-on-hand, Expiry, GST/tax, Day-book/ledger are the usual pharmacy set) so the module doesn't get built ahead of available data.

The domain docs to read before designing specific reports: `docs/pharmacy_erp_architecture_docs/domain/finance/` (ledger, journal, taxation), `domain/inventory/` (valuation, costing, expiry), and `workflows/month-end-closing.md`.

Want me to sketch a concrete first report (e.g. a Sales register with summary + drill-down) end-to-end, or map out the full list of pharmacy reports and their source tables? I can only outline in Ask mode — switch to Agent mode when you want it implemented.

---

**User**

create a plan to implement extensive reporting module which will support party and other module when they establish

---

**Cursor**

I have solid context on your backend from the earlier exploration. Before I write the plan, two decisions will significantly shape the architecture, so let me confirm them.

**Reporting module scope**

> **How should the reporting module relate to domain modules like party (and future sales/inventory/etc.)?**
> - Central reporting module with an extensible report registry — each domain module registers its report definitions via a provider interface (Recommended) ✔
> - Reporting module provides only shared infra (base DTOs, date filters, export, pagination); each domain module owns its own report endpoints
> - Self-contained reporting module that queries other modules' Prisma tables directly, with no per-module registration

> **What output formats must reporting support beyond JSON API responses?**
> - JSON only for now; design so exports can be added later
> - JSON plus CSV/Excel export
> - JSON plus CSV/Excel and PDF export ✔

Good. Let me pull the exact shapes of the pieces the plan will build on.

Now the auth/permissions, tenant scoping, error codes, and party wiring.

Let me look at permissions wiring, a party service/mapper for the concrete first report, and package.json for export libs.

Let me confirm how permissions are seeded so the plan can cite the exact file.

Let me verify the actual permission string convention used in controllers vs. the guard.

I have everything I need. Here's my plan.

Note one thing I found: a `REPORT_VIEW` permission already exists in seed data ([backend/seed/data/security/permission.json](backend/seed/data/security/permission.json) line 9), so the reporting module can gate on it immediately. I also noticed the party controllers use colon-style permission strings (`PARTY:CUSTOMER:READ`) that don't match the underscore-style seeded codes (`CUSTOMER_READ`) — that's a pre-existing inconsistency I will not touch; the plan uses the seeded underscore convention.

---

**User**

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

**Cursor**

I'll implement the reporting module per the plan, starting with core contracts and working through each todo.


Creating core reporting files and updating error codes.


Implementing the export layer and remaining components.


Removing branch filters from party master-data reports — party entities aren't branch-scoped in the schema.


Switching file exports to `StreamableFile` so we avoid double-response issues with the interceptor.


Updating ResponseInterceptor to skip wrapping `StreamableFile` exports.


Fixing lint issues in the reporting module.


Fixing incorrect import paths in the reporting module.


The extensible reporting module is implemented. Summary:

## What was built

### Core (`backend/src/reporting/`)
- **Report registry** — `ReportRegistryService` with `register`, `get`, `list`, `listForUser`
- **Contracts** — `ReportDefinition`, `ReportResult`, `ReportContext`, `ReportQueryDto` (pagination + date range + `format`)
- **Export** — CSV, XLSX (`exceljs`), PDF (`pdfmake`) via `ReportExporterService`
- **API** — `GET /reports` and `GET /reports/:reportId` with `REPORT_VIEW` gate + per-report permission check

### Party reports (first provider)
| Report ID | Description |
|-----------|-------------|
| `party.customer-list` | Customers with code, name, type, credit limit, outstanding, active |
| `party.supplier-list` | Suppliers (same shape) |
| `party.customer-outstanding` | Customers with outstanding > 0 + `grandTotal` |

### Permissions & seed
- `REPORT_PARTY_VIEW` added to `permission.json` and granted to admin in `role-permission.json`
- Routes gated by existing `REPORT_VIEW`; each report requires its own permission

### Dependencies
- `exceljs`, `pdfmake`, `@types/pdfmake` (dev)

### Docs
- [`docs/pharmacy_erp_architecture_docs/architecture/reporting.md`](docs/pharmacy_erp_architecture_docs/architecture/reporting.md) — registry contract and “how to add a report” recipe

### Tests
- 11 tests passing (registry, party provider, exporters)

## Usage examples

```http
GET /reports
GET /reports/party.customer-list?page=1&pageSize=20&search=alice
GET /reports/party.customer-outstanding?format=pdf
GET /reports/party.supplier-list?format=xlsx&fromDate=2026-01-01&toDate=2026-01-31
```

## Extending for future modules

Create an `OnModuleInit` provider that registers `ReportDefinition`s into `ReportRegistryService` — no changes to the reporting core. See the docs for the full recipe.

**Note:** Party master data is company-wide (no `branchId` on `Customer`/`Supplier`). `branchId` in query params is used in export headers; branch-scoped filtering applies when transactional report providers (sales, inventory, etc.) are added. Re-seed (`npm run db:seed:fresh`) to pick up `REPORT_PARTY_VIEW` for the admin role.

---

**User**

update/create docs to add information regarding this and how to use and extend reporting etc

---

**Cursor**

I'll review the existing reporting docs and related architecture files, then expand them with usage and extension guidance.


Expanding the reporting architecture doc and cross-linking it from related docs.


Documentation is updated. Here’s what changed and where to look.

## Primary guide

**[`docs/pharmacy_erp_architecture_docs/architecture/reporting.md`](docs/pharmacy_erp_architecture_docs/architecture/reporting.md)** — expanded into the main reference:

- **Quick start** — prerequisites, list/run reports, curl examples
- **Architecture** — diagram, source layout, design rules
- **Permissions** — `REPORT_VIEW` vs per-report codes, seeding new permissions
- **API reference** — query params, JSON response shapes, error codes
- **Implemented party reports** — table of `party.*` reports
- **Export formats** — json / csv / xlsx / pdf
- **How to extend** — checklist, contracts, column types, full sales example, pagination pattern, raw SQL note
- **Angular/Electron guidance** — client integration recommendations
- **Testing** — which specs exist and how to run them
- **Planned reports** — roadmap by category

## Cross-links added/updated

| Doc | Change |
|-----|--------|
| [`architecture/integrations.md`](docs/pharmacy_erp_architecture_docs/architecture/integrations.md) | Points to implemented reporting module; separates planned vs done |
| [`architecture/application-architecture.md`](docs/pharmacy_erp_architecture_docs/architecture/application-architecture.md) | Reporting in implemented modules; API note for binary exports |
| [`architecture/early-foundations.md`](docs/pharmacy_erp_architecture_docs/architecture/early-foundations.md) | New “Reporting API” section + code path `backend/src/reporting/` |
| [`architecture/README.md`](docs/pharmacy_erp_architecture_docs/architecture/README.md) | Richer reporting entry in index |
| [`backend/AGENTS.md`](backend/AGENTS.md) | Reporting subsection + architecture doc link |

Start with **reporting.md** for usage (`GET /reports`, `format=pdf`, etc.) and the step-by-step extension checklist for new domain providers.

---

**User**

alsi update read/or relevant docs so that all command to run test, feature based test can files bsaed test execution command and relevant command are added into appropriate docs

---

**Cursor**

I'll find where tests are documented today and align README and related docs with the actual test commands (feature-based, file-based, and other runners).


Creating a canonical testing guide and updating READMEs and related docs with the full command reference.


Documentation is updated with a canonical testing guide and cross-links across the repo.

## New canonical doc

**[`docs/pharmacy_erp_architecture_docs/architecture/testing.md`](docs/pharmacy_erp_architecture_docs/architecture/testing.md)** — full reference including:

- Suite overview (backend unit, persistence, e2e, Angular)
- All `npm run test*` commands (`watch`, `cov`, `debug`, `ci`)
- **Feature-based** filters (`--testPathPatterns=auth|party|reporting|…`)
- **Single-file** runs (`npm run test -- party/customer.service.spec.ts`)
- Persistence and e2e filters per integration file
- Angular Jest commands from repo root
- Quick reference table (feature → command)
- PR workflow recommendations
- Complete test file index

## Updated docs

| File | Changes |
|------|---------|
| [`README.md`](README.md) | Jest instead of Karma; backend + Angular commands; link to testing.md |
| [`backend/README.md`](backend/README.md) | Expanded Run tests section with feature/file examples |
| [`backend/AGENTS.md`](backend/AGENTS.md) | Test commands + examples + link to testing.md |
| [`architecture/early-foundations.md`](docs/pharmacy_erp_architecture_docs/architecture/early-foundations.md) | Expanded Tests table (party, reporting, persistence, single-file) |
| [`architecture/engineering-standards.md`](docs/pharmacy_erp_architecture_docs/architecture/engineering-standards.md) | Points to testing.md |
| [`architecture/README.md`](docs/pharmacy_erp_architecture_docs/architecture/README.md) | Testing index entry |
| [`docs/README.md`](docs/pharmacy_erp_architecture_docs/README.md) | Testing link in architecture table |
| [`database/persistence-patterns.md`](docs/pharmacy_erp_architecture_docs/database/persistence-patterns.md) | Persistence test filters + link |
| [`architecture/reporting.md`](docs/pharmacy_erp_architecture_docs/architecture/reporting.md) | Testing section + related link |
| [`architecture/application-architecture.md`](docs/pharmacy_erp_architecture_docs/architecture/application-architecture.md) | Testing link |
| [`.cursor/rules/00-project-context.mdc`](.cursor/rules/00-project-context.mdc) | More test commands + link |
| [`.cursor/rules/testing-rules.mdc`](.cursor/rules/testing-rules.mdc) | Expanded Running tests section |

## Quick examples

```bash
# Backend unit — all or by feature (from backend/)
npm run test
npm run test -- --testPathPatterns=reporting
npm run test -- party/customer.service.spec.ts

# Persistence / e2e
npm run test:persistence -- --testPathPatterns=sequence-generator
npm run test:e2e -- --testPathPatterns=party.e2e-spec

# Angular (repo root)
npm test -- --testPathPatterns=auth.service.spec
```

