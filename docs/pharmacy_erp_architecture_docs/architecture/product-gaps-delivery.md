# Product gaps delivery (FY, reporting, sync, loyalty)

Summary of the **phased full-stack** work: closed financial-year enforcement, planned report catalog, push sync worker stub, and loyalty foundation. Use this doc with [implementation-status.md](../functional/implementation-status.md) for UI/backend maturity.

**Related ADR:** [ADR-256](adrs/ADR-256-financial-year-close-not-enforced-all-modules.md) (superseded for cross-module FY enforcement).

---

## Phase 1 — Financial year enforcement

### Backend

- Guards: [`backend/src/configuration/utils/financial-year-guard.util.ts`](../../../backend/src/configuration/utils/financial-year-guard.util.ts)
  - `assertDocumentDateInOpenFinancialYear` — delegates to existing ledger FY lookup.
  - `assertOpenFinancialYearForBranchDocument` — resolves `companyId` from `branchId`.
- Applied on **document create/update** and key **workflows** for purchase, sales, inventory, finance (payment/receipt drafts), and prescription headers (business dates).
- Posting paths still use `assertTransactionDateInOpenYear` in [`ledger-posting.util.ts`](../../../backend/src/persistence/ledger/ledger-posting.util.ts).

### Frontend

- [`src/app/core/utils/api-error-message.util.ts`](../../../src/app/core/utils/api-error-message.util.ts) — friendly `FINANCIAL_YEAR_CLOSED` (and Rx/loyalty codes) via `resolveApiErrorMessage` on transactional **and master-data** detail save paths (party, medicine, pricing, configuration, masters, security, settings).
- Financial year detail help text: closed years block transactional dates.

### Tests

- [`backend/test/integration/financial-year.integration.spec.ts`](../../../backend/test/integration/financial-year.integration.spec.ts) — close FY → `POST /purchase-orders` returns `409` + `FINANCIAL_YEAR_CLOSED`.

### Remaining gaps

- Nested **line-item** services do not always re-assert FY (parent header date is authoritative once saved).
- **Month-end** ClosingService / pre-close wizard not in scope.

---

## Phase 2 — Reporting catalog

### Report ids (registered at startup)

| Domain | Report id | Permission seed code |
|--------|-----------|----------------------|
| Party | `party.customer-list`, `party.supplier-list`, `party.customer-outstanding` | `REPORT_PARTY_VIEW` |
| Sales | `sales.daily-summary`, `sales.register`, `sales.gst-summary` | `REPORT_SALES_VIEW` |
| Purchase | `purchase.po-status`, `purchase.register`, `purchase.supplier-summary` | `REPORT_PURCHASE_VIEW` |
| Inventory | `inventory.stock-on-hand`, `inventory.near-expiry`, `inventory.movement-register` | `REPORT_INVENTORY_VIEW` |
| Finance | `finance.day-book`, `finance.trial-balance`, `finance.gst-summary`, `finance.month-end-pack` | `REPORT_FINANCE_VIEW` |

Providers: `backend/src/reporting/providers/{party,sales,purchase,inventory,finance}/`.

Transactional reports use JWT **branch** scope and optional `fromDate` / `toDate` query params. `finance.month-end-pack` is an on-demand summary (trial balance + GST rows), not a stored archive.

### Tests

- [`backend/test/integration/reports.integration.spec.ts`](../../../backend/test/integration/reports.integration.spec.ts) — smoke run per domain for admin.

### Frontend

- Existing `/reports` list and runner; Administrator role granted new `REPORT_*_VIEW` permissions after reseed / `db:test:prepare`.

---

## Phase 3 — Sync push / pull (Nest client, Phase 1 masters + party)

### Backend

