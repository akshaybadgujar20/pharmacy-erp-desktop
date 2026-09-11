# ADR-224: PPA simplification standard scope recommended

**Status:** Active  
**Confidence:** Explicit  
**Modules:** pricing, prescription

---

## Problem / Context

Optional naming and helper extraction after PPA bug fixes.

## Question Discussed

How broad should the simplification pass be?

## Options Considered

1. Minimal (~5 files)
2. Standard (~8 files)
3. Full including tests and docs

## Decision Selected

Standard — minimal + extract buildPriceListListWhere + prescription audit/outbox helper.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Minimal only; Full including tests

## Historical Source

- Doc 17 — transcript 2a8995c1 simplification AskQuestion

