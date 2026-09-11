# ADR-211: Pricing/Prescription/Audit backend-only; tests deferred

**Status:** Active  
**Confidence:** Explicit  
**Modules:** pricing, prescription, audit

---

## Problem / Context

Match Medicine/Security delivery pattern.

## Question Discussed

Implementation scope?

## Options Considered

1. Backend only
2. Backend + tests

## Decision Selected

Backend only — APIs, permissions seed, cursor rules, AGENTS.md (no Angular UI, tests deferred).

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Backend + unit/integration tests

## Historical Source

- Doc 17 — subagent draft ADR-102

**Phase 2 draft cross-ref:** subagent draft ADR-102

