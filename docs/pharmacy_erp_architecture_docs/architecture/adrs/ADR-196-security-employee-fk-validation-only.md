# ADR-196: Employee link FK validation only

**Status:** Active  
**Confidence:** Explicit  
**Modules:** security, party

---

## Problem / Context

User may link to employee party record.

## Question Discussed

Employee integration depth?

## Options Considered

1. FK validation only
2. Auto-create employee
3. Employee CRUD in security

## Decision Selected

FK validation only — employee exists, no duplicate user per employee.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Auto-create employee; Employee CRUD in security

## Historical Source

- Doc 15 — subagent draft ADR-085

**Phase 2 draft cross-ref:** subagent draft ADR-085

