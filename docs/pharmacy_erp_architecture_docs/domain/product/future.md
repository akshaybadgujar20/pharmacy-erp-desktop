# Medicine Master — Future Enhancements

## Purpose

Track deliberately deferred capabilities for the Medicine Master bounded context. Items here are **not** in the current schema or seed scope but inform roadmap and extension points.

## Responsibilities

- Maintain a prioritized backlog of master-data features.
- Document dependencies on other bounded contexts or infrastructure.
- Avoid scope creep during current implementation phases.

## Scope

### In Scope

- Planned enhancements to medicine catalog, composition, classification, and integration.
- Known gaps vs. full retail pharmacy PIM systems.

### Out of Scope

- Inventory optimization, warehouse automation — Inventory domain.
- Dynamic pricing engines — Pricing domain.
- Full ERP finance features.

## Related Entities

Future work may introduce:

- `MedicineSubstitute` — therapeutic alternate mapping
- `MedicineImage` — media attachments
- `UnitConversion` — packaging hierarchy
- `MedicineAlias` — search synonyms and regional names

Existing anchors remain: [Medicine](../../database/tables/medicine_master/15_medicine.md), [MedicineSalt](../../database/tables/medicine_master/21_medicine_salt.md).

## Business Rules

Deferred features must still obey current invariants when implemented:

- No sale pricing on `Medicine` or `Batch`.
- UUID sync + soft delete + `version` on all new master tables.
- Medicine terminology — no `Product` table introduction without ADR.

## Domain Events

Planned events:

- `MedicineSubstituteMapped` — when interchangeability is defined
- `MedicineImportCompleted` — bulk catalog import batch finished
- `MedicineMerged` — duplicate medicines consolidated

## State Model

Future **approval workflow** for new medicines (Draft → Review → Active) would add a string `status` column — not present today. If added, migrate boolean flags carefully:

| Proposed status | Maps from |
|-----------------|-----------|
| `DRAFT` | New row before verification |
| `ACTIVE` | `isActive && !discontinued` |
| `DISCONTINUED` | `discontinued` |
| `INACTIVE` | `!isActive` |

Requires ADR before schema change.

## Integrations

| Enhancement | Integration |
|-------------|-------------|
| CDSCO / drug DB import | External API + staging tables |
| RxNorm / SNOMED codes | Optional `externalCode` on `MedicineGeneric` |
| E-commerce catalog export | Read-only API over medicine + price list |
| Barcode GS1 lookup | Validate `barcode` on create |

## Security Considerations

- Bulk import must require elevated permission beyond `MASTER:MEDICINE:UPDATE`.
- External API keys stored in app settings, not in medicine rows.
- Merge workflow needs dual-control approval for narcotic medicines.

## Performance Considerations

- Full-text search index (FTS5) on `medicineName`, `brandName`, generic names.
- Materialized view for POS autocomplete (medicine + default branch price).
- Background jobs for import validation, not blocking UI saves.

## Future Enhancements

### Near term

1. **Medicine search API** — paginated filter by category, generic, manufacturer, barcode.
2. **Read permission** — `MASTER:MEDICINE:READ` distinct from UPDATE in seed.
3. **Composition UI** — manage `MedicineSalt` in same form as medicine header.
4. **Duplicate warning** — barcode / name collision hints on save.

### Medium term

5. **Substitute mapping** — link medicines with equivalent generic composition.
6. **Unit conversion** — box → strip → tablet for purchasing vs dispensing UOM.
7. **Category defaults** — suggested schedule and storage flags by category.
8. **Manufacturer preferred flag** — procurement hints (already on `Manufacturer.isPreferred`).

### Long term

9. **Multi-language names** — regional display names for labels and receipts.
10. **Attachment store** — leaflets, images, compliance documents.
11. **Formulary tiers** — hospital formulary inclusion/exclusion lists.
12. **AI-assisted classification** — suggest category/schedule from salt composition (human approval required).

See also [README.md](./README.md) topic index for implemented documentation.
