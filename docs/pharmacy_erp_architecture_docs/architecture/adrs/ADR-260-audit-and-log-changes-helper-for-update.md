# ADR-260: auditAndLogChanges helper for UPDATE ChangeHistory

**Status:** Active  
**Confidence:** Strongly inferred  
**Modules:** audit, pricing, prescription, settings

---

## Problem / Context

UPDATE mutations need consistent AuditLog + ChangeHistory field diffs without duplicating boilerplate.

## Question Discussed

How should modules write ChangeHistory on UPDATE alongside AuditLog?

## Options Considered

1. Inline `log` + `logFieldChanges` per service
2. Shared `auditAndLogChanges` helper
3. ChangeHistory only, no AuditLog

## Decision Selected

Use `auditAndLogChanges(...)` helper (with `buildFieldChanges`) for UPDATE flows — adopted in pricing, prescription, and settings mutations.

## Rationale

Single pattern for field-level history tied to audit log id; reduces duplication across modules.

## Rejected Alternatives

Per-service inline only; ChangeHistory without AuditLog

## Historical Source

- Module memory doc — audit-module.md write patterns
