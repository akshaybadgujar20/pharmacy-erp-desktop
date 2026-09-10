# ADR-013: JWT-enriched RequestContext (headers demoted to dev fallback)

**Status:** Active  
**Confidence:** Explicit  
**Modules:** Auth, persistence, all branch-scoped modules

---

## Problem / Context

`x-company-id` / `x-branch-id` headers are spoofable; authenticated identity must drive tenant scope and outbox device context.

## Question Discussed

What is the trusted source for `userId`, `companyId`, `branchId` in RequestContext?

## Options Considered

1. Context-enrichment interceptor after JWT guard merges `req.user` into RequestContext
2. Client headers as primary identity
3. Per-service manual JWT parsing

## Decision Selected

**Auth is trusted identity source**; `ContextEnrichInterceptor` sets user/company/branch from JWT; headers become dev-only fallback.

## Rationale

Stated in early-foundations plan: "Auth is the trusted identity source; x-user-id/x-company-id/x-branch-id headers become dev-only fallbacks."

## Architectural Impact

- `getTenantScope()` reads JWT-enriched context
- Outbox and audit get real userId on mutations
- Depends on ADR-010 (RequestContext)

## Historical Source

- [`plans/early-foundations_4083198d.plan.md`](../../../../plans/early-foundations_4083198d.plan.md) — Phase 1b (Doc 04)
