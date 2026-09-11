# ADR-195: UserSession read and admin force-logout

**Status:** Active  
**Confidence:** Explicit  
**Modules:** security, auth

---

## Problem / Context

Admins must revoke active sessions.

## Question Discussed

UserSession API scope?

## Options Considered

1. Read list/get + force-logout
2. Auth /me only
3. No session admin

## Decision Selected

Read list/get + admin `force-logout` endpoint.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

Auth /me only; No session admin HTTP

## Historical Source

- Doc 15 — subagent draft ADR-084

**Phase 2 draft cross-ref:** subagent draft ADR-084

