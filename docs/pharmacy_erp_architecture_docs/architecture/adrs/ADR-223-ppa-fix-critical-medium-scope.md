# ADR-223: PPA fix plan covers critical and medium review items

**Status:** Active  
**Confidence:** Explicit  
**Modules:** pricing, prescription, audit

---

## Problem / Context

Post-implementation review found bugs in pricing/prescription/audit modules.

## Question Discussed

Which issues should the fix plan include?

## Options Considered

1. All issues from review
2. Critical + medium only
3. Critical/high only

## Decision Selected

Critical + medium only (replace bug, branch search, activate guard, change-history scoping, workflow audit, spec fix).

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

All issues; Critical/high only

## Historical Source

- Doc 17 — transcript 2a8995c1 Fix scope preferences AskQuestion

