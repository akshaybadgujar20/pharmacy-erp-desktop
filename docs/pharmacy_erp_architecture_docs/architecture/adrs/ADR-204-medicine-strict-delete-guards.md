# ADR-204: Strict soft-delete guards on medicine masters

**Status:** Active  
**Confidence:** Explicit  
**Modules:** medicine

---

## Problem / Context

Deleting referenced masters corrupts downstream data.

## Question Discussed

Soft-delete guards when downstream references exist?

## Options Considered

1. Strict all resources
2. Medicine only
3. Always allow soft-delete

## Decision Selected

Strict — block soft-delete when downstream refs exist (medicines, batches, children, junctions, etc.).

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Medicine delete guard only; Always allow soft-delete

## Historical Source

- Doc 16 — subagent draft ADR-094

**Phase 2 draft cross-ref:** subagent draft ADR-094

