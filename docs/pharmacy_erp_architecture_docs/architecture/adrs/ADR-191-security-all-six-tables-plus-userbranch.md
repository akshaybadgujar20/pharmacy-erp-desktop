# ADR-191: Security admin: all six doc tables plus UserBranch

**Status:** Active  
**Confidence:** Explicit  
**Modules:** security

---

## Problem / Context

RBAC admin beyond auth login.

## Question Discussed

Which tables/APIs should v1 include?

## Options Considered

1. All 6 + UserBranch admin
2. 6 tables only no UserBranch
3. RBAC only
4. User + RBAC hybrid

## Decision Selected

All 6 doc tables + UserBranch admin (User, Role, Permission, RolePermission, UserRole, UserSession, UserBranch).

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

6 tables only; UserBranch seed-only; RBAC only; User + RBAC without Permission CRUD

## Historical Source

- Doc 15 — subagent draft ADR-079

**Phase 2 draft cross-ref:** subagent draft ADR-079

