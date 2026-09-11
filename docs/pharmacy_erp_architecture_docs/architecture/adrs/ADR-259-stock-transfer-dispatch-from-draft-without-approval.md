# ADR-259: Stock transfer dispatch accepts DRAFT without approval step

**Status:** Active  
**Confidence:** Strongly inferred  
**Modules:** inventory

---

## Problem / Context

StockTransfer enum includes `PENDING_APPROVAL` but v1 may not require a separate approval workflow.

## Question Discussed

Must transfers pass through `PENDING_APPROVAL` before dispatch?

## Options Considered

1. DRAFT → PENDING_APPROVAL → DISPATCHED (required)
2. Dispatch accepts DRAFT directly; approval UI deferred
3. Auto-approve on create

## Decision Selected

`POST /stock-transfers/:id/dispatch` accepts header in `DRAFT` (or `PENDING_APPROVAL`); dedicated transfer approval workflow UI is out of scope v1.

## Rationale

Status machine supports approval later; v1 keeps dispatch path simple for branch operations.

## Rejected Alternatives

Mandatory approval step; auto-approve on create

## Historical Source

- Module memory doc — inventory-module.md out of scope (transfer approval step)
