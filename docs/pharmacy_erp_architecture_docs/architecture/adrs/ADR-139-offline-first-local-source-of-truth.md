# ADR-139: Local database is source of truth during daily operation

**Status:** Active  
**Confidence:** Strongly inferred  
**Modules:** sync, persistence

---

## Problem / Context

Users must work seamlessly offline without knowing connectivity state.

## Question Discussed

Where is the authoritative data during daily pharmacy operations?

## Options Considered

1. Local SQLite is source of truth; cloud syncs later
2. Cloud is source of truth; local is cache
3. Hybrid with user-visible sync state

## Decision Selected

Local database is the source of truth during daily operation.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Cloud is source of truth; local is cache; Hybrid with user-visible sync state

## Historical Source

- Doc 07 — subagent draft ADR-021

**Phase 2 draft cross-ref:** subagent draft ADR-021

