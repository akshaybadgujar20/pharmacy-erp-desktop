# ADR-158: Namespaced report IDs (domain.report-name)

**Status:** Active  
**Confidence:** Explicit  
**Modules:** reporting

---

## Problem / Context

Report IDs must be unique and discoverable across domains.

## Question Discussed

How should report IDs be named?

## Options Considered

1. Namespaced dot IDs e.g. party.customer-list
2. Flat numeric IDs
3. URL path per module

## Decision Selected

Use namespaced ids like `party.customer-list`; unique across registry.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Flat numeric IDs; URL path per module

## Historical Source

- Doc 10 — subagent draft ADR-040

**Phase 2 draft cross-ref:** subagent draft ADR-040

