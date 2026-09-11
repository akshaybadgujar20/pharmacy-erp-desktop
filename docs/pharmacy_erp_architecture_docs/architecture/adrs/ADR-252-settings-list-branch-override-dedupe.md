# ADR-252: Settings list dedupes branch override over company row

**Status:** Active  
**Confidence:** Strongly inferred  
**Modules:** settings

---

## Problem / Context

`GET /settings` can return both branch-scoped and company-wide rows for the same key.

## Question Discussed

When listing settings, which row should appear if branch and company rows coexist?

## Options Considered

1. Return both rows
2. Branch row wins in list dedupe
3. Company row wins

## Decision Selected

When both branch and company rows exist for the same key, the branch-scoped row wins in list output.

## Rationale

List API should reflect effective runtime resolution (branch → company) without duplicate keys.

## Rejected Alternatives

Return both rows; company row wins

## Historical Source

- Module memory doc — settings-module.md business rules (list dedupe)
