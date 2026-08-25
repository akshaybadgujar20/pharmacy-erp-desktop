# Medicine Master — Validation

## Purpose

Define validation rules for medicine master data at API/DTO, domain, and database layers. Aligns with class-validator DTOs (NestJS) and Prisma/ SQLite constraints.

## Responsibilities

- List field-level and cross-field validation for Medicine and related masters.
- Specify error codes and HTTP statuses for validation failures.
- Distinguish schema constraints from business policy checks.

## Scope

### In Scope

- Create/update/delete validation for `Medicine` and composition children.
- Reference integrity to related masters.
- Optimistic locking and UUID requirements.

### Out of Scope

- Batch expiry validation — Inventory.
- Price floor / effective date validation — Pricing.
- GST calculation arithmetic — Sales.

## Related Entities

- [15_medicine.md](../../database/tables/medicine_master/15_medicine.md)
- [21_medicine_salt.md](../../database/tables/medicine_master/21_medicine_salt.md)
- [19_manufacturer.md](../../database/tables/medicine_master/19_manufacturer.md)
- [17_medicine_category.md](../../database/tables/medicine_master/17_medicine_category.md)
- [18_medicine_schedule.md](../../database/tables/medicine_master/18_medicine_schedule.md)
- [22_unit_of_measure.md](../../database/tables/medicine_master/22_unit_of_measure.md)

## Business Rules

### Medicine — required fields (create)

| Field | Rule |
|-------|------|
| `medicineCode` | Non-empty, max 30, unique |
| `medicineName` | Non-empty, max 200 |
| `manufacturerId` | Valid, active manufacturer exists |
| `categoryId` | Valid, active category exists |
| `unitId` | Valid, active UOM exists |
| `dosageForm` | Non-empty, max 50 |

### Medicine — optional fields

| Field | Rule |
|-------|------|
| `scheduleId` | If set, schedule exists and active |
| `brandName` | Max 150 |
| `strength` | Max 50 (display hint; composition is authoritative) |
| `packSize` | Max 50 |
| `hsnCode` | Max 20; numeric pattern per GST policy |
| `barcode` | Max 50; unique if provided |
| `requiresPrescription` | Boolean, default false |
| `narcoticDrug` | Boolean, default false |
| `refrigerated` | Boolean, default false |

### Medicine — flags

| Field | Rule |
|-------|------|
| `isActive` | Boolean, default true |
| `discontinued` | Boolean, default false |
| `version` | Required on update, >= 1, must match DB row |

### Cross-field validation

1. **Name per manufacturer** — reject if another non-deleted medicine shares `medicineName` + `manufacturerId` → `CONFLICT`.
2. **Schedule vs prescription** — warn if `schedule.requiresPrescription` and `requiresPrescription = false`.
3. **Narcotic** — if `MedicineSchedule.controlledSubstance`, recommend `narcoticDrug = true`.
4. **Discontinued + active** — allow but UI confirms intent.
5. **Soft delete** — reject if policy forbids delete with open stock (application check → `CONFLICT`).

### MedicineSalt — composition

| Field | Rule |
|-------|------|
| `saltCompositionId` | Must exist, active |
| `sequenceNo` | Integer >= 1 |
| `percentage` | If set, 0–100 |
| Uniqueness | No duplicate `saltCompositionId` per medicine |

At least one salt recommended for scheduled medicines; not a hard DB constraint.

### Reference master validation (summary)

| Master | Key rules |
|--------|-----------|
| MedicineGeneric | Unique `genericCode`, `genericName` |
| MedicineCategory | Unique codes; valid parent; no cycles |
| MedicineSchedule | Unique codes; protect system schedules on delete |
| Manufacturer | Valid `partyId`; unique `manufacturerCode` |
| SaltComposition | Unique `(genericId, strength, strengthUnit)` |
| UnitOfMeasure | Unique codes; valid `unitType` enum |

### Update / concurrency

- PATCH/PUT must include `version`; mismatch → `CONFLICT` (`ApplicationException`).
- Whitelist DTO fields — unknown properties rejected (`forbidNonWhitelisted`).

### Delete validation

- Soft delete sets `deletedAt`; reject double delete → `NOT_FOUND`.
- Optional: block delete when `Batch` or posted invoice lines exist.

## Domain Events

Validation failure prevents event emission. Successful validation followed by commit emits events per [events.md](./events.md).

## State Model

Validation differs by derived state:

| State | Create | Update | Delete |
|-------|--------|--------|--------|
| ACTIVE | Full rules | Full rules | Policy check |
| DISCONTINUED | — | Limited fields | Policy check |
| DELETED | — | Reinstate only | Idempotent |

## Integrations

- **ValidationPipe** — global whitelist/transform in [main.ts](../../../../backend/src/main.ts).
- **Prisma** — unique FK errors mapped via `prisma-error.mapper` → `CONFLICT` / `NOT_FOUND`.
- **Barcode service** — optional EAN13 checksum validation when config `appliesTo = MEDICINE`.

## Security Considerations

- Validation does not replace authorization — require `MASTER:MEDICINE:UPDATE` for writes.
- Do not expose internal BIGINT ids in error messages to clients; use uuid in details.

## Performance Considerations

- Uniqueness checks rely on DB indexes first; application pre-check optional for UX message.
- Batch validate composition in single transaction — one round trip.

## Future Enhancements

- Async validation against external drug directory.
- Custom validators for HSN ↔ tax category alignment.
- Field-level validation groups (Create vs Update DTOs).

See [business-rules.md](./business-rules.md) for policy and [workflows.md](./workflows.md) for when validation runs in the UI flow.