- [`SyncRunService`](../../../backend/src/sync/services/sync-run.service.ts) — batch push + pull; [`SyncCloudClient`](../../../backend/src/sync/cloud/sync-cloud.client.ts); [`SyncApplyService`](../../../backend/src/sync/services/sync-apply.service.ts); [`DeviceSyncState`](../../../backend/prisma/synchronization/device-sync-state.prisma).
- `POST /sync/runs` — forwards `Authorization` to cloud; permission `SYNC:SYNC:EXECUTE` (`SYNC_RUN`).
- `GET /sync/runs/latest` — last session for device (`SYNC:SYNC_LOG:READ`).
- HTTP contract for Spring team: [sync-cloud-api.md](./sync-cloud-api.md).

**Environment**

| Variable | Purpose |
|----------|---------|
| `SYNC_CLOUD_URL` | Base URL through `/api/sync` (e.g. `https://host/api/sync`) |
| `SYNC_BATCH_SIZE` | Max outbox rows per push (default 50, cap 200) |
| `SYNC_PULL_LIMIT` | Pull page size (default 50) |
| `SYNC_MAX_PULL_PAGES` | Max pull pages per run (default 10) |
| `SYNC_INTERVAL_MINUTES` | Electron scheduler interval (default 15) |

**Not implemented:** transactional outbox types; conflict resolve applying payloads (ADR-138); cloud service in this repo.

### Electron

- [`electron/main.js`](../../../electron/main.js) — interval + initial trigger via `sync:runNow` IPC to renderer.
- [`electron/preload.js`](../../../electron/preload.js) — `electronAPI.onSyncRunRequested`.

### Frontend

- Routes: `/sync` — manual **Sync now**, last run summary ([`src/app/features/sync/`](../../../src/app/features/sync/)).

### Tests

- [`backend/test/support/cloud-sync-mock.ts`](../../../backend/test/support/cloud-sync-mock.ts)
- [`backend/test/integration/sync-run.integration.spec.ts`](../../../backend/test/integration/sync-run.integration.spec.ts)
- [`backend/test/e2e/sync-run.e2e-spec.ts`](../../../backend/test/e2e/sync-run.e2e-spec.ts)

---

## Phase 4 — Loyalty (EPIC-011 foundation)

### Schema

- `LoyaltyProgram`, `LoyaltyTransaction` (existing).
- `CustomerLoyaltyMembership` — [`backend/prisma/loyalty/customer-loyalty-membership.prisma`](../../../backend/prisma/loyalty/customer-loyalty-membership.prisma).

### Backend module

- [`backend/src/loyalty/`](../../../backend/src/loyalty/) — program CRUD, customer enrollment, sales post integration.
- APIs: `GET/POST/PATCH /loyalty-programs`, `POST /customers/:customerId/loyalty-enrollments`.
- Sales: `redeemPoints` on [`SalesWorkflowDto`](../../../backend/src/sales/dto/sales-workflow.dto.ts); earn/redeem in same transaction as invoice post via `LoyaltyIntegrationService`.
- Outbox entity types: `LoyaltyProgram`, `LoyaltyTransaction`, `CustomerLoyaltyMembership`.

### Frontend

- `/loyalty/programs` — program list + detail (i18n, shortcuts).
- Customer loyalty tab — program lookup enroll/adjust; `/loyalty/customers/:customerId/transactions` history.

### Remaining gaps (full Phase 11 ADO)

- Points **expiry job** UI/ops; full ADO test matrix.
- Scheduled report runs (deferred).

---

## Operations checklist

```bash
cd backend
npm run db:test:prepare    # schema + seed including new permissions
npm run test:integration -- --testPathPatterns="financial-year|reports|sync-run|purchase-order"
npm run test:e2e -- --testPathPatterns="auth|party|app|sync-run"
```

For dev DB after schema change: `npx prisma db push` (from `backend/`) then `npm run db:seed:fresh` if you need membership table + permissions on `pharmacy.sqlite`.

Set `SYNC_CLOUD_URL` in the environment running Nest (and optionally in Electron env for scheduling only — the renderer calls Nest with JWT).
