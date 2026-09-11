# ADR-257: MFA and password complexity policy out of scope v1

**Status:** Deferred  
**Confidence:** Strongly inferred  
**Modules:** security

---

## Problem / Context

Enterprise security features beyond RBAC admin were discussed as follow-ups.

## Question Discussed

Should v1 include MFA and configurable password complexity policy?

## Options Considered

1. MFA + password policy settings in v1
2. bcrypt + mustChangePassword only; MFA/policy deferred
3. No password flows

## Decision Selected

MFA and password complexity policy settings are **out of scope v1**; v1 uses bcrypt hashing, session invalidation, and `mustChangePassword` flows.

## Rationale

RBAC admin and core auth flows are sufficient for v1 desktop ERP; advanced policy deferred.

## Rejected Alternatives

MFA + policy in v1; no password management

## Historical Source

- Module memory doc — security-module.md out of scope / follow-ups
