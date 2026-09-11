# ADR-251: PartyContact ChangeHistory scope deferred

**Status:** Active  
**Confidence:** Strongly inferred  
**Modules:** audit, party

---

## Problem / Context

Party contact updates may need field-level audit beyond AuditLog.

## Question Discussed

Does PartyContact emit ChangeHistory on update?

## Options Considered

1. Full ChangeHistory
2. AuditLog only
3. Deferred

## Decision Selected

PartyContact audit exception — ChangeHistory on party contact updates deferred (known gap).

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Full ChangeHistory on all party children

## Historical Source

- Doc 20 — audit-module.md known gaps

