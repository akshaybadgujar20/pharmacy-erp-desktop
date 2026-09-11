# ADR-156: Report exports: JSON, CSV, Excel, PDF

**Status:** Active  
**Confidence:** Explicit  
**Modules:** reporting

---

## Problem / Context

Users need preview and downloadable exports.

## Question Discussed

Which export formats should v1 support?

## Options Considered

1. json|csv|xlsx|pdf
2. JSON only
3. JSON + CSV only

## Decision Selected

Support `format=json|csv|xlsx|pdf` (default json); exporters return buffer with Content-Type and Content-Disposition.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

JSON only; JSON + CSV only

## Historical Source

- Doc 10 — subagent draft ADR-038

**Phase 2 draft cross-ref:** subagent draft ADR-038

