# ADR-144: Angular feature modules; no business logic in components

**Status:** Active  
**Confidence:** Strongly inferred  
**Modules:** frontend

---

## Problem / Context

UI layer must stay thin and testable.

## Question Discussed

How should the Angular client be structured?

## Options Considered

1. Feature modules; Components → Services → Backend
2. Business logic in components
3. Monolithic single module

## Decision Selected

Use feature modules (sales, purchase, inventory, etc.); components call services only — never place business logic inside components.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Business logic in components; Monolithic single module

## Historical Source

- Doc 08 — subagent draft ADR-026

**Phase 2 draft cross-ref:** subagent draft ADR-026

