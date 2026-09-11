# ADR-149: Reads via PrismaService; writes via UnitOfWorkService

**Status:** Active  
**Confidence:** Strongly inferred  
**Modules:** persistence, all modules

---

## Problem / Context

Multi-row writes need atomicity; reads should stay simple.

## Question Discussed

When should Prisma be called directly vs through a transaction wrapper?

## Options Considered

1. Reads direct; writes via unitOfWork.run
2. All DB access through UoW
3. All DB access direct

## Decision Selected

List/get use `prisma.client`; every create/update/delete runs inside `unitOfWork.run(tx => …)`.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

All DB access through UoW; All DB access direct

## Historical Source

- Doc 09 — subagent draft ADR-031

**Phase 2 draft cross-ref:** subagent draft ADR-031

