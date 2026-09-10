# ADR-006: All business writes through UnitOfWorkService.run

**Status:** Active  
**Confidence:** Explicit  
**Modules:** Infrastructure, all mutation modules

---

## Problem / Context

Application had zero `prisma.$transaction` usage; multi-step workflows (stock + outbox + audit) need atomic commits.

## Question Discussed

How should NestJS services perform multi-table business writes?

## Options Considered

1. `UnitOfWorkService.run(tx => …)` wrapping `prisma.$transaction`
2. Direct `prisma.$transaction` in each service
3. Per-repository transactions without shared wrapper

## Decision Selected

**Domain commands never call `prisma.*` directly for writes** — receive `TxClient` from `UnitOfWorkService.run()`.

## Rationale

Centralizes error mapping (P2002/P2034 → `ApplicationException`), retry on optimistic conflicts, and enforces one transaction boundary per business operation.

## Trade-offs

- All persistence services accept `tx` as first argument inside workflows
- Reads may still use `PrismaService.client` directly
- Slightly more boilerplate in every mutation service

## Architectural Impact

- Canonical mutation pattern documented in developer guide Part 2
- Audit + outbox always in same `tx` as business write
- Integration tests prove atomic rollback

## Affected Modules / Components

- `persistence/unit-of-work/unit-of-work.service.ts`
- Every `*.service.ts` mutation method

## Rejected Alternatives

- **Direct prisma.$transaction per service** — rejected (duplicated error mapping)

## Historical Source

- [`plans/persistence_foundation_patterns_3af5df7a.plan.md`](../../../../plans/persistence_foundation_patterns_3af5df7a.plan.md) — Pattern 1
