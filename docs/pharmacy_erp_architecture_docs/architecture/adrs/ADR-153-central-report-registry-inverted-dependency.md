# ADR-153: Central reporting core with domain provider registration

**Status:** Active  
**Confidence:** Explicit  
**Modules:** reporting

---

## Problem / Context

Sales/inventory/purchase/finance reports must plug in without circular imports.

## Question Discussed

How should domain modules contribute reports?

## Options Considered

1. Domain providers self-register at startup into global registry
2. Reporting core imports all domain modules
3. Per-domain report controllers

## Decision Selected

Central `reporting` module owns execution/export; domain modules register `ReportDefinition`s at startup via `OnModuleInit` providers (inverted dependency).

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Reporting core imports all domain modules; Per-domain report controllers

## Historical Source

- Doc 10 — subagent draft ADR-035

**Phase 2 draft cross-ref:** subagent draft ADR-035

