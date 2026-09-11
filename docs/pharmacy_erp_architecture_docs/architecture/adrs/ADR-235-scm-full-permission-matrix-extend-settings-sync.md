# ADR-235: Full CONFIGURATION + SYNC + LOOKUP matrix; keep SETTINGS_* and SYNC_RUN

**Status:** Active  
**Confidence:** Explicit  
**Modules:** configuration, sync, masters, security

---

## Problem / Context

Existing SETTINGS_READ/UPDATE and SYNC_RUN must remain.

## Question Discussed

Permission seed model?

## Options Considered

1. Full resource matrices
2. Extend SETTINGS/SYNC_RUN + matrix for new resources
3. Coarse MANAGE per area

## Decision Selected

Full CONFIGURATION + SYNC + LOOKUP resource matrices; keep existing `SETTINGS_READ/UPDATE` + `SYNC_RUN`.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Extend SETTINGS/SYNC_RUN only without full matrix; Coarse CONFIGURATION:MANAGE + SYNC:ADMIN

## Historical Source

- Doc 18 — subagent draft ADR-125

**Phase 2 draft cross-ref:** subagent draft ADR-125

