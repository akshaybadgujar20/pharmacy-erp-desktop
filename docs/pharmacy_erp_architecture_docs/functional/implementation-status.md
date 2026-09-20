# Implementation Status — Functional Modules

**Purpose:** Single source of truth for **Backend**, **UI**, and **UX** maturity per functional module. Use this when reading module guides so you know what the product does today versus what is documented as target behavior.

**Sources:** [workflow gap index](../workflows/workflow-gap-index.md), workflow markdown gap notes, `backend/src/`, and `src/app/features/` route/nav audit.

**Parent:** [Functional overview](./functional-overview.md)

---

## Legend

Each module is rated on three independent layers:

| Layer | Meaning |
|-------|---------|
| **Backend** | API, persistence, and business rules (NestJS + Prisma) |
| **UI** | Angular list/detail screens exist, routed, in nav, and call APIs |
| **UX** | Workflow-optimized experience (POS flow, shortcuts wired, print/scan) |

| Status | Meaning |
|--------|---------|
| **Implemented** | Layer is usable for its intended scope |
| **Partial** | Layer exists but notable gaps remain |
| **Planned** | Designed or documented but not built |
| **N/A** | Not applicable (e.g. no UI expected for sync engine) |

Backend gap severity: **High** = compliance or financial risk; **Medium** = operational gap; **Low** = polish or test coverage. UI gaps use **UI-** prefix IDs.

---

## Summary matrix

