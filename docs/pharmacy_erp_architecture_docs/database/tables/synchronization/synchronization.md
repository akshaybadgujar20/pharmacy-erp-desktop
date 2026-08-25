# Synchronization

Synchronization enables offline-first operation by queuing local changes for cloud upload and tracking sync health. The outbox pattern guarantees reliable delivery after crashes or network outages.

## Relationship Diagram

```mermaid
flowchart TB
    OUTBOX["Outbox<br/><small>Pending local changes</small>"]
    SYNC_LOG["SyncLog<br/><small>Sync session history</small>"]
    CONFLICT["SyncConflict<br/><small>Resolution queue</small>"]

    OUTBOX -.->|"processed by"| WORKER["Sync Worker"]
    WORKER -.->|"creates"| SYNC_LOG
    WORKER -.->|"may create"| CONFLICT
    SYNC_LOG -->|"1 : many"| CONFLICT

    classDef queue fill:#1d4ed8,stroke:#1e3a8a,color:#ffffff,stroke-width:3px;
    classDef log fill:#dbeafe,stroke:#2563eb,color:#172554,stroke-width:1.5px;
    classDef conflict fill:#fef3c7,stroke:#d97706,color:#92400e,stroke-width:1.5px;
    classDef external fill:#f3f4f6,stroke:#6b7280,color:#374151,stroke-width:1px,stroke-dasharray:5;

    class OUTBOX queue;
    class SYNC_LOG log;
    class CONFLICT conflict;
    class WORKER external;
```

**Legend:** outbox entries use `entityUuid` (not local `entityId`) for cross-device identity. Written in the same transaction as business mutations.

## How the Tables Work Together

- **Outbox** queues every create/update/delete with operation type, payload envelope, and sync status.
- Background worker reads outbox, uploads to cloud, marks success, and retries failures.
- **SyncLog** records each sync session: direction, record counts, errors, and duration.
- **SyncConflict** captures when the same `entityUuid` was modified locally and in cloud before sync.
- Conflict resolution rules vary by entity type (inventory = business rules; masters = server authority).
- Outbox includes `deviceId`, `operationId`, and `sequenceNo` for idempotent replay.
- Delta sync sends only changed records — never the full database.

## Tables

- [[55_outbox]] — transactional outbox for pending sync events.
- [[56_sync_log]] — synchronization session audit log.
- [[57_sync_conflict]] — data conflict resolution queue.
