# ADR-189: Sales full permission matrix

**Status:** Active  
**Confidence:** Explicit  
**Modules:** sales, security

---

## Problem / Context

Need granular access like purchase/finance.

## Question Discussed

Permission matrix for sales endpoints?

## Options Considered

1. Full matrix per resource
2. Domain minimal CREATE+READ
3. Resource split only

## Decision Selected

Full matrix + admin role assignment (READ/CREATE/UPDATE/DELETE + POST/CANCEL/APPROVE per resource).

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Domain minimal CREATE+READ; Resource split without workflow permissions

## Historical Source

- Doc 14 — subagent draft ADR-077

**Phase 2 draft cross-ref:** subagent draft ADR-077

