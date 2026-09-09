# Audit module — agent memory model

Implementation-grounded reference for `backend/src/audit/`.

---

## 1. Module snapshot

| Item | Value |
|------|-------|
| **Purpose** | Business audit writes + read APIs for logs and field changes |
| **Module** | [`audit.module.ts`](../../../backend/src/audit/audit.module.ts) |
| **Controllers** | 2 (AuditLog, ChangeHistory — read-only) |
| **Services** | 3 (`AuditService`, `AuditLogService`, `ChangeHistoryService`) |
| **Exports** | `AuditService` |

---

## 2. API catalog

| Resource | Base path | Permission |
|----------|-----------|------------|
| AuditLog | `/audit-logs` | `AUDIT:AUDIT_LOG:READ` |
| ChangeHistory | `/change-histories` | `AUDIT:CHANGE_HISTORY:READ` |

Audit log list defaults to JWT `branchId` filter.

---

## 3. Write patterns

- `AuditService.log(tx, input)` → returns `auditLogId`
- `AuditService.logFieldChanges(tx, auditLogId, changes[])`
- `buildFieldChanges(before, after, fields)` in `utils/audit.util.ts`
- `auditAndLogChanges(...)` helper for pricing/prescription UPDATE

---

## 4. Layer map

| Layer | Path |
|-------|------|
| Controllers | `controllers/` |
| Services | `services/`, `audit.service.ts` |
| DTOs | `dto/` |
| Mappers | `mappers/` |
| Utils | `utils/audit.util.ts`, `utils/audit-query.util.ts` |
