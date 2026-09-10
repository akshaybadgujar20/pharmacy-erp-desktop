# ADR-089: Medicine module backend-only; tests deferred

**Status:** Active  
**Confidence:** Explicit  
**Modules:** Medicine

---

## Problem / Context

Medicine master APIs needed before Angular admin UI.

## Question Discussed

Medicine implementation scope?

## Options Considered

1. Backend only
2. Backend+tests
3. Full stack

## Decision Selected

Backend APIs, permissions, cursor rules — no Angular UI, tests deferred.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

See options not selected above; reasons not explicitly recorded.

## Historical Source

- Doc 16 — transcript 8fc361a6 Medicine AskQuestion scope
