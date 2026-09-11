# ADR-152: Additive-only change policy for backend extensions

**Status:** Active  
**Confidence:** Strongly inferred  
**Modules:** all modules

---

## Problem / Context

Feature work must not destabilize unrelated modules.

## Question Discussed

How should new features be added to the backend?

## Options Considered

1. Additive-only guarded logic
2. Refactor unrelated code while adding features
3. Fix pre-existing bugs opportunistically

## Decision Selected

Add new files and guarded logic; do not refactor or fix unrelated code without explicit approval.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Refactor unrelated code while adding features; Fix pre-existing bugs opportunistically

## Historical Source

- Doc 09 — subagent draft ADR-034

**Phase 2 draft cross-ref:** subagent draft ADR-034

