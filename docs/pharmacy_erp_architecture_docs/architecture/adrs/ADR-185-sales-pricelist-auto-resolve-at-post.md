# ADR-185: Auto-resolve selling price from PriceList at post

**Status:** Active  
**Confidence:** Explicit  
**Modules:** sales, pricing

---

## Problem / Context

Prices are branch-scoped via PriceList.

## Question Discussed

Selling price resolution at invoice post?

## Options Considered

1. Auto-resolve from PriceList at post
2. Manual unitPrice on draft only
3. Hybrid default with override

## Decision Selected

Auto-resolve from branch PriceList/PriceListItem at post; snapshot MRP/tax on lines.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Manual unitPrice on draft only; Hybrid default with override

## Historical Source

- Doc 14 — subagent draft ADR-071

**Phase 2 draft cross-ref:** subagent draft ADR-071

