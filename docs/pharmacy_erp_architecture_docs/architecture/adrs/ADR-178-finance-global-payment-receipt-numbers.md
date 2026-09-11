# ADR-178: Payment/Receipt numbers globally unique per Prisma schema

**Status:** Active  
**Confidence:** Explicit  
**Modules:** finance, sequence

---

## Problem / Context

Prisma has globally unique paymentNumber/receiptNumber.

## Question Discussed

Payment/Receipt document numbers — follow Prisma or branch-scope?

## Options Considered

1. Prisma global unique via sequence
2. Branch-scoped numbers (migration)

## Decision Selected

Prisma as-is: org-global unique numbers; use branch sequence row format like `PAY-{BR}-{SEQ}` to avoid collisions.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Branch-scoped numbers (requires migration)

## Historical Source

- Doc 13 — subagent draft ADR-061

**Phase 2 draft cross-ref:** subagent draft ADR-061

