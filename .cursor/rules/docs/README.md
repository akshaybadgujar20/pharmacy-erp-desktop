# Module memory docs

Agent-facing memory models for implemented backend feature modules. These docs are **grounded in code** (routes, files, permissions, workflows) and are meant to give Cursor agents fast, accurate context without re-deriving the module from scratch.

## How this differs from architecture docs

| Location | Purpose |
|----------|---------|
| `.cursor/rules/docs/` (here) | Implementation memory — API catalog, file map, golden rules, status machines |
| `docs/pharmacy_erp_architecture_docs/` | Long-form domain and database design — table specs, business rules, cross-module flows |
| [backend-developer-guide.md](../../../docs/pharmacy_erp_architecture_docs/architecture/backend-developer-guide.md) | **Hub** — onboarding, module index, relationships, E2E flows, appendices |

Read architecture docs for *why* and table design. Read the [backend developer guide](../../../docs/pharmacy_erp_architecture_docs/architecture/backend-developer-guide.md) for *cross-module* views and onboarding. Read memory docs here for *what is implemented* and *where to edit*.

## Current entries

| Doc | Module | Scoped rule |
|-----|--------|-------------|
| [audit-module.md](audit-module.md) | `backend/src/audit/` | [audit-module.mdc](../audit-module.mdc) |
| [configuration-module.md](configuration-module.md) | `backend/src/configuration/` | [configuration-module.mdc](../configuration-module.mdc) |
| [finance-module.md](finance-module.md) | `backend/src/finance/` | [finance-module.mdc](../finance-module.mdc) |
| [inventory-module.md](inventory-module.md) | `backend/src/inventory/` | [inventory-module.mdc](../inventory-module.mdc) |
| [masters-module.md](masters-module.md) | `backend/src/masters/` | [masters-module.mdc](../masters-module.mdc) |
| [medicine-module.md](medicine-module.md) | `backend/src/medicine/` | [medicine-module.mdc](../medicine-module.mdc) |
| [party-module.md](party-module.md) | `backend/src/party/` | [party-module.mdc](../party-module.mdc) |
| [prescription-module.md](prescription-module.md) | `backend/src/prescription/` | [prescription-module.mdc](../prescription-module.mdc) |
| [pricing-module.md](pricing-module.md) | `backend/src/pricing/` | [pricing-module.mdc](../pricing-module.mdc) |
| [purchase-module.md](purchase-module.md) | `backend/src/purchase/` | [purchase-module.mdc](../purchase-module.mdc) |
| [sales-module.md](sales-module.md) | `backend/src/sales/` | [sales-module.mdc](../sales-module.mdc) |
| [security-module.md](security-module.md) | `backend/src/security/` | [security-module.mdc](../security-module.mdc) |
| [sync-module.md](sync-module.md) | `backend/src/sync/` | [sync-module.mdc](../sync-module.mdc) |

## Adding a new module doc

1. Create `<module>-module.md` in this folder following the inventory template (snapshot, domain model, API catalog, layer map, conventions, cross-cutting refs).
2. Add a scoped `.mdc` rule in `.cursor/rules/` with `globs: backend/src/<module>/**`.
3. Link the rule to the full markdown doc (keep `.mdc` under ~80 lines).
4. Add an entry to this README, a capsule in [backend-developer-guide.md](../../../docs/pharmacy_erp_architecture_docs/architecture/backend-developer-guide.md), and optionally a bullet in `backend/AGENTS.md`.

Keep memory docs updated when routes, permissions, or workflow behavior change.
