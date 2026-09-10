# ADR-024: Canonical mutation template (UoW + audit + outbox)

**Status:** Active  
**Confidence:** Explicit  
**Modules:** All mutation modules

---

## Problem / Context

Every feature module must write data consistently.

## Question Discussed

What is the standard write path for new modules?

## Options Considered

1. UoW + audit + outbox in same tx
2. Direct prisma writes

## Decision Selected

Documented golden rules in extending-the-backend and developer guide Part 2.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

See options not selected above; reasons not explicitly recorded.

## Historical Source

- Doc 09 — extending-the-backend.md
