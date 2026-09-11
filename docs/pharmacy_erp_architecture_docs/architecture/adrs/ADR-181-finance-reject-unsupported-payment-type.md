# ADR-181: Reject unsupported PaymentType at complete

**Status:** Active  
**Confidence:** Explicit  
**Modules:** finance

---

## Problem / Context

Silent fallback to Supplier Payable masked misconfiguration.

## Question Discussed

How to handle unsupported PaymentType at complete?

## Options Considered

1. Reject with explicit error
2. Silent fallback to Supplier Payable

## Decision Selected

Reject with explicit error (no silent fallback).

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Silent fallback to Supplier Payable

## Historical Source

- Doc 13 — subagent draft ADR-066

**Phase 2 draft cross-ref:** subagent draft ADR-066

