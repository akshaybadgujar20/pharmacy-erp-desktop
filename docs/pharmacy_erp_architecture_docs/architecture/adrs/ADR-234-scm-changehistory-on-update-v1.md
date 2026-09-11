# ADR-234: ChangeHistory on UPDATE for configuration and masters v1

**Status:** Active  
**Confidence:** Explicit  
**Modules:** configuration, masters, audit

---

## Problem / Context

Field-level audit for config changes.

## Question Discussed

ChangeHistory integration for configuration and masters?

## Options Considered

1. ChangeHistory on UPDATE
2. AuditLog only
3. ChangeHistory on all mutations

## Decision Selected

Emit ChangeHistory on UPDATE for configuration + masters modules (v1).

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

AuditLog only no ChangeHistory; ChangeHistory on all CREATE/UPDATE/DELETE

## Historical Source

- Doc 18 — subagent draft ADR-124

**Phase 2 draft cross-ref:** subagent draft ADR-124

