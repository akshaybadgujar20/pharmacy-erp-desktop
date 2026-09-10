# ADR-010: RequestContext via AsyncLocalStorage for tenant and device

**Status:** Active  
**Confidence:** Explicit  
**Modules:** Persistence, common (middleware), all branch-scoped modules

---

## Problem / Context

Persistence services need `companyId`, `branchId`, `userId`, `deviceId` without threading four parameters through every method.

## Question Discussed

How should tenant and device context propagate through the NestJS request/async chain?

## Options Considered

1. `RequestContextService` with AsyncLocalStorage
2. Explicit parameters on every service method
3. Global singleton with mutable state (unsafe)

## Decision Selected

**RequestContextService** populated by middleware/interceptor; read via `getTenantScope()` helpers.

## Rationale

Matches Nest request lifecycle; outbox `deviceId` and branch scoping derive from same context.

## Trade-offs

- Must run business logic inside context boundary
- Integration tests set context explicitly
- JWT enrichment merges user into context post-auth (early-foundations)

## Affected Modules / Components

- `persistence/context/request-context.service.ts`
- `persistence/context/tenant-scope.util.ts`
- `common/logging/correlation.middleware.ts`
- `common/interceptors/context-enrich.interceptor.ts`

## Historical Source

- [`plans/persistence_foundation_patterns_3af5df7a.plan.md`](../../../../plans/persistence_foundation_patterns_3af5df7a.plan.md) — Request context section
