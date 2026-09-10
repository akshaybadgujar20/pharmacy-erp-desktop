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
| — | *No ADRs recorded yet — recovery in progress* | — | — | — | — |

Full records: [`adrs/`](./adrs/)

---

## Foundational decisions

Cross-cutting decisions that constrain multiple modules. Listed here for quick reference; detail in linked ADRs.

| Theme | ADR IDs | Notes |
|-------|---------|-------|
| Database & persistence | — | Pending Tier 0 recovery |
| Auth & tenant scope | — | Pending Tier 0 recovery |
| Offline-first & sync | — | Pending Tier 1 recovery |
| Module boundaries | — | Pending Tier 2 recovery |

---

## Module-to-decision map

| Module | ADR count | Sources processed | Gaps / needs confirmation |
|--------|-----------|-------------------|---------------------------|
| Infrastructure / persistence | 0 | — | Pending |
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
| Sync | 0 | — | Pending |
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
| — | Scaffold | — | In progress |

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
