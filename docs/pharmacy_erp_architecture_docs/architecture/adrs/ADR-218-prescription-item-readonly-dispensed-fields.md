# ADR-218: PrescriptionItem dispensed fields read-only via API

**Status:** Active  
**Confidence:** Explicit  
**Modules:** prescription, sales

---

## Problem / Context

Dispensing progress updated by sales later.

## Question Discussed

PrescriptionItem API + dispensing fields?

## Options Considered

1. CRUD+replace; dispensed fields read-only
2. Editable dispensed fields
3. Items inline on header only

## Decision Selected

Nested CRUD + replace; `dispensedQuantity`/`remainingQuantity`/item `status` read-only via API.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

API can patch dispensed fields; Items managed only via header body

## Historical Source

- Doc 17 — subagent draft ADR-109

**Phase 2 draft cross-ref:** subagent draft ADR-109

