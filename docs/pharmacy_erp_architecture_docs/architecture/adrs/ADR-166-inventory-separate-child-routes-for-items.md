# ADR-166: Inventory document items via separate child routes

**Status:** Active  
**Confidence:** Explicit  
**Modules:** inventory, party

---

## Problem / Context

Document aggregates need item lines without nested create payloads.

## Question Discussed

How should items be modeled in create requests?

## Options Considered

1. Party-style header DTO only; items via child routes
2. Nested create with items[] + @ValidateNested

## Decision Selected

Party-style: header DTO only; items added via separate child routes.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Nested create with items[]

## Historical Source

- Doc 11 — transcript 052a3bc9 nested_items AskQuestion

