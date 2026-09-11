# ADR-228: FinancialYear full CRUD plus POST close workflow

**Status:** Active  
**Confidence:** Explicit  
**Modules:** configuration, finance

---

## Problem / Context

FY must be closable by admin.

## Question Discussed

FinancialYear admin API?

## Options Considered

1. CRUD + POST close
2. CRUD status via update only
3. Read + update seeded rows

## Decision Selected

Full CRUD + `POST /financial-years/:id/close` (OPEN → CLOSED).

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

CRUD without separate close endpoint; Read + update seeded rows only

## Historical Source

- Doc 18 — subagent draft ADR-118

**Phase 2 draft cross-ref:** subagent draft ADR-118

