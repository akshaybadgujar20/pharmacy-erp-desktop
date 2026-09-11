# ADR-151: Read-only reports register into ReportRegistryService

**Status:** Active  
**Confidence:** Strongly inferred  
**Modules:** reporting

---

## Problem / Context

Each domain should not build its own report HTTP surface.

## Question Discussed

How should a new read-only report be exposed?

## Options Considered

1. Register ReportDefinition provider
2. New domain report controller
3. Inline SQL in existing controllers

## Decision Selected

Do not build a new controller; register a `ReportDefinition` provider into `ReportRegistryService`.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

New domain report controller; Inline SQL in existing controllers

## Historical Source

- Doc 09 — subagent draft ADR-033

**Phase 2 draft cross-ref:** subagent draft ADR-033

