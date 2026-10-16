# Reporting — Functional Guide

**One-line purpose:** Let staff run read-only business reports and export them — without changing any data.

**Parent:** [Functional overview](./functional-overview.md)

---

## What it does

Reporting answers operational questions from existing data: who owes money, which customers are active, supplier lists, and (in future) sales registers, stock on hand, and trial balance. Reports are **read-only** — they never post stock or ledger entries.

Responsibilities:

- List reports the current user is allowed to run.
- Execute a report with filters (date range, search, branch, pagination).
- Export results as JSON, CSV, Excel, or PDF.
- Hide reports the user lacks permission for.

---

## Key concepts

| Term | Plain English |
|------|---------------|
| **Report registry** | Catalog of all report definitions registered at startup |
| **Report id** | Namespaced identifier, e.g. `party.customer-list` |
| **Report provider** | Module that registers one or more reports (e.g. party reports) |
| **Permission gate** | Route permission (`REPORT_VIEW`) plus per-report permission |
| **Export format** | `json`, `csv`, `xlsx`, or `pdf` |

```mermaid
flowchart LR
    User --> API["GET /reports"]
    API --> Registry[ReportRegistry]
    Registry --> Provider[PartyReportsProvider]
    Provider --> DB[(SQLite read)]
    API --> Export[CSV / Excel / PDF]
```

---

## Sub-flows

### Run a report

1. User opens report list (`GET /reports`).
2. User picks a report and sets filters (dates, search, page).
3. System checks `REPORT_VIEW` and report-specific permission.
4. Provider queries database (read-only, soft-delete filtered).
5. Results return as JSON or file download.

### Export

Same URL as run, with `format=csv|xlsx|pdf`. Browser or Electron saves the attachment.

---

## Implemented today

| Report id | Name | Permission |
|-----------|------|------------|
| `party.customer-list` | Customer List | `REPORT_PARTY_VIEW` |
| `party.supplier-list` | Supplier List | `REPORT_PARTY_VIEW` |
| `party.customer-outstanding` | Customer Outstanding | `REPORT_PARTY_VIEW` |
| `sales.daily-summary` | Sales Daily Summary | `REPORT_SALES_VIEW` |
| `sales.register` | Sales Register | `REPORT_SALES_VIEW` |
| `sales.gst-summary` | Sales GST Summary | `REPORT_SALES_VIEW` |
| `purchase.po-status` | Purchase Order Status | `REPORT_PURCHASE_VIEW` |
| `purchase.register` | Purchase Register | `REPORT_PURCHASE_VIEW` |
| `purchase.supplier-summary` | Supplier-wise Purchase | `REPORT_PURCHASE_VIEW` |
| `inventory.stock-on-hand` | Stock On Hand | `REPORT_INVENTORY_VIEW` |
| `inventory.near-expiry` | Near Expiry Stock | `REPORT_INVENTORY_VIEW` |
| `inventory.movement-register` | Stock Movement Register | `REPORT_INVENTORY_VIEW` |
| `finance.day-book` | Day Book | `REPORT_FINANCE_VIEW` |
| `finance.trial-balance` | Trial Balance | `REPORT_FINANCE_VIEW` |
| `finance.gst-summary` | GST Summary | `REPORT_FINANCE_VIEW` |
| `finance.month-end-pack` | Month-end Pack | `REPORT_FINANCE_VIEW` |

Seeded **Administrator** has `REPORT_VIEW` plus category `REPORT_*_VIEW` permissions (reseed or `db:test:prepare` after permission changes).

Transactional reports accept `fromDate` / `toDate` (ISO date strings) and use the JWT branch unless `branchId` is passed.

---

## Planned coverage

- Stored month-end **archive** snapshots at FY close (today: `finance.month-end-pack` is a parameterized export only).
- Additional analytics (fast/slow movers, consolidated multi-branch) per [integrations doc](../architecture/integrations.md#reporting).

---

## Rules and variations

| Rule | Detail |
|------|--------|
| Read-only | No UnitOfWork, outbox, or audit on report run |
| Tenant scope | Company and branch from JWT context |
| Soft delete | Rows with `deletedAt` excluded |
| Pagination | Tabular reports default page size 20 (max 100) |
| Date range | `fromDate` must be ≤ `toDate` |

---

## Permissions summary

| Permission | Use |
|------------|-----|
| `REPORT:REPORT:READ` (`REPORT_VIEW`) | Access `/reports` endpoints |
| `REPORT:PARTY_REPORT:READ` (`REPORT_PARTY_VIEW`) | Run `party.*` reports |
| `REPORT_SALES_VIEW`, `REPORT_PURCHASE_VIEW`, `REPORT_INVENTORY_VIEW`, `REPORT_FINANCE_VIEW` | Per-category transactional reports |

---

## Integrations

| Module | Connection |
|--------|------------|
| **Party Management** | Customer/supplier list and outstanding reports |
| **Financial** | Day book, trial balance, GST summary, month-end pack |
| **Sales / Purchase / Inventory** | Registers and operational summaries (see table above) |
| **User & Security** | Permission checks on every run |

---

## Maturity & known gaps

**Status: Partial** — planned catalog registered on backend; list/runner UI exists; advanced analytics and close-archive pipeline Planned.

See Backend / UI / UX columns: [implementation-status.md — Reporting](./implementation-status.md#reporting).

---

## References

- [Reporting architecture](../architecture/reporting.md) — API, extension guide, curl examples
- [Integrations](../architecture/integrations.md)
- [Roles and permissions](./roles-and-permissions.md)
