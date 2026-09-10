# ADR-026: Reporting module read-only — no UnitOfWork or outbox

**Status:** Active  
**Confidence:** Strongly inferred  
**Modules:** Reporting

---

## Problem / Context

Reports must not mutate business data.

## Question Discussed

Should reports use persistence write path?

## Options Considered

1. Prisma reads only
2. Full audit on report run

## Decision Selected

Prisma direct reads; getTenantScope for branch filter; no UoW.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

See options not selected above; reasons not explicitly recorded.

## Historical Source

- Doc 10 — reporting.md; developer guide Reporting capsule
