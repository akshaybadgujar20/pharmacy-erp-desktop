# ADR-016: Winston AppLogger for technical logs; AuditService for business audit

**Status:** Active  
**Confidence:** Explicit  
**Modules:** Common (logging), audit, all mutations

---

## Problem / Context

Developers need request/error traces; regulators need immutable business action trail — these must not be conflated.

## Question Discussed

How should technical logging and business audit be separated?

## Options Considered

1. Two lanes: Winston (technical) + `AuditService.log` → `audit_logs` (business)
2. Single audit table for everything
3. Winston only, no business audit

## Decision Selected

**Two lanes** — Winston via `AppLogger`/`LoggingInterceptor` for HTTP and errors; `AuditService.log(tx, …)` for CREATE/UPDATE/POST/APPROVE etc. in same UoW transaction.

## Rationale

Winston logging plan: "Two lanes (per prior discussion)" — technical vs business audit.

## Trade-offs

- Stock movements are inventory ledger rows — not `AuditLog` (separate concern)
- `party-contact` service noted exception — no audit on mutations (known gap)

## Rejected Alternatives

- **Single log store** — rejected (wrong retention/compliance model)

## Historical Source

- [`plans/winston-logging-audit_832d31b7.plan.md`](../../../../plans/winston-logging-audit_832d31b7.plan.md) (Doc 05)
