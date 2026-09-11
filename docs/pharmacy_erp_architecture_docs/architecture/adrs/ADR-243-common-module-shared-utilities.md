# ADR-243: Shared cross-module utilities in common/ not feature modules

**Status:** Active  
**Confidence:** Strongly inferred  
**Modules:** infrastructure

---

## Problem / Context

Duplicate validation and mapping logic across feature modules.

## Question Discussed

Where should shared non-domain helpers live?

## Options Considered

1. backend/src/common/
2. Per-module duplication
3. New shared package

## Decision Selected

Extract repeated patterns to backend/src/common/ when used by 2+ modules.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Per-module duplication; New shared package

## Historical Source

- Doc 27 — common_module_improvements_f20c8e7d.plan.md

