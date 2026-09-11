# ADR-199: Public change-required-password endpoint for mustChangePassword users

**Status:** Active  
**Confidence:** Strongly inferred  
**Modules:** auth, security

---

## Problem / Context

Users with mustChangePassword=true cannot use JWT-protected change-password.

## Question Discussed

How should forced password change work without existing JWT?

## Options Considered

1. Public POST /auth/change-required-password
2. No new endpoint — fix defaults only
3. Both public endpoint and optional flag on reset/create

## Decision Selected

POST /auth/change-required-password (username + currentPassword + newPassword) when mustChangePassword=true.

## Rationale

Implemented in auth.controller.ts and auth.service.ts per transcript 66997528.

## Rejected Alternatives

No new endpoint — defaults only

## Historical Source

- Doc 15 — transcript 66997528 mustChangePassword AskQuestion

