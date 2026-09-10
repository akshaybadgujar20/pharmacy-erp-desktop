# ADR-137: Cross-module coupling via DB FKs and shared utils, not Nest imports

**Status:** Active  
**Confidence:** Strongly inferred  
**Modules:** All feature modules

---

## Problem / Context

Tight Nest imports create circular dependency risk.

## Question Discussed

How should purchase/sales relate to prescription/pricing?

## Options Considered

1. FK + direct Prisma/util calls
2. Nest import feature modules

## Decision Selected

No Nest imports between party/medicine/inventory/purchase/sales — FK and shared persistence/utils only.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

See options not selected above; reasons not explicitly recorded.

## Historical Source

- Doc 09 + developer guide Part 1 Nest dependency graph
