# ADR-167: Inventory CRUD plus workflow endpoints in v1

**Status:** Active  
**Confidence:** Explicit  
**Modules:** inventory

---

## Problem / Context

Documents must post stock via InventoryLedgerService, not stay DRAFT-only.

## Question Discussed

Controller/service scope for inventory documents?

## Options Considered

1. Party-parity CRUD only
2. CRUD + workflow endpoints

## Decision Selected

CRUD + workflow endpoints (approve adjustment, dispatch/receive transfer, reconcile stock-take).

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Party-parity CRUD only — no ledger posting

## Historical Source

- Doc 11 — transcript 052a3bc9 workflow_scope AskQuestion

