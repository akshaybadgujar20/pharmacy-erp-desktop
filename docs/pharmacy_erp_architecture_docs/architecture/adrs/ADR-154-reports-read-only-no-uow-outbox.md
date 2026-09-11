# ADR-154: Reports are read-only — no UnitOfWork, Outbox, or Audit

**Status:** Active  
**Confidence:** Explicit  
**Modules:** reporting

---

## Problem / Context

Report runs must not create side effects or sync events.

## Question Discussed

Which persistence services may report providers use?

## Options Considered

1. PrismaService read-only only
2. Full mutation stack with audit/outbox
3. UnitOfWork without outbox

## Decision Selected

Use `PrismaService.client` directly — no `UnitOfWorkService`, `OutboxService`, or `AuditService` on report runs.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Full mutation stack with audit/outbox; UnitOfWork without outbox

## Historical Source

- Doc 10 — subagent draft ADR-036

**Phase 2 draft cross-ref:** subagent draft ADR-036

