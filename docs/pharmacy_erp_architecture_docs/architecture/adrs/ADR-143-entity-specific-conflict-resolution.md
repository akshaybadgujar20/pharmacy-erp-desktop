# ADR-143: Entity-specific conflict resolution rules

**Status:** Active  
**Confidence:** Strongly inferred  
**Modules:** sync, inventory, party, medicine

---

## Problem / Context

Different entities have different correctness requirements when two writers conflict.

## Question Discussed

What conflict resolution strategy should apply globally?

## Options Considered

1. One global rule (e.g. last-write-wins)
2. Entity-specific rules
3. Server always wins

## Decision Selected

Entity-specific rules: inventory transaction-based (never overwrite stock), customer details may use last-write-wins, medicine master prefers server authority; use versions/timestamps for detection.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

One global rule (e.g. last-write-wins); Server always wins for all entities

## Historical Source

- Doc 07 — subagent draft ADR-025

**Phase 2 draft cross-ref:** subagent draft ADR-025

