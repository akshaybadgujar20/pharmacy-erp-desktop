# ADR-127: Skip Area delete guard — PartyAddress has no areaId

**Status:** Active  
**Confidence:** Explicit  
**Modules:** Masters

---

## Problem / Context

Cannot guard Area delete by party address FK — column missing.

## Question Discussed

Area delete guard without areaId on PartyAddress?

## Options Considered

1. Skip
2. Weak city guard
3. Schema migration later

## Decision Selected

Skip Area delete guard; document schema gap.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

See options not selected above; reasons not explicitly recorded.

## Historical Source

- Doc 18 — transcript 8fc361a6 SCM fix AskQuestion area-delete
