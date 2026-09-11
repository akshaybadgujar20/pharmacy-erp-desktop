# ADR-147: REST with JSON envelope; binary streams for exports

**Status:** Active  
**Confidence:** Strongly inferred  
**Modules:** backend, frontend

---

## Problem / Context

API responses need a consistent shape except for file downloads.

## Question Discussed

What response format should APIs use?

## Options Considered

1. JSON envelope for data; binary for exports
2. Raw JSON without envelope
3. GraphQL

## Decision Selected

REST consistently; wrap JSON in `{ success, data }` / `{ success, error }`; report exports (`format=csv|xlsx|pdf`) return binary streams without JSON envelope.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Raw JSON without envelope; GraphQL

## Historical Source

- Doc 08 — subagent draft ADR-029

**Phase 2 draft cross-ref:** subagent draft ADR-029

