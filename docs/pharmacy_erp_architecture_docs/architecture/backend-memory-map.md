# Backend Memory Map — Architectural Decision History

**Status:** Active (decision recovery in progress)  
**Last updated:** 2026-09-10  
**Companion doc:** [Backend Developer Guide](./backend-developer-guide.md) — onboarding, wiring, module capsules, E2E flows

This document preserves **why** the backend is designed the way it is: questions asked, options considered, choices made, trade-offs, and evolution over time. It does **not** replace the developer guide for day-to-day implementation reference.

**How to use:**

1. Search the [Architectural Decision Index](#architectural-decision-index) for a topic or module.
2. Open the linked ADR in [`adrs/`](./adrs/) for full context (question, options, rationale, confidence).
3. Use the [Module-to-decision map](#module-to-decision-map) to see coverage gaps.
4. For wiring and file locations, use the [Backend Developer Guide](./backend-developer-guide.md).

---

## Table of contents

- [Architectural Decision Index](#architectural-decision-index)
- [Foundational decisions](#foundational-decisions)
- [Module-to-decision map](#module-to-decision-map)
- [Decision dependency graph](#decision-dependency-graph)
- [Rejected alternatives index](#rejected-alternatives-index)
- [Processing log](#processing-log)
- [Recovery audit (final)](#recovery-audit-final)

---

## Architectural Decision Index

| ID | Decision | Module(s) | Status | Confidence | Source |
|----|----------|-------------|--------|------------|--------|
| [ADR-001](./adrs/ADR-001-sqlite-postgres-single-schema.md) | SQLite + PostgreSQL from one Prisma schema | Infrastructure | Active | Explicit | Doc 01 |
| [ADR-002](./adrs/ADR-002-string-status-not-enums.md) | String status fields, not Prisma enums | All modules | Active | Explicit | Doc 01 |
| [ADR-003](./adrs/ADR-003-multi-branch-stock-per-batch.md) | Stock per (branchId, batchId) | Inventory | Active | Explicit | Doc 01 |
| [ADR-004](./adrs/ADR-004-sync-entity-uuid-identity.md) | Outbox uses entityUuid + deviceId | Sync, persistence | Active | Explicit | Doc 01 |
| [ADR-005](./adrs/ADR-005-branch-scoped-document-numbers.md) | Document numbers unique per branch | Sequence, workflows | Active | Explicit | Doc 01 |
| [ADR-006](./adrs/ADR-006-unit-of-work-all-writes.md) | All writes via UnitOfWorkService.run | Persistence, all modules | Active | Explicit | Doc 02 |
| [ADR-007](./adrs/ADR-007-outbox-in-same-transaction.md) | Outbox in same transaction | Persistence, sync | Active | Explicit | Doc 02 |
| [ADR-008](./adrs/ADR-008-inventory-ledger-only-stock-path.md) | InventoryLedgerService only stock path | Inventory, purchase, sales | Active | Explicit | Doc 02 |
| [ADR-009](./adrs/ADR-009-bigint-id-extension-sqlite.md) | BIGINT id Prisma extension | Prisma | Active | Explicit | Doc 02 |
| [ADR-010](./adrs/ADR-010-request-context-async-local-storage.md) | RequestContext AsyncLocalStorage | Persistence | Active | Explicit | Doc 02 |

Full records: [`adrs/`](./adrs/)

---

## Foundational decisions

Cross-cutting decisions that constrain multiple modules. Listed here for quick reference; detail in linked ADRs.

| Theme | ADR IDs | Notes |
|-------|---------|-------|
| Database & persistence | ADR-001–010 | Schema, UoW, outbox, ledger, context |
| Auth & tenant scope | — | Pending Doc 04 |
| Offline-first & sync | — | Pending Tier 1 recovery |
| Module boundaries | — | Pending Tier 2 recovery |

---

## Module-to-decision map

| Module | ADR count | Sources processed | Gaps / needs confirmation |
|--------|-----------|-------------------|---------------------------|
| Infrastructure / persistence | 10 | Doc 01–02 | — |
| Inventory | 1 | Doc 02 | ADR-008 |
| Auth | 0 | — | Pending |
| Audit | 0 | — | Pending |
| Security | 0 | — | Pending |
| Masters | 0 | — | Pending |
| Party | 0 | — | Pending |
| Medicine | 0 | — | Pending |
| Configuration | 0 | — | Pending |
| Settings | 0 | — | Pending |
| Pricing | 0 | — | Pending |
| Prescription | 0 | — | Pending |
| Inventory | 0 | — | Pending |
| Purchase | 0 | — | Pending |
| Sales | 0 | — | Pending |
| Finance | 0 | — | Pending |
| Sync | 1 | Doc 01 | ADR-004 |
| Reporting | 0 | — | Pending |

---

## Decision dependency graph

High-level chains only. Detail in individual ADRs.

```mermaid
flowchart TB
  placeholder[Recovery in progress]
```

---

## Rejected alternatives index

Quick lookup of approaches explicitly **not** chosen. See ADRs for full context.

| ADR | Rejected approach | Reason (if recorded) |
|-----|-------------------|----------------------|
| — | — | — |

---

## Processing log

Documents analyzed in dependency order. One git commit per row when complete.

| Doc # | Source | Commit | Status |
|-------|--------|--------|--------|
| — | Scaffold | 4d6aeb4 | Done |
| 01 | `plans/pharmacy_erp_db_review_cfc2c0b5.plan.md` | c763869 | Done |
| 02 | `plans/persistence_foundation_patterns_3af5df7a.plan.md` | — | In progress |

---

## Recovery audit (final)

*Populated after Doc 28 final audit.*

### Documents processed

*Pending*

### Decision counts

| Category | Count |
|----------|-------|
| Explicit | 0 |
| Strongly inferred | 0 |
| Weakly inferred | 0 |
| Superseded | 0 |
| Refined | 0 |
| Needs confirmation | 0 |

### Cross-module decisions

*Pending*

### Git commits

| Doc # | SHA | Message |
|-------|-----|---------|
| — | — | — |

---

*Decision recovery follows [templates/adr-template.md](./templates/adr-template.md). Wiring reference: [Backend Developer Guide](./backend-developer-guide.md).*
