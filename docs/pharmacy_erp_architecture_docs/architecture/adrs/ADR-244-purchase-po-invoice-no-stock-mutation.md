# ADR-244: Purchase Order and Invoice do not change stock

**Status:** Active  
**Confidence:** Strongly inferred  
**Modules:** purchase, inventory

---

## Problem / Context

Stock inbound/outbound must occur at correct procurement boundaries.

## Question Discussed

Which purchase documents post stock movements?

## Options Considered

1. GRN accept inbound only
2. Invoice post also inbound
3. PO reserves stock

## Decision Selected

PO and Purchase Invoice do not change stock; GRN accept is inbound boundary; return approve is outbound.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Invoice post also inbound; PO reserves stock

## Historical Source

- Doc 20 — purchase-module.md golden rules

