# ADR-171: Module memory doc plus scoped mdc rule for agent discovery

**Status:** Active  
**Confidence:** Explicit  
**Modules:** inventory, documentation

---

## Problem / Context

Agents need implementation-grounded context when editing inventory code.

## Question Discussed

How should agents discover the inventory memory model?

## Options Considered

1. Docs folder + scoped .mdc rule
2. Markdown docs only — no .mdc rule

## Decision Selected

`.cursor/rules/docs/inventory-module.md` + `inventory-module.mdc` globs on backend/src/inventory/**.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Markdown docs only

## Historical Source

- Doc 11 — transcript 052a3bc9 wiring AskQuestion

