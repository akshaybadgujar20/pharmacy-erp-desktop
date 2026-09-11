# ADR-148: Standard feature module folder anatomy

**Status:** Active  
**Confidence:** Strongly inferred  
**Modules:** backend

---

## Problem / Context

New domain modules must follow one repeatable shape.

## Question Discussed

What folder layout should every backend feature module use?

## Options Considered

1. party-style anatomy (module/controller/service/dto/mappers/constants/utils)
2. Ad-hoc per module
3. Single file per feature

## Decision Selected

Follow party reference layout: module, thin controller, service, dto/, mappers/, optional constants/ and utils/.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Ad-hoc per module; Single file per feature

## Historical Source

- Doc 09 — subagent draft ADR-030

**Phase 2 draft cross-ref:** subagent draft ADR-030

