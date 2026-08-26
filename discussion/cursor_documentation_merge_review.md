# Documentation merge review
_Exported on 8/26/2026 at 13:19:01 GMT+5:30 from Cursor (3.17.8)_

---

**User**

@docs these lookstoo much for single developer. can you review and find if we can merge and maintainbale ?

---

**Cursor**

I'll review the docs structure to assess whether it can be consolidated for a single developer to maintain.

That's a large docs tree (268 files). Let me understand the full structure and depth before making recommendations.

Let me gauge how granular these files are by sampling several and checking their sizes.

Let me see the full per-domain breakdown and check the database tables structure (which has both aggregate `.md` and per-table numbered files).

Let me check the architecture folder and verify whether the READMEs reference files that actually exist (potential broken-link maintenance issue).

I've reviewed the full `docs/pharmacy_erp_architecture_docs` tree. Here's my honest assessment and a concrete consolidation plan. (I'm in Ask mode, so this is a recommendation — I haven't changed anything.)

## What's actually there

268 files, roughly:

| Area | Files | Structure |
|------|------:|-----------|
| `architecture/` | 13 | One topic per file (reasonable) |
| `workflows/` | 9 | One flow per file (reasonable) |
| `roadmap/` | 5 | migration, DR, localization, future-roadmap |
| `domain/` | ~93 | **7 bounded contexts × ~13 files each** |
| `database/` | ~92 | Per-category aggregate file **and** per-table numbered file |

The `architecture/`, `workflows/`, and `roadmap/` folders are fine — sensible granularity. **The bloat is concentrated in `domain/` and `database/tables/`.**

## Why it feels like too much (root causes)

**1. A rigid 11-section template forced onto every domain file.**
Every file (`aggregate.md`, `events.md`, `permissions.md`, `terminology.md`, …) repeats the same headings: Purpose, Responsibilities, Scope (In/Out), Related Entities, Business Rules, Domain Events, State Model, Integrations, Security, Performance, Future Enhancements. So `permissions.md` and `terminology.md` both carry near-empty "Domain Events" and "Performance Considerations" sections. That's a lot of filler-per-file, and it multiplies across ~90 files.

**2. Each bounded context is shattered into ~13 tiny files.**
`customer/` alone has: `aggregate, business-rules, events, invariants, lifecycle, state-machine, permissions, terminology, validation, workflows, integration, future, README`. For a single developer, `invariants` + `business-rules` + `validation`, and `lifecycle` + `state-machine`, are the same conversation split across files.

**3. The database docs describe every table twice.**
There's a category aggregate (e.g. `tables/sales/sales.md`) *and* per-table files (`39_sales_invoice_item.md`). The per-table files also embed the full Prisma model — which already lives in `schema.prisma` — so it's a third copy that drifts.

