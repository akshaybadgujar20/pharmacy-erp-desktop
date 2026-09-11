# ADR-157: File exports bypass ResponseInterceptor via @Res

**Status:** Active  
**Confidence:** Explicit  
**Modules:** reporting

---

## Problem / Context

Binary exports cannot use the JSON success envelope.

## Question Discussed

How should CSV/XLSX/PDF responses be returned?

## Options Considered

1. @Res passthrough false to stream binary
2. Modify ResponseInterceptor for binary
3. Base64 in JSON envelope

## Decision Selected

Use `@Res({ passthrough: false })` to stream exporter buffer with proper headers, bypassing `ResponseInterceptor` without modifying it.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Modify ResponseInterceptor for binary; Base64 in JSON envelope

## Historical Source

- Doc 10 — subagent draft ADR-039

**Phase 2 draft cross-ref:** subagent draft ADR-039

