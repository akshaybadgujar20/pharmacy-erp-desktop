# ADR-017: AuditService.log inside UnitOfWork transaction

**Status:** Active  
**Confidence:** Explicit  
**Modules:** Audit, all mutation modules

---

## Problem / Context

Business audit rows must not exist without the business change they describe (and vice versa).

## Decision Selected

`AuditService.log(tx, …)` writes to `audit_logs` **inside the same `UnitOfWork` transaction** as the mutation — mirroring `OutboxService.enqueue(tx, …)`.

## Rationale

Winston plan explicitly parallels audit with outbox transactional pattern.

## Historical Source

- [`plans/winston-logging-audit_832d31b7.plan.md`](../../../../plans/winston-logging-audit_832d31b7.plan.md) (Doc 05)
