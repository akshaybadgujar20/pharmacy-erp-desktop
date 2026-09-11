# ADR-201: Manufacturer requires existing Party (FK validation only)

**Status:** Active  
**Confidence:** Explicit  
**Modules:** medicine, party

---

## Problem / Context

Manufacturer links to party master.

## Question Discussed

Manufacturer ↔ Party integration?

## Options Considered

1. FK validation only
2. Inline party create
3. Manufacturer in party module

## Decision Selected

Create Party first, then Manufacturer with `partyId` (mirror Supplier pattern).

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Inline party create on manufacturer; Manufacturer CRUD in party module

## Historical Source

- Doc 16 — subagent draft ADR-091

**Phase 2 draft cross-ref:** subagent draft ADR-091

