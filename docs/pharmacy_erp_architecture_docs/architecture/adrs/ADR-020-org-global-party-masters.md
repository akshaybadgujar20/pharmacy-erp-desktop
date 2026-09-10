# ADR-020: Party masters are org-global (no branch scope)

**Status:** Active  
**Confidence:** Explicit  
**Modules:** Party

---

## Problem / Context

Customers/suppliers/doctors are shared across branches.

## Question Discussed

Should party list APIs filter by branchId?

## Options Considered

1. Org-global lists
2. Branch-scoped party
3. Company-scoped only

## Decision Selected

Org-global — no companyId/branchId on party tables; lists omit withBranchScope.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

See options not selected above; reasons not explicitly recorded.

## Historical Source

- Doc 06 — plans/party-management-crud-api_91499946.plan.md
