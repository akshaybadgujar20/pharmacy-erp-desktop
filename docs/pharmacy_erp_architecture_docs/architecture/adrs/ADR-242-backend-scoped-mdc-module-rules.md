# ADR-242: Per-module mdc cursor rules point to memory docs

**Status:** Active  
**Confidence:** Strongly inferred  
**Modules:** documentation, cursor rules

---

## Problem / Context

Agents editing feature modules need scoped conventions without loading entire repo context.

## Question Discussed

How should backend module conventions be enforced for Cursor?

## Options Considered

1. Glob-scoped .mdc rules + memory docs
2. Single backend rule only

## Decision Selected

Glob-scoped .mdc rules (e.g. purchase-module.mdc) linking to .cursor/rules/docs/*-module.md.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Single backend rule only

## Historical Source

- Doc 27 — backend-cursor-rules_666edcea.plan.md

