# ADR-025: Report registry with provider registration at startup

**Status:** Active  
**Confidence:** Explicit  
**Modules:** Reporting

---

## Problem / Context

Reports must be extensible without central switch statements.

## Question Discussed

How should reports be registered and discovered?

## Options Considered

1. ReportRegistryService + providers
2. Hardcoded controller per report

## Decision Selected

Providers register ReportDefinition at module init; permission filter on list.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

See options not selected above; reasons not explicitly recorded.

## Historical Source

- Doc 10 — plans/extensible_reporting_module + reporting.md
