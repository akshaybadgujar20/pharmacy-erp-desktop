# ADR-141: Outbox pattern with background sync triggers

**Status:** Active  
**Confidence:** Strongly inferred  
**Modules:** sync, persistence

---

## Problem / Context

Mutations must replicate reliably after crashes and intermittent connectivity.

## Question Discussed

How should local changes be queued and processed for cloud sync?

## Options Considered

1. Outbox table + background worker
2. Direct API call per mutation
3. Manual export/import only

## Decision Selected

Record every change in Outbox; background worker processes on app start, periodic interval, manual sync, and network reconnect.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Direct API call per mutation; Manual export/import only

## Historical Source

- Doc 07 — subagent draft ADR-023

**Phase 2 draft cross-ref:** subagent draft ADR-023

