# ADR-240: SCM simplification covers P1+P2+P3 cleanup

**Status:** Active  
**Confidence:** Explicit  
**Modules:** configuration, sync, masters, settings

---

## Problem / Context

Optional post-fix structural cleanup.

## Question Discussed

How much should simplification plan cover?

## Options Considered

1. P1 only
2. P1 + P2
3. Everything including P3

## Decision Selected

P1 + P2 + P3 — lint fix, branch-scope util move, validateBranchId dedupe, settings mapper ISO dates, early-foundations API table, settings agent docs, optimisticUpdate in settings.service.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

P1 only — minimal highest value; P1 + P2 without P3 optimisticUpdate

## Historical Source

- Doc 18 — subagent draft ADR-132

**Phase 2 draft cross-ref:** subagent draft ADR-132

