# ADR-219: Sales dispensing hook out of scope for prescription v1

**Status:** Active  
**Confidence:** Explicit  
**Modules:** prescription, sales

---

## Problem / Context

Invoice post could update prescription progress.

## Question Discussed

Sales invoice post → update prescription dispensing?

## Options Considered

1. Out of scope
2. In scope on SalesInvoice post

## Decision Selected

Out of scope — prescription CRUD only; sales keeps FK validation only.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

In scope — update dispensedQuantity on SalesInvoice post

## Historical Source

- Doc 17 — subagent draft ADR-110

**Phase 2 draft cross-ref:** subagent draft ADR-110

## Evolution / Notes

Verified 2026-09-11: `sales-invoice.service.ts` calls `assertPrescriptionExists` only — no `dispensedQuantity` updates on post. Implementation matches this decision; planning note was not superseded.

