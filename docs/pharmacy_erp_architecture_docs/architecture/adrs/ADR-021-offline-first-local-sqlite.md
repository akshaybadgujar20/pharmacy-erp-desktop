# ADR-021: Offline-first with local SQLite as primary store

**Status:** Active  
**Confidence:** Strongly inferred  
**Modules:** Infrastructure, sync

---

## Problem / Context

Pharmacy counter must work without network.

## Question Discussed

Local-first vs cloud-first data strategy?

## Options Considered

1. SQLite local primary + sync outbox
2. Cloud primary
3. Hybrid cache

## Decision Selected

Local SQLite authoritative; outbox for eventual cloud sync.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

See options not selected above; reasons not explicitly recorded.

## Historical Source

- Doc 07 — data-and-sync.md
