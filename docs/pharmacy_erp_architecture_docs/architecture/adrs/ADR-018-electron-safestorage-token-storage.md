# ADR-018: Electron safeStorage for tokens; in-memory fallback for ng serve

**Status:** Active  
**Confidence:** Explicit  
**Modules:** Electron, Angular auth

---

## Problem / Context

Refresh tokens must not live in localStorage in desktop app.

## Question Discussed

Where should the renderer store JWT refresh tokens?

## Options Considered

1. Electron safeStorage via IPC
2. localStorage
3. sessionStorage only

## Decision Selected

safeStorage via preload IPC; in-memory fallback when not in Electron.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

localStorage in desktop shell

## Historical Source

- Doc 04 — plans/early-foundations_4083198d.plan.md
