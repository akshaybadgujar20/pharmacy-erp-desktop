# ADR-256: Financial year close not enforced on all transaction modules

**Status:** Deferred  
**Confidence:** Strongly inferred  
**Modules:** configuration

---

## Problem / Context

`POST /financial-years/:id/close` exists but downstream modules may still post into a closed FY.

## Question Discussed

Should all transaction modules block writes when FY is CLOSED?

## Options Considered

1. Enforce `FINANCIAL_YEAR_CLOSED` on all modules in v1
2. Close API only; enforcement deferred
3. No close workflow

## Decision Selected

Financial year close API implemented (OPEN → CLOSED); enforcing closed FY on all transaction modules is **out of scope v1**.

## Rationale

Close workflow and guards on configuration entity exist; cross-module posting gates deferred to avoid blocking v1 delivery.

## Rejected Alternatives

Full cross-module enforcement in v1; no close workflow

## Historical Source

- Module memory doc — configuration-module.md out of scope (v1)
