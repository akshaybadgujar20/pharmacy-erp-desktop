# Architecture Decision Records (ADRs)

Full decision records recovered from historical chats, plans, and architecture docs.

## Index

The canonical navigable index lives in [Backend Memory Map](../backend-memory-map.md#architectural-decision-index).

## ID convention

- Format: `ADR-001`, `ADR-002`, … (three digits, zero-padded)
- Filename: `ADR-001-short-slug.md`
- IDs are **stable** once assigned — never renumber

## When to add a new ADR

After any architectural choice with alternatives, cross-module impact, or hard-to-rediscover context. Copy [templates/adr-template.md](../templates/adr-template.md) and add a row to the memory map index.

## Confidence levels

| Level | Meaning |
|-------|---------|
| **Explicit** | Question, options, and choice in source |
| **Strongly inferred** | Clear from plan lock-in or implementation |
| **Weakly inferred** | Indications only — use Needs Confirmation |

## Records (recovered 2026-09-10)

| Range | Theme |
|-------|-------|
| ADR-001–005 | Database schema (Doc 01) |
| ADR-006–010 | Persistence foundation (Doc 02) |
| ADR-011 | Ledger posting (Doc 03) |
| ADR-012–014, 018–019 | Early foundations (Doc 04) |
| ADR-016–017 | Logging vs audit (Doc 05) |
| ADR-015, 020 | Party template (Doc 06) |
| ADR-021–026 | Architecture docs (Doc 07–10) |
| ADR-047–053, 135 | Purchase (Doc 12) |
| ADR-055–056, 064–065 | Finance (Doc 13) |
| ADR-068–069, 072, 076, 136 | Sales (Doc 14) |
| ADR-080, 086 | Security (Doc 15) |
| ADR-089 | Medicine (Doc 16) |
| ADR-101 | Pricing/Prescription/Audit (Doc 17) |
| ADR-114, 127, 130, 138 | SCM (Doc 18) |
| ADR-133–134 | Documentation governance (Doc 25–26) |
| ADR-137 | Cross-module coupling (Doc 09) |

See memory map for full table with status and confidence per ADR.
