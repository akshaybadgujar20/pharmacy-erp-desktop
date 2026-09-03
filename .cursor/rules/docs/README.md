# Module memory docs

Agent-facing memory models for implemented backend feature modules. These docs are **grounded in code** (routes, files, permissions, workflows) and are meant to give Cursor agents fast, accurate context without re-deriving the module from scratch.

## How this differs from architecture docs

| Location | Purpose |
|----------|---------|
| `.cursor/rules/docs/` (here) | Implementation memory — API catalog, file map, golden rules, status machines |
| `docs/pharmacy_erp_architecture_docs/` | Long-form domain and database design — table specs, business rules, cross-module flows |

Read architecture docs for *why* and table design. Read memory docs for *what is implemented* and *where to edit*.

## Current entries

| Doc | Module | Scoped rule |
|-----|--------|-------------|
| [inventory-module.md](inventory-module.md) | `backend/src/inventory/` | [inventory-module.mdc](../inventory-module.mdc) (`backend/src/inventory/**`) |
| [party-module.md](party-module.md) | `backend/src/party/` | [party-module.mdc](../party-module.mdc) (`backend/src/party/**`) |

## Adding a new module doc

1. Create `<module>-module.md` in this folder following the inventory template (snapshot, domain model, API catalog, layer map, conventions, cross-cutting refs).
2. Add a scoped `.mdc` rule in `.cursor/rules/` with `globs: backend/src/<module>/**`.
3. Link the rule to the full markdown doc (keep `.mdc` under ~80 lines).
4. Add an entry to this README and optionally a bullet in `backend/AGENTS.md`.

Keep memory docs updated when routes, permissions, or workflow behavior change.
