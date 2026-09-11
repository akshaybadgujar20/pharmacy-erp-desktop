# ADR-203: System schedule/UOM rows: full CRUD; block delete on FK refs only

**Status:** Active  
**Confidence:** Explicit  
**Modules:** medicine

---

## Problem / Context

System rows vs custom rows delete policy differs.

## Question Discussed

System schedules/UOMs delete policy?

## Options Considered

1. Block when isSystem flag
2. Full CRUD block FK only
3. Deactivate only

## Decision Selected

Full CRUD — block delete only when FK references exist; `isSystemSchedule`/`isSystemUnit` not special-cased.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Block delete when isSystem flag true; Deactivate only never HTTP delete

## Historical Source

- Doc 16 — subagent draft ADR-093

**Phase 2 draft cross-ref:** subagent draft ADR-093

