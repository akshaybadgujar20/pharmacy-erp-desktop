# ADR-142: Per-transaction UUID for idempotent sync requests

**Status:** Active  
**Confidence:** Strongly inferred  
**Modules:** sync

---

## Problem / Context

Duplicate delivery after retries must not double-apply changes.

## Question Discussed

How should the server detect and ignore duplicate sync requests?

## Options Considered

1. Unique UUID per transaction
2. Timestamp-only deduplication
3. No idempotency in v1

## Decision Selected

Every transaction gets a unique UUID; server safely ignores duplicates.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Timestamp-only deduplication; No idempotency in v1

## Historical Source

- Doc 07 — subagent draft ADR-024

**Phase 2 draft cross-ref:** subagent draft ADR-024

