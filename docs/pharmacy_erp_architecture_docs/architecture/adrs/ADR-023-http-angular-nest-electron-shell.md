# ADR-023: HTTP transport: Angular renderer to NestJS API in Electron shell

**Status:** Active  
**Confidence:** Strongly inferred  
**Modules:** Application architecture

---

## Problem / Context

Desktop app needs clear layer boundaries.

## Question Discussed

How do Angular, Electron, and NestJS communicate?

## Options Considered

1. HTTP localhost:3000
2. IPC-only business logic
3. Embedded Nest in renderer

## Decision Selected

Angular calls http://localhost:3000; Electron provides shell + secure storage.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

See options not selected above; reasons not explicitly recorded.

## Historical Source

- Doc 08 — application-architecture.md; early-foundations
