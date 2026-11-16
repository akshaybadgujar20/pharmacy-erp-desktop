# Sync module — agent memory model

Implementation-grounded reference for `backend/src/sync/`.

---

## 1. Module snapshot

| Item | Value |
|------|-------|
| **Purpose** | Outbox admin (read/retry), SyncLog read, SyncConflict read/resolve |
| **Module** | [`sync.module.ts`](../../../backend/src/sync/sync.module.ts) |
| **Controllers** | 4 (includes `SyncRunController`) |
| **Services** | `OutboxAdminService`, `SyncLogService`, `SyncConflictService`, `SyncRunService`, `SyncApplyService`, `DeviceSyncStateService`, `SyncCloudClient` |
| **Outbox write** | Existing [`OutboxService.enqueue`](../../../backend/src/persistence/outbox/outbox.service.ts) in business modules |

---

## 2. API catalog

| Resource | Base path | Notes |
|----------|-----------|-------|
| Outbox | `/outbox` | List (`dateFrom`/`dateTo`, `syncStatus`, `entityType`, `deviceId`), get, retry |
| SyncLog | `/sync-logs` | Read-only (`dateFrom`/`dateTo`, `status`, `syncType`, `syncDirection`, `deviceId`) |
| SyncConflict | `/sync-conflicts` | List (`syncLogId`, `resolutionStatus`, `entityType`, `deviceId`), get, resolve |
| Sync run | `/sync/runs` | Batch push + pull/apply (masters/party); JWT forwarded to cloud |

### Workflow routes

| Method | Path | Permission |
|--------|------|------------|
| POST | `/outbox/:id/retry` | `SYNC:OUTBOX:RETRY` |
| POST | `/sync-conflicts/:id/resolve` | `SYNC:SYNC_CONFLICT:RESOLVE` |
| POST | `/sync/runs` | `SYNC:SYNC:EXECUTE` (`SYNC_RUN`) |
| GET | `/sync/runs/latest` | `SYNC:SYNC_LOG:READ` |

Requires env `SYNC_CLOUD_URL` (base through `/api/sync`), optional `SYNC_BATCH_SIZE`, `SYNC_PULL_LIMIT`, `SYNC_MAX_PULL_PAGES`. Contract: [sync-cloud-api.md](../../../docs/pharmacy_erp_architecture_docs/architecture/sync-cloud-api.md).

---

## 3. Business rules

- **Outbox retry:** only `FAILED` or `PROCESSING` → `PENDING`; version-checked; audited via `OutboxAdminService`
- **Conflict resolve:** `SERVER_WINS` applies `serverPayload` via `SyncApplyService`; other strategies remain metadata-only (ADR-138 addendum)
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
| Constants | `constants/sync.constants.ts`, `constants/sync-phase1-entity-types.ts` |
| Cloud client | `cloud/sync-cloud.client.ts`, `cloud/sync-cloud.contract.ts` |
| Apply | `apply/masters-party.apply.ts`, `services/sync-apply.service.ts` |
| Utils | `utils/sync.util.ts` |

---

## 5. Out of scope

- Phase 1 pull/push for inventory, sales, purchase, ledger (outbox stays `PENDING`)
- Applying conflict resolution payloads from admin UI (metadata-only resolve per ADR-138)
- Physical delete of outbox/sync rows
- Spring Boot cloud service (external; tests use `test/support/cloud-sync-mock.ts`)