| Module | Backend | UI | UX |
|--------|---------|----|----|
| [Platform shell](#platform-shell) | Implemented | Implemented | Partial |
| [Party Management](#party-management) | Implemented | Implemented | Partial |
| [User & Security](#user--security) | Implemented | Implemented | Partial |
| [Medicine Master](#medicine-master) | Implemented | Implemented | Partial |
| [Inventory](#inventory) | Partial | Implemented | Partial |
| [Purchase](#purchase) | Partial | Implemented | Partial |
| [Sales](#sales) | Partial | Implemented | Planned |
| [Financial](#financial) | Partial | Implemented | Partial |
| [Pricing](#pricing) | Implemented | Implemented | Partial |
| [Loyalty](#loyalty) | Partial | Planned | Planned |
| [Prescription](#prescription) | Partial | Implemented | Planned |
| [Synchronization](#synchronization) | Partial | Planned | Planned |
| [Audit](#audit) | Implemented | Planned | Planned |
| [Configuration](#configuration) | Implemented | Implemented | Partial |
| [Settings](#settings-app-settings) | Implemented | Implemented | Partial |
| [Masters (Geographic)](#masters-geographic) | Implemented | Implemented | Partial |
| [Reporting](#reporting) | Partial | Partial | Partial |
| [Integrations & devices](#integrations-and-devices) | Partial | Partial | Planned |

---

## Platform shell

| Layer | Status |
|-------|--------|
| Backend | Implemented |
| UI | Implemented |
| UX | Partial |

Cross-cutting Angular/Electron shell (not a business module).

### Backend

- NestJS on localhost:3000; JWT auth; global validation and response envelope.
- Request context (company, branch, device id).

### UI screens

- Login — `src/app/features/auth/login/`
- Dashboard — `src/app/components/dashboard/`
- Main layout + sidebar nav — `src/app/components/shell/`
- Permission-filtered menu — `nav.config.ts`, `nav.utils.ts`
- i18n — `public/i18n/en.json`

### UI gaps

- UI-PLATFORM-1: No in-app sync status indicator.

### UX gaps

- UI-PLATFORM-2: Keyboard shortcuts (F2, F4, F8, Ctrl+S) registered but handlers are no-op (`KeyboardShortcutService`).
- UI-PLATFORM-3: Electron IPC limited to `deviceId` and `secureStore` — no print/scan bridge yet.

---

## Party Management

| Layer | Status |
|-------|--------|
| Backend | Implemented |
| UI | Implemented |
| UX | Partial |

### Backend

- Customer, supplier, doctor, employee CRUD with party template pattern.
- Soft delete, version conflict handling, outstanding balance cache.

**Backend gaps**

- Credit-limit block at sale post not fully enforced (policy TBD).
- Supplier contracts not modeled.

### UI screens

- Routes: `/party/customers`, `/party/suppliers`, `/party/doctors`, `/party/employees`, `/party/parties`
- Code: `src/app/features/party/party.routes.ts`
- Nav: Parties group in `nav.config.ts`
- Pattern: list + detail for each role; party tabs (roles, contacts, addresses)

### UI gaps

- None significant — admin CRUD complete.

### UX gaps

- UI-PARTY-1: No quick customer lookup widget embedded in sales screen (navigate to separate list).

---

## User & Security

| Layer | Status |
|-------|--------|
| Backend | Implemented |
| UI | Implemented |
| UX | Partial |

### Backend

- JWT login, bcrypt passwords, RBAC via seeded roles and permissions.
- User–employee linkage, branch assignment, session tracking.

**Backend gaps**

- Fine-grained permissions for some inventory/purchase approve actions still TBD in seed.
- Password policy and MFA are Planned.

### UI screens

- Login — `src/app/features/auth/login/`
- Routes: `/security/users`, `/security/roles`, `/security/permissions`, `/security/user-sessions`
- Code: `src/app/features/security/security.routes.ts`
- Nav: Security group under Admin in `nav.config.ts`

### UI gaps

- None significant for admin CRUD.

### UX gaps

- UI-SEC-1: No self-service password change flow in Angular (API may exist).

---

## Medicine Master

| Layer | Status |
|-------|--------|
| Backend | Implemented |
| UI | Implemented |
| UX | Partial |

### Backend

- Medicine, generic, category, schedule, manufacturer, UOM, salt composition CRUD.
- Barcode uniqueness, schedule linkage for compliance metadata.

**Backend gaps**

- Schedule-H **enforcement at sale** is not wired (see Sales, Prescription).
- External drug database import Planned.

### UI screens

- Routes: `/medicine/medicines`, `categories`, `generics`, `schedules`, `manufacturers`, `salt-compositions`, `units-of-measure`
- Code: `src/app/features/medicine/medicine.routes.ts`
- Nav: Medicines group in `nav.config.ts`
- Pattern: list + detail; medicine salts tab

### UI gaps

- None significant for master CRUD.

### UX gaps

- UI-MED-1: F4 "search medicine" shortcut not wired to global search.
- UI-MED-2: No barcode scan-to-select on medicine list.

---

## Inventory

| Layer | Status |
|-------|--------|
| Backend | Partial |
| UI | Implemented |
| UX | Partial |

### Backend

- Batch (org-global), Stock (branch-scoped), StockMovement ledger, adjustments, transfers, stock take.
- FEFO allocation at sales post; FY date guard on stock paths.

**Backend gaps**

| ID | Gap | Severity |
|----|-----|----------|
| GAP-ADJ-1 | No submit step — DRAFT → approve directly on adjustment | Low |
| GAP-ADJ-2 | No cancel or reversal endpoint for adjustments | Medium |
| GAP-ADJ-3 | No finance valuation posting on adjustment approve | Low |
| GAP-XFER-1 | `inTransitQuantity` bucket not implemented | Medium |
| GAP-XFER-2 | IN_TRANSIT status never set — transfer is direct OUT + IN | Low |
| GAP-XFER-3 | No cancel route after dispatch | Medium |
| GAP-XFER-4 | PENDING_APPROVAL with no submit route | Low |
| GAP-TAKE-1 | Stock take not wired to month-end close wizard | Medium |

**Note:** Target transfer lifecycle (In Transit) is Planned; code does direct branch-to-branch move.

### UI screens

- Routes: `/inventory/batches`, `stocks`, `stock-movements`, `stock-adjustments`, `stock-transfers`, `stock-takes`
- Code: `src/app/features/inventory/inventory.routes.ts`
- Nav: Inventory group in `nav.config.ts`
- Pattern: list + detail + items tabs for documents

### UI gaps

- UI-INV-1: Stock list is read-only (no inline adjustment from stock grid).

### UX gaps

- UI-INV-2: No FEFO preview when viewing stock by medicine.
- UI-INV-3: Barcode scan for stock inquiry not wired.

---

## Purchase

| Layer | Status |
|-------|--------|
| Backend | Partial |
| UI | Implemented |
| UX | Partial |

### Backend

- PO lifecycle, GRN post (creates Batch + Stock IN), purchase invoice (AP only), purchase return (Stock OUT).
- GRN without PO gated by `ALLOW_GRN_WITHOUT_PO` setting.

**Backend gaps**

| ID | Gap | Severity |
|----|-----|----------|
| GAP-GRN | GRN without PO allowed only when setting enabled | Low |
| GAP-INV | Invoice post does not move stock (by design — stock at GRN) | Info |
| GAP-RET-4 | No supplier ledger update on purchase return approve | Medium |
| GAP-7-P | No automated unit tests for Purchase module | Medium |
| GAP-8-P | No end-to-end tests for purchase workflow | Medium |

### UI screens

- Routes: `/purchase/orders`, `goods-receipts`, `invoices`, `returns`
- Code: `src/app/features/purchase/purchase.routes.ts`
- Nav: Purchase group in `nav.config.ts`
- Pattern: list + detail + items tabs per document type

### UI gaps

- None significant for document CRUD.

### UX gaps

- UI-PUR-1: No guided PO → GRN wizard (separate screens today).
- UI-PUR-2: Three-way match indicators not surfaced on invoice screen.

---

## Sales

| Layer | Status |
|-------|--------|
| Backend | Partial |
| UI | Implemented |
| UX | Planned |

### Backend

- Sales invoice draft/post, FEFO stock OUT, price snapshot, payments, returns with RESTOCK.
- Optional `prescriptionId` FK validated at post.

**Backend gaps**

| ID | Gap | Severity |
|----|-----|----------|
| GAP-1 | Round-off not applied at finalise | Medium |
| GAP-2 | Payment not captured at finalise — invoice may stay UNPAID | Low |
| GAP-3 | Return: only RESTOCK disposition supported | Medium |
| GAP-4 | No standalone refund flow on invoice | Low |
| GAP-5 | Prescription checked only — not marked dispensed | Medium |
| GAP-6 | No Schedule-H / controlled-drug enforcement at post | High |
| GAP-7 | No automated tests for Sales module | Medium |
| GAP-8 | No end-to-end tests for sales invoice workflow | Medium |
| GAP-RET-2 | RESTOCK only — no quarantine/expired disposition | Medium |
| GAP-RET-3 | Return policy / Schedule H not enforced on return | High |

### UI screens

- Routes: `/sales/invoices`, `/sales/returns`
- Code: `src/app/features/sales/sales.routes.ts`
- Nav: Sales group in `nav.config.ts`
- Pattern: list + detail; invoice items tab + payments tab; return items tab

### UI gaps

- UI-SALES-1: No dedicated counter/POS layout — admin list/detail pattern only.
- UI-SALES-2: Loyalty earn/redeem controls not on invoice screen (no loyalty UI module).

### UX gaps

- UI-SALES-3: F2 new sale, F8 payment shortcuts not wired.
- UI-SALES-4: Post → pay → print not on single keyboard-driven flow.
- UI-SALES-5: Receipt print not hooked to Electron printer service.

---

## Financial

| Layer | Status |
|-------|--------|
| Backend | Partial |
| UI | Implemented |
| UX | Partial |

### Backend

- Chart of accounts, ledger posting service, payments, receipts, financial year entity.
- Sales/purchase integration posts balanced vouchers; customer/supplier outstanding cache.

**Backend gaps**

| ID | Gap | Severity |
|----|-----|----------|
| GAP-PAY-1 | Overpayment → customer advance not implemented | Medium |
| GAP-PAY-2 | Dual settlement: SalesPayment + Receipt (by design) | Info |
| GAP-ME-1 | Pre-close checks — no ClosingService | High |
| GAP-ME-2 | Stock reconciliation not wired to close | Medium |
| GAP-ME-3 | Trial balance report not implemented | Medium |
| GAP-ME-4 | GST summary report not implemented | Medium |
| GAP-ME-6 | CLOSED financial year does not block all mutation paths | Medium |
| GAP-ME-7 | Archive reports at close — no pipeline | Medium |
| GAP-ME-8 | No ClosingService or pre-close wizard | High |
| GAP-ME-9 | No reopen-period API | Low |

### UI screens

- Routes: `/finance/ledgers`, `payments`, `receipts`
- Code: `src/app/features/finance/finance.routes.ts`
- Nav: Finance group in `nav.config.ts`

### UI gaps

- UI-FIN-1: No month-end close wizard screen.
- UI-FIN-2: No trial balance or GST summary views (backend reports Planned).

### UX gaps

- UI-FIN-3: Cash-drawer reconciliation UI Planned.

---

## Pricing

| Layer | Status |
|-------|--------|
| Backend | Implemented |
| UI | Implemented |
| UX | Partial |

### Backend

- Price lists, price list items, tax master, discount rules.
- Price snapshot on sales post; MRP cap when `ENFORCE_MRP_CAP` enabled.

**Backend gaps**

- Promotional pricing campaigns beyond discount rules Planned.

### UI screens

- Routes: `/pricing/price-lists`, `taxes`, `discount-rules`
- Code: `src/app/features/pricing/pricing.routes.ts`
- Nav: Pricing group in `nav.config.ts`

### UI gaps

- UI-PRICE-1: Branch-specific price list selection rules may need screen polish.

### UX gaps

- None beyond admin CRUD expectations.

---

## Loyalty

| Layer | Status |
|-------|--------|
| Backend | Partial |
| UI | Planned |
| UX | Planned |

### Backend

- Schema and service scaffolding; earn/redeem hooks referenced from sales design.
- `LOYALTY_POINTS_RATIO` setting seeded.

**Backend gaps**

- Full earn/redeem at invoice post may not be complete end-to-end.
- Loyalty program CRUD permissions partially Planned.
- Points expiry job and reconciliation Planned.

### UI screens

- No `src/app/features/loyalty/` folder.
- No routes or nav entries.

### UI gaps

- UI-LOY-1: Loyalty program list/detail screens Planned.
- UI-LOY-2: Customer points history screen Planned.

### UX gaps

- UI-LOY-3: Earn/redeem at invoice post not on sales screen.

---

## Prescription

| Layer | Status |
|-------|--------|
| Backend | Partial |
| UI | Implemented |
| UX | Planned |

### Backend

- Prescription and PrescriptionItem CRUD; link to sales via `prescriptionId`.
- Status values include PARTIALLY_DISPENSED / DISPENSED in schema.

**Backend gaps**

| ID | Gap | Severity |
|----|-----|----------|
| GAP-RX-1 | Sales dispensing not wired — Rx not updated on sale | High |
| GAP-RX-2 | PARTIALLY_DISPENSED / DISPENSED statuses unused | Medium |
| GAP-RX-3 | Sales only validates prescription FK — no line-level dispense match | Medium |

### UI screens

- Routes: `/prescriptions`
- Code: `src/app/features/prescription/prescription.routes.ts`
- Nav: Prescriptions group in `nav.config.ts`
- Pattern: list + detail + items tab

### UI gaps

- UI-RX-1: No dispense workflow linking Rx lines to invoice lines in UI.

### UX gaps

- UI-RX-2: Schedule-H block at sale not surfaced in billing UX.
- UI-RX-3: Expired-Rx override workflow not in UI.

---

## Synchronization

| Layer | Status |
|-------|--------|
| Backend | Partial |
| UI | Planned |
| UX | Planned |

### Backend

- Outbox pattern, sync log, conflict entities; delta sync design documented.
- Background worker and cloud Spring Boot sync Planned for production.

**Backend gaps**

- Sync worker not always running in desktop dev setup.

### UI screens

- No `src/app/features/sync/` folder.
- No routes or nav entries.

### UI gaps

- UI-SYNC-1: Outbox queue viewer Planned.
- UI-SYNC-2: Conflict resolution screen Planned.

### UX gaps

- UI-SYNC-3: Background sync status indicator Planned.

---

## Audit

| Layer | Status |
|-------|--------|
| Backend | Implemented |
| UI | Planned |
| UX | Planned |

### Backend

- AuditLog on mutations inside UnitOfWork; ChangeHistory for entity field diffs.
- Correlation ID on HTTP requests.

**Backend gaps**

- Read API for audit search may be limited.
- Retention and archival policy Planned.

### UI screens

- No `src/app/features/audit/` folder.
- No audit log search or change-history viewer routes.

### UI gaps

- UI-AUD-1: Audit log search screen Planned.
- UI-AUD-2: Entity change-history viewer Planned.

### UX gaps

- UI-AUD-3: Inline "who changed this" on document detail screens Planned.

---

## Configuration

| Layer | Status |
|-------|--------|
| Backend | Implemented |
| UI | Implemented |
| UX | Partial |

### Backend

- Company, branch, financial year, sequence generators, printer/barcode config.

**Backend gaps**

| ID | Gap | Severity |
|----|-----|----------|
| GAP-ME-6 | Closed FY does not block all document paths | Medium |

### UI screens

- Routes: `/configuration/companies`, `branches`, `financial-years`, `sequence-generators`, `barcode-configurations`, `printer-configurations`
- Code: `src/app/features/configuration/configuration.routes.ts`
- Nav: Configuration group under Admin in `nav.config.ts`

### UI gaps

- None significant for org setup CRUD.

### UX gaps

- UI-CONF-1: Printer/barcode config screens exist but hardware test buttons not wired.

---

## Settings (App settings)

| Layer | Status |
|-------|--------|
| Backend | Implemented |
| UI | Implemented |
| UX | Partial |

### Backend

- AppSetting CRUD with optimistic locking (`version` + `settingValue`).

### UI screens

- Routes: `/settings`
- Code: `src/app/features/settings/settings.routes.ts`
- Nav: Settings under Admin in `nav.config.ts`

### UI gaps

- None significant.

### UX gaps

- UI-SET-1: Settings grouped by category/domain for pharmacist-friendly browsing Planned.

---

## Masters (Geographic)

| Layer | Status |
|-------|--------|
| Backend | Implemented |
| UI | Implemented |
| UX | Partial |

### Backend

- Country, state, city, area reference data CRUD.

**Backend gaps**

- Bulk import from external gazetteer Planned.

### UI screens

- Routes: `/masters/countries`, `states`, `cities`, `areas`
- Code: `src/app/features/masters/masters.routes.ts`
- Nav: Masters group in `nav.config.ts`

### UI gaps

- None significant for lookup CRUD.

### UX gaps

- UI-MAST-1: Bulk import UI Planned.

---

## Reporting

| Layer | Status |
|-------|--------|
| Backend | Partial |
| UI | Partial |
| UX | Partial |

### Backend

- Report registry, party reports (customer list, supplier list, customer outstanding).
- Export: JSON, CSV, Excel, PDF.

**Backend gaps**

- Sales, purchase, inventory, finance report providers Planned (see [reporting.md](./reporting.md)).

### UI screens

- Routes: `/reports`, `/reports/:reportId`
- Code: `src/app/features/reporting/reporting.routes.ts`
- Components: `report-list.component`, `report-runner.component`
- Nav: Reports group in `nav.config.ts`

### UI gaps

- UI-REP-1: Only party reports available from API today.
- UI-REP-2: No saved report favourites or scheduled runs.

### UX gaps

- UI-REP-3: Export download UX may need polish for Electron file save.

---

## Integrations and devices

| Layer | Status |
|-------|--------|
| Backend | Partial |
| UI | Partial |
| UX | Planned |

Hardware and device integration (see [integrations-and-devices.md](./integrations-and-devices.md)).

### Backend

- Printer and barcode configuration APIs exist.
- Payment gateway abstraction Planned.

### UI screens

- Printer config: `/configuration/printer-configurations`
- Barcode config: `/configuration/barcode-configurations`
- No payment terminal UI.

### UI gaps

- UI-DEV-1: No print preview or test-print from sales screen.
- UI-DEV-2: No payment terminal configuration screen.

### UX gaps

- UI-DEV-3: Thermal receipt print from post not wired.
- UI-DEV-4: USB barcode scanner integration not wired in Angular.
- UI-DEV-5: Card/UPI terminal flow Planned.

---

## Cross-cutting (tests and month-end)

| Area | Backend | UI | UX |
|------|---------|----|----|
| Month-end close | Planned (GAP-ME-*) | Planned | Planned |
| E2E test coverage | Partial | Partial | N/A |

---

## How to update

When adding or changing a feature:

1. **Backend change** — update Backend bullets; add or resolve rows in [workflow-gap-index.md](../workflows/workflow-gap-index.md) when applicable.
2. **New Angular route** — add UI screens bullet with path and `*.routes.ts` link; update summary matrix UI column.
3. **Workflow UX** (shortcuts, POS, print, scan) — update UX status and UX gaps only; use **UI-** prefix for new gap IDs.
4. **New module guide** — link from **Maturity & known gaps** to the anchor in this file.
5. Prefer **Implemented** only when the layer is usable end-to-end, not after schema-only or stub code.

**Source-of-truth paths**

| Layer | Where to verify |
|-------|-----------------|
| Backend | `backend/src/<module>/`, `backend/test/` |
| UI routes | `src/app/features/<module>/*.routes.ts` |
| UI nav | `src/app/components/shell/nav.config.ts` |
| UX shortcuts | `src/app/core/keyboard/`, [early-foundations.md](../architecture/early-foundations.md) |
| Backend gaps | [workflow-gap-index.md](../workflows/workflow-gap-index.md) |

---

## References

- [Workflow gap index](../workflows/workflow-gap-index.md)
- [Functional overview](./functional-overview.md)
- [User experience](./user-experience.md)
- [Integrations and devices](./integrations-and-devices.md)
- [Workflow handbook](../workflows/README.md)
