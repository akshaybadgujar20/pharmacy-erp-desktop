# ADR-194: Junction APIs nested with bulk replace

**Status:** Active  
**Confidence:** Explicit  
**Modules:** security

---

## Problem / Context

Role-permission and user-role assignments need bulk updates.

## Question Discussed

Junction API shape?

## Options Considered

1. Nested + add/remove + bulk replace
2. Nested CRUD only
3. Flat junction endpoints

## Decision Selected

Nested under parent + add/remove + bulk **replace** (UserRole, RolePermission pattern).

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Nested CRUD only; Flat junction endpoints

## Historical Source

- Doc 15 — subagent draft ADR-083

**Phase 2 draft cross-ref:** subagent draft ADR-083

