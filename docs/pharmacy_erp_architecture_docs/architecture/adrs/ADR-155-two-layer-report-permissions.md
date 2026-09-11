# ADR-155: Coarse REPORT_VIEW plus per-report permission

**Status:** Active  
**Confidence:** Explicit  
**Modules:** reporting, security

---

## Problem / Context

Users need route-level and report-level access control.

## Question Discussed

How should report permissions be structured?

## Options Considered

1. Route gate + per-report permission
2. Single REPORT_VIEW for all
3. Per-controller guards only

## Decision Selected

`REPORT_VIEW` on routes; each `ReportDefinition.permission` checked before `run()`; catalog filtered via `listForUser()`.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Single REPORT_VIEW for all; Per-controller guards only

## Historical Source

- Doc 10 — subagent draft ADR-037

**Phase 2 draft cross-ref:** subagent draft ADR-037

