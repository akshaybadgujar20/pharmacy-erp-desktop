# ADR-168: Batch org-global; Stock and documents branch-scoped

**Status:** Active  
**Confidence:** Strongly inferred  
**Modules:** inventory

---

## Problem / Context

Batch master data is shared; balances and workflows are per branch.

## Question Discussed

What is the tenancy scope for batch vs stock?

## Options Considered

1. All branch-scoped
2. Batch org-global, stock branch-scoped

## Decision Selected

Batch is org-global; Stock, adjustments, and stock-takes are branch-scoped.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

All branch-scoped

## Historical Source

- Doc 11 — inventory-module.md golden rules

