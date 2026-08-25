# Audit

Audit provides regulatory and operational traceability for business actions and field-level data changes. `AuditLog` records who did what; `ChangeHistory` stores before/after values for important fields.

## Relationship Diagram

```mermaid
flowchart TB
    AUDIT["AuditLog<br/><small>Who • what • when • entity</small>"]
    CHANGE["ChangeHistory<br/><small>Field before/after values</small>"]

    AUDIT -->|"1 : many"| CHANGE

    AUDIT -.->|"actor"| USER["User"]
    AUDIT -.->|"correlation"| CTX["RequestContext"]

    classDef master fill:#1d4ed8,stroke:#1e3a8a,color:#ffffff,stroke-width:3px;
    classDef detail fill:#dbeafe,stroke:#2563eb,color:#172554,stroke-width:1.5px;
    classDef external fill:#f3f4f6,stroke:#6b7280,color:#374151,stroke-width:1px,stroke-dasharray:5;

    class AUDIT master;
    class CHANGE detail;
    class USER,CTX external;
```

**Legend:** `AuditLog` is written inside the same `UnitOfWork` transaction as the business mutation. Technical logs use Winston (`AppLogger`) — not this table.

## How the Tables Work Together

- **AuditLog** records significant business actions: CREATE, UPDATE, DELETE, LOGIN, POST, APPROVE, SYNC.
- Each entry captures `entityType`, `entityId`, `entityUuid`, action, module, user, device, and `correlationId`.
- **ChangeHistory** stores field-level before/after values linked to an audit or entity change.
- Stock quantity deltas belong in `StockMovement` — not `AuditLog`.
- Sync payloads belong in `Outbox` — not a durable audit trail.
- Use `AuditAction` and `AuditModule` constants — not scattered string literals.
- Implemented via `AuditService.log(tx, …)` — see [Logging and audit](../../../architecture/logging-and-audit.md).

## Tables

- [[58_audit_log]] — business action audit trail.
- [[59_change_history]] — field-level change history.
