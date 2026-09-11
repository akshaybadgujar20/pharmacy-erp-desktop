# ADR-213: Enforce single default PriceList per branch scope on set

**Status:** Active  
**Confidence:** Explicit  
**Modules:** pricing

---

## Problem / Context

Multiple defaults cause ambiguous pricing.

## Question Discussed

Default price list behavior?

## Options Considered

1. Clear other defaults when isDefault=true
2. Allow multiple defaults
3. Default via seed only

## Decision Selected

When `isDefault=true`, clear other defaults for same branch (including null branch scope) in create/update.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Allow multiple defaults; Default via seed only

## Historical Source

- Doc 17 — subagent draft ADR-104

**Phase 2 draft cross-ref:** subagent draft ADR-104

