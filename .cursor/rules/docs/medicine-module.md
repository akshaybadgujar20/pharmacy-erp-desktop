# Medicine module — agent memory model

Implementation-grounded reference for `backend/src/medicine/`. For table-level domain design, see [medicine_master.md](../../../docs/pharmacy_erp_architecture_docs/database/tables/medicine_master/medicine_master.md).

---

## 1. Module snapshot

| Item | Value |
|------|-------|
| **Purpose** | Org-global medicine master data — UOM, schedules, categories, generics, salt compositions, manufacturers, medicines, medicine-salt junction |
| **Module** | [`medicine.module.ts`](../../../backend/src/medicine/medicine.module.ts) |
| **Controllers** | 8 |
| **Services** | 8 |
| **Exports** | `MedicineService` |

---

## 2. API catalog

Permissions use `MASTER:RESOURCE:ACTION`. Delete endpoints require `DeleteEntityQueryDto` (`version` query param).

| Resource | Base path | Permission prefix |
|----------|-----------|-------------------|
| UnitOfMeasure | `/units-of-measure` | `MASTER:UNIT_OF_MEASURE` |
| MedicineSchedule | `/medicine-schedules` | `MASTER:MEDICINE_SCHEDULE` |
| MedicineCategory | `/medicine-categories` | `MASTER:MEDICINE_CATEGORY` |
| MedicineGeneric | `/medicine-generics` | `MASTER:MEDICINE_GENERIC` |
| SaltComposition | `/salt-compositions` | `MASTER:SALT_COMPOSITION` |
| Manufacturer | `/manufacturers` | `MASTER:MANUFACTURER` |
| Medicine | `/medicines` | `MASTER:MEDICINE` |
| MedicineSalt | `/medicines/:medicineId/salts` | `MASTER:MEDICINE_SALT` |

### Workflow route

| Method | Path | Permission |
|--------|------|------------|
| PUT | `/medicines/:medicineId/salts/replace` | `MASTER:MEDICINE_SALT:REPLACE` |

---

## 3. Business rules

### Medicine

- Client provides `medicineCode` (unique, immutable after create)
- `medicineName` unique within `manufacturerId`
- Soft delete blocked when downstream refs exist (`MEDICINE_IN_USE`)

### Manufacturer

- One manufacturer per party (mirrors Supplier)
- `partyId` immutable after create
- Soft delete blocked when medicines exist

### MedicineCategory

- Flat CRUD with optional `parentCategoryId`
- Circular parent check via `assertNoCategoryCycle`
- Delete blocked when children or medicines exist

### MedicineSalt

- Hard delete (no `deletedAt`)
- Auto-set `medicineGenericId` from `SaltComposition.genericId` on create
- Replace: delete all existing rows, insert new set in one transaction

### System rows

- `isSystemSchedule` / `isSystemUnit` are metadata flags only — full CRUD allowed; delete blocked by FK guards only

---

## 4. Layer map

| Layer | Path |
|-------|------|
| Controllers | `controllers/` |
| Services | `services/` |
| DTOs | `dto/` |
| Mappers | `mappers/` |
| Constants | `constants/medicine.constants.ts` |
| Utils | `utils/medicine.util.ts` |

---

## 5. Permissions seed

33 new permissions from `bbbb...a7` through `bbbb...c7`. Legacy `MASTER_MEDICINE` (`bbbb...06`, UPDATE only) retained. Admin role mappings: `dddd...98` through `dddd...b8`.

---

## 6. Not implemented

Unit/persistence/e2e tests, Angular UI, category tree endpoint, medicine code auto-sequence, refactoring `inventory.util.assertMedicineExists`.
