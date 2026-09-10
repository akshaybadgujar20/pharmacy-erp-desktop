# ADR-138: Sync conflict resolve updates metadata only — does not apply payload

**Status:** Active  
**Confidence:** Explicit  
**Modules:** Sync

---

## Problem / Context

Applying conflict payloads automatically is risky without worker.

## Question Discussed

What does POST sync-conflicts/:id/resolve do?

## Options Considered

1. Metadata only
2. Apply payload to business tables

## Decision Selected

Metadata-only resolve; does not mutate business entities.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

See options not selected above; reasons not explicitly recorded.

## Historical Source

- Doc 18 — sync plan + developer guide Known gaps
