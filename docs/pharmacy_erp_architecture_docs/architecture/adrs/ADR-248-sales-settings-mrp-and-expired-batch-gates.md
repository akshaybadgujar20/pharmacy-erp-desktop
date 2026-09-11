# ADR-248: Sales post gated by MRP cap and expired-batch settings

**Status:** Active  
**Confidence:** Strongly inferred  
**Modules:** sales, settings

---

## Problem / Context

Regulatory and policy constraints on selling price and batch expiry.

## Question Discussed

Which settings control sales post validation?

## Options Considered

1. sales.enforce_mrp_cap, sales.allow_expired_sale, sales.allow_expired_customer_return

## Decision Selected

Use settings keys sales.enforce_mrp_cap (default true), sales.allow_expired_sale, sales.allow_expired_customer_return.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Hard-coded policy only

## Historical Source

- Doc 20 — sales-module.md settings section

