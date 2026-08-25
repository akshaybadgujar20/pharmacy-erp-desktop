# Medicine Master — Business Rules

## Purpose

Define the invariants and business policies governing medicine master data. These rules apply across UI, API validation, and persistence layers and align with the [Medicine Master table specs](../../database/tables/medicine_master/medicine_master.md).

## Responsibilities

- Document non-negotiable constraints for each master entity.
- Clarify cross-entity rules (composition, manufacturer, schedule).
- Separate master rules from inventory, pricing, and transaction rules.

## Scope

### In Scope

- Rules for `Medicine`, `MedicineGeneric`, `MedicineCategory`, `MedicineSchedule`, `Manufacturer`, `SaltComposition`, `MedicineSalt`, `UnitOfMeasure`.
- Lifecycle and soft-delete policies.
- Sync and versioning expectations.

### Out of Scope

- Batch expiry, FEFO, and stock sufficiency — [inventory.md](./inventory.md).
- Price list validity and minimum selling price — [pricing.md](./pricing.md).
- GST calculation on invoices — Tax / Finance domains.

## Related Entities

- **Medicine** — central rules — [15_medicine.md](../../database/tables/medicine_master/15_medicine.md)
- **MedicineGeneric** — [16_medicine_generic.md](../../database/tables/medicine_master/16_medicine_generic.md)
- **MedicineCategory** — [17_medicine_category.md](../../database/tables/medicine_master/17_medicine_category.md)
- **MedicineSchedule** — [18_medicine_schedule.md](../../database/tables/medicine_master/18_medicine_schedule.md)
- **Manufacturer** — [19_manufacturer.md](../../database/tables/medicine_master/19_manufacturer.md)
- **SaltComposition** / **MedicineSalt** — [20_salt_composition.md](../../database/tables/medicine_master/20_salt_composition.md), [21_medicine_salt.md](../../database/tables/medicine_master/21_medicine_salt.md)
- **UnitOfMeasure** — [22_unit_of_measure.md](../../database/tables/medicine_master/22_unit_of_measure.md)

## Business Rules

### Medicine (aggregate root)

1. **Unique code** — `medicineCode` is unique across the organization.
2. **Required references** — `manufacturerId`, `categoryId`, and `unitId` are mandatory; `scheduleId` is optional but recommended for regulated products.
3. **Name uniqueness** — `medicineName` must not duplicate another active medicine for the same manufacturer.
4. **Dosage form** — `dosageForm` is required (Tablet, Capsule, Syrup, Injection, etc.).
5. **No pricing on master** — sale rate, discount, and tax belong in `PriceListItem` / `Tax`, not on `Medicine`.
6. **No inventory on master** — quantities live in `Stock`; lot data in `Batch`.
7. **Composition** — multi-ingredient formulas use `MedicineSalt`; do not encode full composition only in free-text `strength`.
8. **Discontinuation** — set `discontinued = true` instead of hard delete when the product is withdrawn.
9. **Soft delete** — use `deletedAt`; never hard delete medicines referenced by batches or transactions.
10. **Sync** — every medicine has a stable `uuid`; `id` (BIGINT) is local only.

### MedicineGeneric

1. **Unique generic** — `genericCode` and `genericName` are unique.
2. **Manufacturer-agnostic** — no brand or pack details on generic rows.
3. **Therapeutic metadata** — `therapeuticClass` and `pharmacologicalClass` are optional but should be consistent for reporting.

### MedicineCategory

1. **Unique category** — `categoryCode` and `categoryName` are unique.
2. **Hierarchy** — optional `parentCategoryId`; no circular parent chains (`parentCategoryId <> id`).
3. **Single assignment** — each medicine belongs to exactly one category.
4. **Stability** — prefer deactivating categories over deleting when medicines reference them.

### MedicineSchedule

1. **Unique schedule** — `scheduleCode` and `scheduleName` are unique.
2. **System schedules** — seeded OTC, H, H1, X rows (`isSystemSchedule`) must not be deleted.
3. **Compliance flags** — `requiresPrescription`, `requiresDoctorDetails`, `maintainSalesRegister`, and `controlledSubstance` drive sales validation.
4. **Single schedule per medicine** — a medicine references at most one schedule.

### Manufacturer

1. **Party link** — exactly one `Manufacturer` per `Party`; `partyId` is unique on `Manufacturer`.
2. **Unique codes** — `manufacturerCode` unique; `manufacturingLicenseNo` and `gstin` unique when present.
3. **Not a supplier** — distributors are `Party` / Supplier records; medicines always point to `Manufacturer`, not supplier directly.
4. See [supplier.md](./supplier.md).

### SaltComposition and MedicineSalt

1. **Standardized strengths** — `(genericId, strength, strengthUnit)` unique on `SaltComposition`.
2. **Reusable compositions** — same salt strength is one row, referenced by many medicines via `MedicineSalt`.
3. **Junction uniqueness** — `(medicineId, saltCompositionId)` unique on `MedicineSalt`.
4. **Sequence** — `sequenceNo` orders salts for display (e.g. Amoxicillin first, Clavulanic Acid second).
5. **Optional percentage** — `percentage` on `MedicineSalt` for combination ratio when applicable.

### UnitOfMeasure

1. **Unique unit** — `unitCode` and `unitName` are unique.
2. **Typed units** — `unitType` ∈ `COUNT`, `WEIGHT`, `VOLUME`, `PACKAGING`.
3. **System units** — seeded units (`isSystemUnit`) protected from deletion.
4. **No conversion here** — box/strip/tablet conversions belong in a future `UnitConversion` table.

### Cross-cutting

- **Org-global masters** — medicine rows are not branch-scoped; branch applies on `Batch`/`Stock`/`PriceList`.
- **Optimistic locking** — all syncable masters use `version >= 1`; updates must check expected version.
- **String statuses on transactions** — purchase/sales documents use string status fields; medicine uses boolean lifecycle flags.

## Domain Events

Business rules trigger events when violated (rejection) or satisfied (commit):

- Successful create → `MedicineCreated`
- Rule violation → domain exception (e.g. duplicate `medicineCode` → `CONFLICT`)
- Discontinue → `MedicineDiscontinued`

## State Model

Not applicable as a single enum — see boolean lifecycle in [lifecycle.md](./lifecycle.md).

## Integrations

- **Sales** validates schedule flags at invoice time using `MedicineSchedule` + medicine flags.
- **Purchasing** validates `medicineId` is active and not soft-deleted before PO line entry.
- **Sync** rejects outbound payloads missing `uuid` or with stale `version`.

## Security Considerations

- Master mutations gated by `MASTER:MEDICINE:UPDATE`.
- Schedule and UOM administration may require separate admin roles when expanded beyond seed permissions.

## Performance Considerations

- Enforce uniqueness via DB constraints where possible (`UK_Medicine_Code`, etc.) to avoid race-only application checks.
- Validate composition in the same transaction as medicine save to avoid orphan `MedicineSalt` rows.

## Future Enhancements

- Configurable duplicate-detection rules (barcode vs name vs generic).
- Rule engine for schedule ↔ prescription auto-alignment on save.
- Category-level default tax hints (still resolved through `PriceListItem` at billing).
