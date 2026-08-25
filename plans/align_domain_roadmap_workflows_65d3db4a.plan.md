---
name: Align domain roadmap workflows
overview: Fully author every domain/ doc with content aligned to the actual 74-model Prisma schema and implemented backend, align roadmap/ to implemented-vs-planned reality, and verify/touch-up workflows/. Exclude exiting_product_analysis/.
todos:
  - id: anchors
    content: Compile the anchor-facts + vocabulary-mapping reference (from architecture-review.md, early-foundations.md, prisma/**) to apply consistently across all docs.
    status: completed
  - id: domain-product
    content: Author product/* domain docs (14) aligned to Medicine master schema.
    status: completed
  - id: domain-inventory
    content: Author inventory/* domain docs (14) aligned to Batch/Stock/StockMovement and branch scoping.
    status: completed
  - id: domain-sales
    content: Author sales/* domain docs (13); reframe sales-order/quotation as not-modeled/future.
    status: completed
  - id: domain-purchasing
    content: Author purchasing/* domain docs (11) aligned to PO/GRN/Invoice/Return chain.
    status: completed
  - id: domain-customer
    content: Author customer/* domain docs (13) aligned to Party+Customer role and loyalty.
    status: completed
  - id: domain-supplier
    content: Author supplier/* domain docs (12) aligned to Party+Supplier role and payments.
    status: completed
  - id: domain-finance
    content: Author finance/* domain docs (12) aligned to Ledger/LedgerEntry/Payment/Receipt/Expense/Tax.
    status: completed
  - id: domain-readme
    content: Update domain/README.md index to reflect the 7 contexts and schema linkage.
    status: completed
  - id: roadmap
    content: Align roadmap/* (future-roadmap, migration, localization, disaster-recovery) to implemented-vs-planned reality.
    status: completed
  - id: workflows
    content: Verify and touch up workflows/* (8 flows) for schema alignment; fix drift only.
    status: completed
isProject: false
---

# Align domain, roadmap, and workflows docs to Prisma + implementation

## Scope
- Fully author all `domain/**` files (~90, currently empty templates).
- Align `roadmap/**` (4 files) to implemented-vs-planned reality.
- Verify and touch up `workflows/**` (8 flows; already mostly aligned).
- Exclude `exiting_product_analysis/**` entirely.

## Anchor facts (every doc must reflect these decided decisions)
Source of truth: [database/architecture-review.md](docs/pharmacy_erp_architecture_docs/database/architecture-review.md), [architecture/early-foundations.md](docs/pharmacy_erp_architecture_docs/architecture/early-foundations.md), and `backend/prisma/**`.
- Identity: hybrid `BigInt @id` (local) + `uuid @unique @default(uuid())` (sync). Sync keys on `uuid`, never local id.
- No Prisma enums — `String` status fields with documented allowed values.
- Inventory: `Batch` = org-global lot (`purchaseRate` cost + statutory `mrp`); `Stock` = per-branch balance `@@unique([branchId, batchId])`; sale pricing in branch-scoped `PriceList`/`PriceListItem` (not on Batch). `StockMovement` = immutable ledger.
- Branch-scoped document numbers (`invoiceNumber`, `movementNumber`, etc.), via `SequenceGenerator`.
- Transactional outbox: `Outbox` uses `entityUuid`, `deviceId`, `operationId`, `sequenceNo`; enqueue in same `UnitOfWork` transaction; conflict via `entityVersion`.
- Auth/RBAC: JWT + `UserSession` refresh + bcrypt + global guards; permissions `MODULE:RESOURCE:ACTION`.
- Config via `AppSetting` + `SettingsService` (branch -> company fallback); audit via `AuditService` in-transaction.
- Offline-first SQLite local, Postgres cloud, sync deferred.

## Vocabulary mapping (domain context -> actual schema)
- `product/*` -> Medicine master: `Medicine`, `MedicineGeneric`, `MedicineCategory`, `MedicineSchedule`, `Manufacturer`, `SaltComposition`, `MedicineSalt`, `UnitOfMeasure`. Rename "Product" concept to Medicine; `product/pricing.md` -> `PriceList`/`PriceListItem` + `Tax`; `product/supplier.md` -> Manufacturer/Supplier via `Party`.
- `customer/*` -> `Party` + `Customer` role (party_management); loyalty via `LoyaltyProgram`/`LoyaltyTransaction`.
- `supplier/*` -> `Party` + `Supplier` role; `supplier/payments.md` -> `Payment`; `supplier/contracts.md` marked not-modeled/future.
- `inventory/*` -> `Batch`, `Stock`, `StockMovement`, `StockAdjustment(+Item)`, `StockTransfer(+Item)`, `StockTake(+Item)`; `costing`/`valuation` = lot cost on Batch + movement ledger (no separate valuation table -> document as derived).
- `purchasing/*` -> `PurchaseOrder(+Item)`, `GoodsReceipt(+Item)`, `PurchaseInvoice(+Item)`, `PurchaseReturn(+Item)`.
- `sales/*` -> invoice-first: `SalesInvoice(+Item)`, `SalesReturn(+Item)`, `SalesPayment`. `sales/sales-order.md` and `sales/quotation.md` reframed as NOT modeled yet (future), since no SalesOrder/Quotation tables exist.
- `finance/*` -> `Ledger`, `LedgerEntry`, `Payment`, `Receipt`, `Expense`, `Tax`; `journal`/`accounting` = `LedgerEntry` double-entry.

## Domain doc content approach
Keep the existing section skeleton (Purpose, Responsibilities, Scope, Related Entities, Business Rules, Domain Events, State Model, Integrations, Security, Performance, Future) but replace placeholder text with real, schema-accurate content per file, tailored to the file's focus:
- `README.md` (per context): bounded-context summary + entity list + links to table specs under `database/tables/<category>/`.
- `aggregate.md`: aggregate root, entities, invariants, consistency boundary (transaction scope).
- `business-rules.md` / `validation.md` / `invariants.md`: concrete rules from schema constraints (uniqueness, branch scope, FEFO, expiry, credit limits).
- `events.md`: domain events matched to outbox entity types (e.g. `SaleCompleted`, `StockUpdated`).
- `state-machine.md` / `lifecycle.md`: real status strings from schema (e.g. PO DRAFT->APPROVED->RECEIVED->CLOSED).
- `permissions.md`: `MODULE:RESOURCE:ACTION` permissions matching seed data.
- `future.md`: genuinely deferred items (sync worker, quotations/sales-orders, contracts).
Cross-link to relevant `database/tables/<category>/<category>.md` overview and specific `NN_*.md` specs.

## Roadmap alignment (4 files)
- `future-roadmap.md`: move now-foundational items (multi-branch, offline-first) to an "Already implemented" list; keep true future items; drop `> Source: Original Architecture Handbook` banner.
- `migration.md`, `localization.md`, `disaster-recovery.md`: reconcile with implemented reality (i18n `@ngx-translate` + `en-IN`, SQLite backup posture, Prisma migration approach) and mark deferred parts.

## Workflows verification (8 files)
`sales-flow.md` is already aligned. Verify `purchase-flow`, `inventory-flow`, `payment-flow`, `return-flow`, `stock-adjustment`, `stock-transfer`, `month-end-closing` use: branch-scoped Stock/movements, `entityUuid` outbox, `SequenceGenerator` numbers, String statuses, in-transaction audit. Fix any drift only.

## Out of scope
- `exiting_product_analysis/**` — excluded.
- No Prisma/schema or backend code changes; docs only.
- `database/**` table specs and `party_management.md`-style overviews unchanged (only cross-linked).