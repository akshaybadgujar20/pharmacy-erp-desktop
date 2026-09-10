# ADR-130: Settings PUT requires version in body (breaking change)

**Status:** Active  
**Confidence:** Explicit  
**Modules:** Settings

---

## Problem / Context

Settings updates lacked optimistic locking consistency.

## Question Discussed

Settings PUT optimistic locking?

## Options Considered

1. Required version
2. Optional
3. None

## Decision Selected

Required version in PUT body.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

See options not selected above; reasons not explicitly recorded.

## Historical Source

- Doc 18 — transcript 8fc361a6 SCM fix AskQuestion settings-version
