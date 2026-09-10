# ADR-012: Global JWT auth and PermissionsGuard with @Public opt-out

**Status:** Active  
**Confidence:** Explicit  
**Modules:** Auth, all controllers

---

## Problem / Context

Every business API except login/health must require authentication and permission checks consistently.

## Question Discussed

How should auth and RBAC be enforced across NestJS controllers?

## Options Considered

1. Global `JwtAuthGuard` + `PermissionsGuard` with `@Public()` and `@RequirePermissions()` decorators
2. Per-controller manual guard registration
3. Middleware-only auth without Passport

## Decision Selected

**Global guards** via `APP_GUARD`; `@Public()` on login/refresh; `@RequirePermissions('MODULE:RESOURCE:ACTION')` on routes.

## Rationale

Early foundations plan — matches seed permission matrix and login flattening in `auth.service.ts`.

## Rejected Alternatives

- **Per-controller guards only** — rejected (inconsistent coverage risk)

## Historical Source

- [`plans/early-foundations_4083198d.plan.md`](../../../../plans/early-foundations_4083198d.plan.md) — Phase 1a (Doc 04)
