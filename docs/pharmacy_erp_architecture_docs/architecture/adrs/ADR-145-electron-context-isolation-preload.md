# ADR-145: Electron context isolation with preload contextBridge

**Status:** Active  
**Confidence:** Strongly inferred  
**Modules:** electron, frontend

---

## Problem / Context

Renderer must not expose Node.js directly.

## Question Discussed

How should Electron expose OS capabilities to Angular?

## Options Considered

1. Context isolation + preload script + contextBridge
2. Direct Node in renderer
3. Remote module

## Decision Selected

Renderer runs Angular only; main process handles printing/FS/windows/updates; use context isolation and preload script with contextBridge for required APIs.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Direct Node in renderer; Remote module

## Historical Source

- Doc 08 — subagent draft ADR-027

**Phase 2 draft cross-ref:** subagent draft ADR-027

