# Sync module — agent memory model

Implementation-grounded reference for `backend/src/sync/`.

---

## 1. Module snapshot

| Item | Value |
|------|-------|
| **Purpose** | Outbox admin (read/retry), SyncLog read, SyncConflict read/resolve |
| **Module** | [`sync.module.ts`](../../../backend/src/sync/sync.module.ts) |
| **Controllers** | 4 (includes `SyncRunController`) |
| **Services** | 4 (`OutboxAdminService`, `SyncLogService`, `SyncConflictService`, `SyncRunService`) |
| **Outbox write** | Existing [`OutboxService.enqueue`](../../../backend/src/persistence/outbox/outbox.service.ts) in business modules |

---

## 2. API catalog

| Resource | Base path | Notes |
|----------|-----------|-------|
| Outbox | `/outbox` | List (`dateFrom`/`dateTo`, `syncStatus`, `entityType`, `deviceId`), get, retry |
| SyncLog | `/sync-logs` | Read-only (`dateFrom`/`dateTo`, `status`, `syncType`, `syncDirection`, `deviceId`) |
| SyncConflict | `/sync-conflicts` | List (`syncLogId`, `resolutionStatus`, `entityType`, `deviceId`), get, resolve |
| Sync run | `/sync/runs` | Push pending outbox to cloud (`SYNC_CLOUD_URL`) |

### Workflow routes

| Method | Path | Permission |
|--------|------|------------|
| POST | `/outbox/:id/retry` | `SYNC:OUTBOX:RETRY` |
| POST | `/sync-conflicts/:id/resolve` | `SYNC:SYNC_CONFLICT:RESOLVE` |
| POST | `/sync/runs` | `SYNC:SYNC:EXECUTE` (`SYNC_RUN`) |
| GET | `/sync/runs/latest` | `SYNC:SYNC_LOG:READ` |

Requires env `SYNC_CLOUD_URL` (optional `SYNC_BATCH_SIZE`). See [product-gaps-delivery.md](../../../docs/pharmacy_erp_architecture_docs/architecture/product-gaps-delivery.md).

---

## 3. Business rules

- **Outbox retry:** only `FAILED` or `PROCESSING` → `PENDING`; version-checked; audited via `OutboxAdminService`
- **Conflict resolve (v1):** metadata only — sets `MANUAL_RESOLVED`; audited under `AuditModule.SYNCHRONIZATION`; does not apply payloads to business tables
- **Sync admin mutations:** audit only; no outbox enqueue
- **SyncLog:** immutable session history; no HTTP create/update/delete

---

## 4. Layer map

| Layer | Path |
|-------|------|
| Controllers | `controllers/` |
| Services | `services/` |
| DTOs | `dto/` |
| Mappers | `mappers/` |
| Constants | `constants/sync.constants.ts` |
| Utils | `utils/sync.util.ts` |

---

## 5. Out of scope

- Pull delta / apply remote changes
- Applying conflict resolution payloads to business entities
- Physical delete of outbox/sync rows
- Production cloud service in this repo (tests use `test/support/cloud-sync-mock.ts`)
