# ADR-114: Configuration, sync, masters in one delivery

**Status:** Active  
**Confidence:** Explicit  
**Modules:** Configuration, sync, masters, settings

---

## Problem / Context

Org config and geo lookup share patterns.

## Question Discussed

Delivery scope for config/sync/masters?

## Options Considered

1. Combined
2. Phased

## Decision Selected

One combined implementation; extend SettingsModule for AppSetting CRUD.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

See options not selected above; reasons not explicitly recorded.

## Historical Source

- Doc 18 — transcript 8fc361a6 SCM plan
