# ADR-173: Purchase module tests deferred in v1

**Status:** Active  
**Confidence:** Explicit  
**Modules:** purchase

---

## Problem / Context

First delivery prioritizes APIs over test suite.

## Question Discussed

What test coverage in first delivery?

## Options Considered

1. Unit only
2. Unit + persistence
3. Unit + persistence + e2e
4. No tests in first pass

## Decision Selected

No tests in first pass.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Unit only; Unit + persistence; Unit + persistence + e2e

## Historical Source

- Doc 12 — subagent draft ADR-054

**Phase 2 draft cross-ref:** subagent draft ADR-054

