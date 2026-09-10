# Settings module — agent memory model

Implementation-grounded reference for `backend/src/settings/`.

---

## 1. Module snapshot

| Item | Value |
|------|-------|
| **Purpose** | AppSetting CRUD, typed getters, branch/company resolution, in-memory cache |
| **Module** | [`settings.module.ts`](../../../backend/src/settings/settings.module.ts) |
| **Controllers** | 1 |
| **Services** | 1 (`SettingsService`) |
| **Split from Configuration** | Org/device config CRUD lives in [`ConfigurationModule`](../../../backend/src/configuration/configuration.module.ts); runtime key/value settings live here |

---

## 2. API catalog

Permissions use `CONFIGURATION:APP_SETTING:ACTION`.

| Method | Path | Permission | Notes |
|--------|------|------------|-------|
| GET | `/settings?category=` | `READ` | Branch override dedupe in list |
| GET | `/settings/:key` | `READ` | Single key |
| POST | `/settings` | `CREATE` | Validates `branchId` belongs to JWT company |
| PUT | `/settings/:key` | `UPDATE` | Body requires `{ version, settingValue }` |
| DELETE | `/settings/:key?version=` | `DELETE` | Soft-delete; `version` query param |

---

## 3. Business rules

- **Resolution order:** branch-scoped row → company-wide row (`branchId: null`) → error or caller default
- **List dedupe:** when both branch and company rows exist for same key, branch row wins
- **Cache:** 60s in-memory; invalidated on update/delete
- **Typed getters:** `getString`, `getNumber`, `getBoolean`, `getJson` — use [`setting-keys.constants.ts`](../../../backend/src/settings/setting-keys.constants.ts), not string literals
- **Mutations:** audit + outbox in same transaction (`AuditModule.CONFIGURATION`); UPDATE uses `auditAndLogChanges` for `settingValue`
- **Non-editable settings:** reject update/delete when `isEditable=false`
- **Branch scope helper:** `assertBranchInCompany` from [`branch-scope.util.ts`](../../../backend/src/persistence/context/branch-scope.util.ts)

---

## 4. Layer map

| Layer | Path |
|-------|------|
| Controller | `settings.controller.ts` |
| Service | `settings.service.ts` |
| DTOs | `dto/` |
| Mapper | `settings.mapper.ts` |
| Constants | `setting-keys.constants.ts` |
| Utils | `utils/settings.util.ts` |

---

## 5. Cross-cutting refs

- Early foundations: [early-foundations.md](../../../docs/pharmacy_erp_architecture_docs/architecture/early-foundations.md)
- Table spec: `AppSetting` in configuration schema docs
- Branch filter pattern: [`buildCompanyBranchFilter`](../../../backend/src/persistence/context/branch-scope.util.ts)
