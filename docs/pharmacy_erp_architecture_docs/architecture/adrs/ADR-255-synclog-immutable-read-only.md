# ADR-255: SyncLog immutable session history, read-only HTTP

**Status:** Active  
**Confidence:** Strongly inferred  
**Modules:** sync

---

## Problem / Context

SyncLog records sync session outcomes for troubleshooting; must not be edited via admin API.

## Question Discussed

Should SyncLog support create/update/delete HTTP endpoints?

## Options Considered

1. Full CRUD
2. Read-only list/get
3. No HTTP API

## Decision Selected

SyncLog is immutable session history — read-only HTTP (`GET /sync-logs`, `GET /sync-logs/:id`); no create/update/delete.

## Rationale

Session logs are append-only audit trail; mutations would break sync diagnostics integrity.

## Rejected Alternatives

Full CRUD; no HTTP API

## Historical Source

- Module memory doc — sync-module.md business rules (SyncLog immutable)
