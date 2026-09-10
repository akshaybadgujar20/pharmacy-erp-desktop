# ADR-080: Auth module for tokens; security module for RBAC admin

**Status:** Active  
**Confidence:** Explicit  
**Modules:** Auth, security

---

## Problem / Context

Login and admin CRUD have different lifecycles.

## Question Discussed

Where should user/role admin live vs login?

## Options Considered

1. security/ admin + auth/ tokens
2. All in auth/
3. Security in settings

## Decision Selected

auth/ = login/logout/refresh/me; security/ = User, Role, Permission admin.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

See options not selected above; reasons not explicitly recorded.

## Historical Source

- Doc 15 — transcript 8fc361a6 Security CreatePlan
