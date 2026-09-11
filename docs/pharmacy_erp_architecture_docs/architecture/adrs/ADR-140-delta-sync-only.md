# ADR-140: Delta sync — send only changed records

**Status:** Active  
**Confidence:** Strongly inferred  
**Modules:** sync

---

## Problem / Context

Full-database upload is slow, expensive, and risky on reconnect.

## Question Discussed

What synchronization payload strategy should be used?

## Options Considered

1. Delta sync (changed records only)
2. Full database upload
3. Snapshot + diff hybrid

## Decision Selected

Send only changed records; never upload the whole database.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Full database upload; Snapshot + diff hybrid

## Historical Source

- Doc 07 — subagent draft ADR-022

**Phase 2 draft cross-ref:** subagent draft ADR-022

