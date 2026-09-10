# ADR-015: Party module as backend CRUD reference template

**Status:** Active  
**Confidence:** Explicit  
**Modules:** Party, all feature modules

---

## Problem / Context

New modules need a consistent pattern for controllers, services, DTOs, mappers, audit, outbox, soft delete, and optimistic locking.

## Question Discussed

Which module should be the canonical reference for new backend feature work?

## Options Considered

1. `party/` module as template (documented in extending-the-backend and developer guide)
2. Per-module unique patterns
3. Code generator / CLI scaffold only

## Decision Selected

**Party module** is the reference CRUD template — nested routes, `ensurePartyRole`, soft delete, version checks, mapper stringify BigInt.

## Rationale

Party management plan explicitly establishes write pattern; developer guide Part 2 and "find by concern" point to party for CRUD template.

## Architectural Impact

- All new modules copy party/inventory workflow shapes
- `extending-the-backend.md` documents anatomy against this template
- Org-global scope (no branch filter) for party masters

## Constraints / Assumptions

- Party is org-global — lists omit `withBranchScope`
- Nested children: `partyId` from route param; role details get `partyId` in create body

## Historical Source

- [`plans/party-management-crud-api_91499946.plan.md`](../../../../plans/party-management-crud-api_91499946.plan.md) (Doc 06)
- [`extending-the-backend.md`](../extending-the-backend.md) (cross-ref)
