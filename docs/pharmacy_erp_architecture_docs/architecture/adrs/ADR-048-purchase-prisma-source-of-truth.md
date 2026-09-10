# ADR-048: Prisma schema as source of truth for purchase statuses

**Status:** Active  
**Confidence:** Explicit  
**Modules:** Purchase

---

## Problem / Context

purchase.md, purchasing.md, and Prisma disagree on statuses.

## Question Discussed

Status machines — which source of truth?

## Options Considered

1. Prisma
2. purchasing.md
3. purchase.md

## Decision Selected

Existing Prisma models in backend/prisma/purchase/.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

See options not selected above; reasons not explicitly recorded.

## Historical Source

- Doc 12 — transcript 8fc361a6 AskQuestion source_of_truth
