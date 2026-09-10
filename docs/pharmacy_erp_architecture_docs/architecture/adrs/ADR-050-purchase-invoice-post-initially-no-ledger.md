# ADR-050: Purchase invoice POST initially audit+outbox only (no stock)

**Status:** Refined  
**Confidence:** Explicit  
**Modules:** Purchase, finance
**Superseded by:** ADR-056

---

## Problem / Context

Stock on GRN; invoice is financial document.

## Question Discussed

What should invoice POST do in v1?

## Options Considered

1. Status+audit+outbox only
2. Stub ledger
3. Skip invoice

## Decision Selected

Initially status + audit + outbox only — no stock (finance AP added later).

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

See options not selected above; reasons not explicitly recorded.

## Historical Source

- Doc 12 — transcript 8fc361a6

## Evolution

```text
Initial (audit/outbox only) → Refinement ADR-056 finance AP on post
```
