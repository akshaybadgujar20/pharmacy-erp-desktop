# ADR-239: FinancialYear isCurrent remains branch-scoped

**Status:** Active  
**Confidence:** Explicit  
**Modules:** configuration, finance

---

## Problem / Context

Review questioned isCurrent exclusivity across branches.

## Question Discussed

FinancialYear isCurrent exclusivity?

## Options Considered

1. Keep branch-scoped isCurrent
2. Enforce company-wide exclusive isCurrent

## Decision Selected

Keep branch-scoped `isCurrent` behavior — document as intentional.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Setting isCurrent clears ALL current FYs for company

## Historical Source

- Doc 18 — subagent draft ADR-131

**Phase 2 draft cross-ref:** subagent draft ADR-131