**4. Aspirational content is mixed into "current" docs.**
`terminology.md` links to `sales/terminology.md` "when available" (doesn't exist), and "Future Enhancements" / "Planned" sit inline in every file, so you can't tell implemented from wishlist without reading each one.

## Recommended consolidation

Target: **~268 → ~70–90 files**, without losing real content.

**A. Collapse each domain to one file (7 files instead of ~90).**
Turn each bounded context into a single `domain/<context>.md` with fixed sections:

```
# <Context>
## Overview & Aggregate      (aggregate.md)
## Terminology               (terminology.md)
## Business Rules & Invariants  (business-rules + invariants + validation)
## Lifecycle & States        (lifecycle + state-machine)
## Domain Events             (events.md)
## Permissions               (permissions.md)
## Workflows                 (workflows.md + entity files: invoice/payment/return)
## Future                    (future.md)
```

Only split back out (e.g. keep `sales/invoice.md`) if a section genuinely exceeds ~300 lines. Drop empty template sections instead of writing "N/A".

**B. Database: pick one source of truth per table.**
Keep the per-category files (`tables/sales/sales.md`) as the readable spec, and **delete the embedded Prisma blocks** — link to `schema.prisma` instead. Either keep the numbered per-table files *or* the category file, not both. For a solo dev, the category file (one per domain area) is enough; that alone removes ~50+ files.

**C. Pull "Future Enhancements" out of every file** into the existing `roadmap/future-roadmap.md`. This makes the remaining docs describe only what exists.

**D. Merge thin roadmap/architecture pairs** where they exist (e.g. keep DR/localization only if they have real content; otherwise fold into `future-roadmap.md`).

## What to keep as-is
- `architecture/` (13 topic files) — good separation.
- `workflows/` (9 flow files) — these are the highest-value docs; leave them.
- `ANCHOR_FACTS.md` and the top-level `README.md` indexes.

## Maintainability guardrail going forward
The real fix is dropping the "every file gets all 11 sections" convention documented in `domain/README.md` (lines 26–28). Replace it with: *one file per bounded context; include a section only if it has content.* Otherwise the sprawl regrows.

Want me to draft the exact merged `domain/customer.md` as a concrete example of the target format, or produce a full file-by-file merge/delete list you can execute? (I'd need you to switch to Agent mode for me to actually perform the merges.)

---

**User**

create a plan for the same

---

**Cursor**

Before I write the plan, two decisions materially change its shape.

> **The database docs describe every table twice: a per-category file (e.g. tables/sales/sales.md) AND per-table numbered files (e.g. 39_sales_invoice_item.md, which also embed a full Prisma model copy). Which should be the single source of truth?**
> - Keep per-category files, delete numbered per-table files (Recommended: ~50+ files removed, one readable spec per area) ✔
> - Keep numbered per-table files, delete/slim category files to just an index
> - Keep both, but strip embedded Prisma blocks and add a note pointing to schema.prisma

> **How aggressively should the domain/ folder be merged (currently 7 contexts x ~13 files)?**
> - One file per bounded context (7 files total), sections only when they have content (Recommended) ✔
> - Split into 2-3 files per context (e.g. model.md, rules.md, workflows.md)
> - Keep files split but just delete empty template sections and move Future to roadmap

Let me gather the precise file inventory so the plan is fully actionable.

I have what I need. Here's the consolidation plan.

---

**User**

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

**Cursor**

I'll start with the customer domain merge, then work through the remaining contexts and database files.


Creating the consolidated `customer.md`, then parallelizing the remaining domain merges.


Writing a script to merge numbered table files into their category files.


DB merge is done. Updating indexes, links, and the future roadmap.


Docs consolidation is complete. Summary:

## Results

| Area | Before | After |
|------|--------|-------|
| **Domain** | ~93 files (7 folders × ~13 files) | **9 files** (7 context docs + `README.md` + `ANCHOR_FACTS.md`) |
| **Database tables** | ~87 files (category + numbered) | **15 files** (13 category specs + `table_catalog.md`) |
| **Total `pharmacy_erp_architecture_docs/`** | ~268 | **~100** (unchanged: architecture, workflows, roadmap, legacy analysis) |

## What changed

**Phase 1 — Domain:** Each bounded context is now a single file:
- `domain/customer.md`, `sales.md`, `inventory.md`, `product.md`, `finance.md`, `purchasing.md`, `supplier.md`
- Template boilerplate removed; empty sections dropped
- Future work moved to `roadmap/future-roadmap.md` (per-domain sections + new **Customer** section)
- `SalesOrder` / `Quotation` noted under **Deferred / not modeled**

**Phase 2 — Database:** 72 numbered per-table files merged into their category files (e.g. `tables/sales/sales.md`). Each table section now has column/constraint/index specs; embedded Prisma blocks replaced with pointers to `backend/prisma/schema.prisma`.

**Phase 3 — Indexes & links:** Updated:
- `domain/README.md` (new convention: one file per context, future in roadmap)
- Top `README.md` (Domain section added)
- `database/database_overview.md` (structure + module links)
- `ANCHOR_FACTS.md`, `AGENTS.md`, `persistence-patterns.md`, `early-foundations.md`, `logging-and-audit.md`, `architecture-review.md`, `prisma_sqlite_jpa_postgres_alignment.md`

**Unchanged (as planned):** `architecture/` (13), `workflows/` (9), `roadmap/` (5).

## Maintainability going forward

- **Domain:** edit one file per context; add sections only when they have content
- **Database:** edit one category file; don’t recreate per-table files or duplicate Prisma in docs
- **Future work:** add to `roadmap/future-roadmap.md`, not inline in domain docs

