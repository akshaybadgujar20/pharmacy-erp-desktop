# ADR-146: NestJS thin controllers, rich services, validated DTOs

**Status:** Active  
**Confidence:** Strongly inferred  
**Modules:** backend

---

## Problem / Context

HTTP layer and domain logic must stay separated.

## Question Discussed

Where should business rules live in the NestJS backend?

## Options Considered

1. Controllers thin; services rich; DTOs validated
2. Controllers call Prisma directly
3. Fat controllers

## Decision Selected

Controller → DTO → Validation → Service → Prisma → SQLite; controllers thin, services rich, business rules in services.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Controllers call Prisma directly; Fat controllers

## Historical Source

- Doc 08 — subagent draft ADR-028

**Phase 2 draft cross-ref:** subagent draft ADR-028

