# ADR-226: Extend SettingsModule with AppSetting create/get/delete

**Status:** Active  
**Confidence:** Explicit  
**Modules:** settings, configuration

---

## Problem / Context

Settings today is list+update only.

## Question Discussed

Relationship with existing SettingsModule?

## Options Considered

1. Extend SettingsModule with full AppSetting CRUD
2. New config module for all incl. AppSetting
3. Keep Settings list/update only

## Decision Selected

Extend existing SettingsModule — add create/get/delete; keep `GET /settings` + `PUT /settings/:key`.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

New configuration/ module for ALL incl. AppSetting; Keep Settings unchanged seed-only

## Historical Source

- Doc 18 — subagent draft ADR-116

**Phase 2 draft cross-ref:** subagent draft ADR-116

