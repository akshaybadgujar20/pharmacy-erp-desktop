# ADR-047: Purchase v1 includes all four document types together

**Status:** Active  
**Confidence:** Explicit  
**Modules:** Purchase

---

## Problem / Context

Procurement needs PO, GRN, invoice, return.

## Question Discussed

What should we implement in the first backend delivery?

## Options Considered

1. All 4 together
2. PO+GRN only
3. PO+GRN+Invoice
4. PO only

## Decision Selected

All 4 document types in one delivery.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Phased PO-only or PO+GRN-only

## Historical Source

- Doc 12 — transcript 8fc361a6 Purchase AskQuestion scope
