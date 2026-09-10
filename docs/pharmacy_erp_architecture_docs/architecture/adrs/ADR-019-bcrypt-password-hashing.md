# ADR-019: bcrypt for password hashing

**Status:** Active  
**Confidence:** Explicit  
**Modules:** Auth, security

---

## Problem / Context

User passwords must be stored hashed securely.

## Question Discussed

Which password hashing algorithm?

## Options Considered

1. bcrypt
2. argon2
3. Plain hash (rejected)

## Decision Selected

bcrypt via PasswordService (argon2 noted as optional future).

## Rationale

Early foundations assumed default: "bcrypt (well-supported; argon2 optional)".

## Rejected Alternatives

argon2 deferred; never plain text

## Historical Source

- Doc 04 — plans/early-foundations_4083198d.plan.md
