# ADR-159: Party reports provider ships first under reporting/providers

**Status:** Active  
**Confidence:** Explicit  
**Modules:** reporting, party

---

## Problem / Context

Need a reference provider before other write modules exist.

## Question Discussed

Where should the first report provider live?

## Options Considered

1. Under reporting/providers/party for first cut
2. Under party/ module immediately
3. Defer all providers

## Decision Selected

`PartyReportsProvider` under `reporting/providers/party/` registers customer-list, supplier-list, customer-outstanding.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Under party/ module immediately; Defer all providers

## Historical Source

- Doc 10 — subagent draft ADR-041

**Phase 2 draft cross-ref:** subagent draft ADR-041

