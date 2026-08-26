---
name: docs consolidation
overview: Consolidate the 268-file architecture docs down to ~110 by merging each domain bounded context into a single file and merging per-table DB specs into their per-category file, while keeping architecture/workflows/roadmap as-is.
todos:
  - id: domain-customer
    content: Merge domain/customer/* into domain/customer.md (sections only where content exists), move Future to roadmap, delete old files
    status: pending
  - id: domain-sales
    content: Merge domain/sales/* into domain/sales.md; fold quotation/sales-order into a 'not in schema' note
    status: pending
  - id: domain-inventory
    content: Merge domain/inventory/* into domain/inventory.md
    status: pending
  - id: domain-product
    content: Merge domain/product/* into domain/product.md
    status: pending
  - id: domain-finance
    content: Merge domain/finance/* into domain/finance.md
    status: pending
  - id: domain-purchasing
    content: Merge domain/purchasing/* into domain/purchasing.md
    status: pending
  - id: domain-supplier
    content: Merge domain/supplier/* into domain/supplier.md
    status: pending
  - id: db-merge
    content: Fold numbered per-table files into each per-category file, strip embedded Prisma blocks (link schema.prisma), fix wiki-links to anchors, delete numbered files
    status: pending
  - id: indexes-links
    content: Update domain/README.md (incl. convention), top README.md, database_overview.md, and repoint all links to deleted files across docs/, AGENTS.md, and .cursor rules
    status: pending
isProject: false
---

## Docs Consolidation Plan

Goal: reduce `docs/pharmacy_erp_architecture_docs/` from **268 files to ~110** without losing real content. Root cause of bloat: a rigid 11-section template applied to ~90 tiny domain files, plus every DB table documented twice (per-category summary + numbered per-table file with a redundant embedded Prisma model).

Decisions confirmed:
- DB: keep **per-category** files as the single source of truth; fold numbered per-table content in, delete numbered files.
- Domain: **one file per bounded context**; include a section only if it has content.

Leave untouched: `architecture/` (13 topic files), `workflows/` (9 flow files), `roadmap/` (5 files), `ANCHOR_FACTS.md`, and top-level overview docs. These have sensible granularity.

### Phase 1 - Domain: 7 contexts x ~13 files -> 7 files

For each context under [docs/pharmacy_erp_architecture_docs/domain/](docs/pharmacy_erp_architecture_docs/domain), merge all sub-files into a single `<context>.md` (e.g. `domain/customer.md`), then delete the old sub-folder files.

Target section order (omit any section with no real content):

```
# <Context>
## Overview & Aggregate      <- aggregate.md
## Terminology               <- terminology.md
## Business Rules & Invariants  <- business-rules.md + invariants.md + validation.md
## Lifecycle & States        <- lifecycle.md + state-machine.md
## Domain Events             <- events.md
## Permissions               <- permissions.md
## Workflows                 <- workflows.md + entity files (invoice/payment/return/etc.)
## Integrations              <- integration.md
```

Merge map per context (source file count -> 1):
- `customer/` (13): aggregate, terminology, business-rules, invariants, validation, lifecycle, state-machine, events, permissions, workflows, integration, future, README
- `sales/` (13): aggregate, invoice, payment, return, pricing, quotation, sales-order, validation, events, permissions, workflows, future, README
- `inventory/` (14): aggregate, batch, stock, adjustments, costing, valuation, reservation, expiry, business-rules, validation, events, workflows, future, README
- `product/` (14): aggregate, lifecycle, state-machine, pricing, inventory, supplier, terminology, business-rules, validation, events, permissions, workflows, future, README
- `finance/` (12): aggregate, accounting, ledger, journal, taxation, reconciliation, business-rules, validation, events, workflows, future, README
- `purchasing/` (13): aggregate, purchase-order, goods-receipt, purchase-invoice, purchase-return, approval-flow, supplier-selection, business-rules, validation, events, workflows, future, README
- `supplier/` (12): aggregate, contracts, payments, lifecycle, terminology, business-rules, validation, events, permissions, workflows, future, README

Rules while merging:
- Move all "Future Enhancements" blurbs OUT to [roadmap/future-roadmap.md](docs/pharmacy_erp_architecture_docs/roadmap/future-roadmap.md); delete the per-file "Future" sections/files. Docs then describe only what exists.
- Drop empty/filler template sections (e.g. `permissions.md`'s empty "Domain Events"/"Performance" headings) instead of writing "N/A".
- `sales/quotation.md` and `sales/sales-order.md` describe tables the schema does not have (confirmed by [tables/sales/sales.md](docs/pharmacy_erp_architecture_docs/database/tables/sales/sales.md) line 5). Fold their intent into a single "Not in current schema" note under Future/roadmap rather than a full section.

### Phase 2 - Database: fold numbered files into per-category files

The ~13 per-category files (e.g. [tables/sales/sales.md](docs/pharmacy_erp_architecture_docs/database/tables/sales/sales.md)) are summaries that wiki-link to numbered detail files (e.g. `[[38_sales_invoice]]`). The numbered files (~74) hold the real column/constraint/index specs plus a redundant embedded Prisma model.

For each category folder under [tables/](docs/pharmacy_erp_architecture_docs/database/tables):
- Merge each numbered file's **Columns / Constraints / Indexes / Notes** into the category file, one `## <TableName>` subsection per table, in numeric order.
- **Delete the embedded `prisma` model blocks** (they duplicate and drift from `backend/prisma/schema.prisma`); replace with a one-line pointer to the schema model.
- Replace the `[[38_sales_invoice]]` wiki-links in the "Tables" list with in-page anchors to the new subsections.
- Delete the numbered per-table files after their content is merged.

Result: one self-contained spec file per table category (diagram + how-they-work-together + full per-table detail).

### Phase 3 - Fix indexes, links, and the convention

- Update [domain/README.md](docs/pharmacy_erp_architecture_docs/domain/README.md): point the bounded-context table to the new single `<context>.md` files; **replace the "each file documents all 11 sections" convention (lines 26-28)** with "one file per bounded context; include a section only when it has content."
- Update [README.md](docs/pharmacy_erp_architecture_docs/README.md) and [database/database_overview.md](docs/pharmacy_erp_architecture_docs/database/database_overview.md) links that point at deleted files.
- Grep the whole `docs/` tree for links to any deleted path (numbered table files, domain sub-files, wiki-links) and repoint them. Also check `backend/AGENTS.md` and `.cursor/rules/00-project-context.mdc` for references (e.g. the customer `aggregate.md` link).

### Expected outcome

- Domain: 93 -> ~9 files (7 context files + README + ANCHOR_FACTS)
- Database tables: ~87 -> ~13 files
- Total docs: ~268 -> ~110, single source of truth per topic, no embedded Prisma copies, implemented vs future cleanly separated.

Note: this is documentation-only; no code or schema changes. I will preserve each file's existing line-ending style per the repo change policy.