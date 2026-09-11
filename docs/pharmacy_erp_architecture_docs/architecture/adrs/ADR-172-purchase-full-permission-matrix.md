# ADR-172: Purchase full INVENTORY-style permission matrix

**Status:** Active  
**Confidence:** Explicit  
**Modules:** purchase, security

---

## Problem / Context

Only PURCHASE_CREATE existed in seed.

## Question Discussed

What permission seeding should purchase v1 add?

## Options Considered

1. Full matrix per resource + workflow actions
2. CRUD + separate workflow permissions
3. Minimal — reuse PURCHASE_CREATE

## Decision Selected

Full matrix like inventory (READ/CREATE/UPDATE/DELETE + workflow actions per PO, GRN, INVOICE, RETURN).

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

CRUD + separate workflow permissions only; Minimal — reuse PURCHASE_CREATE

## Historical Source

- Doc 12 — subagent draft ADR-051

**Phase 2 draft cross-ref:** subagent draft ADR-051

