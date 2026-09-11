# ADR-250: Party nested contacts and addresses via child routes

**Status:** Active  
**Confidence:** Strongly inferred  
**Modules:** party

---

## Problem / Context

Party aggregate has multiple child collections.

## Question Discussed

How are PartyContact and PartyAddress exposed?

## Options Considered

1. Nested on party create
2. Separate child route CRUD

## Decision Selected

PartyContact and PartyAddress use nested child-route CRUD under /parties/:id/contacts and /addresses.

## Rationale

Established party template per ADR-015; documented in party-module.md.

## Rejected Alternatives

Nested on party create body

## Historical Source

- Doc 20 — party-module.md API catalog

