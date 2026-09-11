# ADR-229: SequenceGenerator admin CRUD; allocation stays internal

**Status:** Active  
**Confidence:** Explicit  
**Modules:** configuration, sequence

---

## Problem / Context

Admins configure sequences; runtime allocates numbers.

## Question Discussed

SequenceGenerator HTTP API?

## Options Considered

1. Admin CRUD; next() internal
2. Read-only seed
3. CRUD + reset counter workflow

## Decision Selected

Admin CRUD for sequence config; `SequenceGeneratorService.next()` stays internal.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Read-only seed-managed; Admin CRUD + POST reset-counter

## Historical Source

- Doc 18 — subagent draft ADR-119

**Phase 2 draft cross-ref:** subagent draft ADR-119

