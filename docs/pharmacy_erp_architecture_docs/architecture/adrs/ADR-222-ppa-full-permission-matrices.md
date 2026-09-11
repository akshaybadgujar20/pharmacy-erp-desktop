# ADR-222: Full PRICING + PRESCRIPTION + AUDIT permission matrices

**Status:** Active  
**Confidence:** Explicit  
**Modules:** pricing, prescription, audit, security

---

## Problem / Context

Each resource needs granular guards.

## Question Discussed

Permission seed model?

## Options Considered

1. Full three matrices
2. Pricing+Prescription full; Audit read-only
3. Coarse MANAGE per area

## Decision Selected

Full `PRICING` + `PRESCRIPTION` + `AUDIT` resource matrices.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Pricing+Prescription full; Audit READ only; Coarse PRICING:MANAGE + PRESCRIPTION:MANAGE

## Historical Source

- Doc 17 — subagent draft ADR-113

**Phase 2 draft cross-ref:** subagent draft ADR-113

