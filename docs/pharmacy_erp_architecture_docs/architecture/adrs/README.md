# Architecture Decision Records (ADRs)

Full decision records recovered from historical chats, plans, and architecture docs.

## Index

The canonical index lives in [Backend Memory Map](../backend-memory-map.md#architectural-decision-index).

## ID convention

- Format: `ADR-001`, `ADR-002`, … (three digits, zero-padded)
- Filename: `ADR-001-short-slug.md` (slug matches title)
- IDs are **stable** once assigned — never renumber
- Index in `backend-memory-map.md` is the source of truth

## When to add a new ADR

After any architectural choice that:

- Was discussed with alternatives
- Affects multiple modules
- Would be costly to rediscover later
- Changes or refines a prior decision (mark old ADR as Superseded or Refined)

Copy [templates/adr-template.md](../templates/adr-template.md) and add a row to the memory map index.

## Confidence levels

| Level | Meaning |
|-------|---------|
| **Explicit** | Question, options, and choice directly present in source |
| **Strongly inferred** | Choice clear from plan lock-in table or implementation, not one explicit sentence |
| **Weakly inferred** | Indications only — mark `Needs Confirmation` if uncertain |

Do not invent rationale. State when reasoning was not recorded.

## Records

| File | Title | Status |
|------|-------|--------|
| — | *Recovery in progress* | — |
