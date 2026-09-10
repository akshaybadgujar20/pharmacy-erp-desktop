# ADR-064: Block purchase invoice cancel when paidAmount > 0

**Status:** Active  
**Confidence:** Explicit  
**Modules:** Finance, purchase

---

## Problem / Context

Cancel with existing payments causes accounting inconsistency.

## Question Discussed

Cancel behavior when invoice has payments?

## Options Considered

1. Block until payments cancelled
2. Auto-unwind payments

## Decision Selected

Block cancel when paidAmount > 0.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Auto-cancel/unwind finance payments

## Historical Source

- Doc 13 — transcript 4ff29b60 AskQuestion cancel-policy
