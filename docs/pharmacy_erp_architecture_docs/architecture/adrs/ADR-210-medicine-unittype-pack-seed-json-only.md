# ADR-210: UnitType PACK→PACKAGING in constants and seed JSON only

**Status:** Active  
**Confidence:** Explicit  
**Modules:** medicine

---

## Problem / Context

UnitType enum misaligned with domain doc.

## Question Discussed

How to handle PACK → PACKAGING alignment?

## Options Considered

1. Seed JSON + constants only
2. Seed JSON + idempotent loader migration
3. Accept both values

## Decision Selected

Update constants + seed JSON only (no load-masters migration; existing DBs update on `db:seed:fresh`).

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Seed JSON + idempotent loader migration; Accept both PACK and PACKAGING

## Historical Source

- Doc 16 — subagent draft ADR-100

**Phase 2 draft cross-ref:** subagent draft ADR-100

