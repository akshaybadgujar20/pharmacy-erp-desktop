# Prescription module — agent memory model

Implementation-grounded reference for `backend/src/prescription/`.

---

## 1. Module snapshot

| Item | Value |
|------|-------|
| **Purpose** | Doctor prescriptions with line items and workflow |
| **Module** | [`prescription.module.ts`](../../../backend/src/prescription/prescription.module.ts) |
| **Controllers** | 2 (Prescription, PrescriptionItem nested) |
| **Services** | 2 |
| **Exports** | `PrescriptionService` |

---

## 2. API catalog

Permissions use `PRESCRIPTION:RESOURCE:ACTION`.

| Resource | Base path | Scoping |
|----------|-----------|---------|
| Prescription | `/prescriptions` | Branch-scoped (JWT) |
| PrescriptionItem | `/prescriptions/:prescriptionId/items` | Nested |

### Workflow routes

| Method | Path | Permission | Transition |
|--------|------|------------|------------|
| POST | `/prescriptions/:id/activate` | `PRESCRIPTION:PRESCRIPTION:ACTIVATE` | DRAFT → ACTIVE |
| POST | `/prescriptions/:id/cancel` | `PRESCRIPTION:PRESCRIPTION:CANCEL` | DRAFT/ACTIVE → CANCELLED |
| POST | `/prescriptions/:id/expire` | `PRESCRIPTION:PRESCRIPTION:EXPIRE` | ACTIVE/PARTIALLY_DISPENSED → EXPIRED |
| PUT | `/prescriptions/:prescriptionId/items/replace` | `PRESCRIPTION:PRESCRIPTION_ITEM:REPLACE` | DRAFT only |

---

## 3. Business rules

- Client provides `prescriptionNumber`; created in `DRAFT`
- Header/item edits only in `DRAFT`
- `dispensedQuantity`, `remainingQuantity`, `status` read-only on API
- Prescription UPDATE uses `auditAndLogChanges`
- Sales dispensing integration out of scope

---

## 4. Layer map

| Layer | Path |
|-------|------|
| Controllers | `controllers/` |
| Services | `services/` |
| DTOs | `dto/` |
| Mappers | `mappers/` |
| Constants | `constants/prescription.constants.ts` |
| Utils | `utils/prescription.util.ts` |
