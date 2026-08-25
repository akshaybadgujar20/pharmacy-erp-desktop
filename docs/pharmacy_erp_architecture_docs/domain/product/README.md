# Medicine Master — Bounded Context Index

## Purpose

The **Medicine Master** bounded context owns the pharmaceutical product catalog for the pharmacy ERP. It defines what can be purchased, stocked, priced, and sold — without storing inventory quantities, batch lots, or branch sale rates.

This folder is named `product/` for historical layout reasons; the domain vocabulary is **Medicine**, not Product. There is no `Product` table in the schema.

## Responsibilities

- Maintain org-global medicine identity (`medicineCode`, name, dosage form, HSN, barcode).
- Classify medicines via category, schedule, and generic/salt composition.
- Link each medicine to a manufacturer and primary unit of measure.
- Enforce regulatory flags (prescription, narcotic, refrigerated) and lifecycle flags (`isActive`, `discontinued`).
- Publish master-data changes for sync via transactional outbox (`OutboxEntityType.MEDICINE`).

## Scope

### In Scope

- `Medicine` and supporting reference masters: `MedicineGeneric`, `MedicineCategory`, `MedicineSchedule`, `Manufacturer`, `SaltComposition`, `MedicineSalt`, `UnitOfMeasure`.
- Medicine master maintenance workflows, validation, permissions, and domain events.
- Cross-domain **references** to inventory (`Batch`, `Stock`), pricing (`PriceList`, `PriceListItem`), and party (`Party` via `Manufacturer`).

### Out of Scope

- Stock quantities, batch lots, and stock movements — see [Inventory bounded context](../inventory/README.md).
- Branch sale pricing and tax application — see [pricing.md](./pricing.md) and the Pricing tables.
- Purchase and sales transaction processing — see Purchasing and Sales bounded contexts.
- Supplier/distributor party management (distinct from manufacturer) — see [Supplier bounded context](../supplier/README.md).

## Related Entities

| Entity | Role | Table spec |
|--------|------|------------|
| **Medicine** | Aggregate root — branded product record | [15_medicine.md](../../database/tables/medicine_master/15_medicine.md) |
| **MedicineGeneric** | Scientific/generic name (API) | [16_medicine_generic.md](../../database/tables/medicine_master/16_medicine_generic.md) |
| **MedicineCategory** | Hierarchical classification | [17_medicine_category.md](../../database/tables/medicine_master/17_medicine_category.md) |
| **MedicineSchedule** | Regulatory schedule (H, H1, X, OTC) | [18_medicine_schedule.md](../../database/tables/medicine_master/18_medicine_schedule.md) |
| **Manufacturer** | Pharma producer (links `Party`) | [19_manufacturer.md](../../database/tables/medicine_master/19_manufacturer.md) |
| **SaltComposition** | Standardized salt strength | [20_salt_composition.md](../../database/tables/medicine_master/20_salt_composition.md) |
| **MedicineSalt** | Medicine ↔ salt junction | [21_medicine_salt.md](../../database/tables/medicine_master/21_medicine_salt.md) |
| **UnitOfMeasure** | Shared quantity unit master | [22_unit_of_measure.md](../../database/tables/medicine_master/22_unit_of_measure.md) |
| **Batch** | Lot identity per medicine (inventory) | [23_batch.md](../../database/tables/inventory/23_batch.md) |
| **PriceListItem** | Branch sale price per medicine | [48_price_list_item.md](../../database/tables/pricing/48_price_list_item.md) |

Overview diagram and table index: [medicine_master.md](../../database/tables/medicine_master/medicine_master.md).

## Business Rules

- Every medicine has a globally unique `medicineCode` and belongs to exactly one manufacturer, category, and primary UOM.
- Chemical composition is modeled through `MedicineSalt` → `SaltComposition`, not duplicated on `Medicine.strength` alone.
- Sale pricing lives in `PriceListItem`, not on `Medicine` or `Batch`.
- `Batch` stores lot cost (`purchaseRate`) and statutory MRP; branch counter price comes from pricing.
- Masters use UUID for sync, BIGINT internal PK, soft delete (`deletedAt`), and optimistic locking (`version`).
- Medicine master data is **org-global**; branch scoping applies to transactions (sales, stock, price lists), not to the medicine row itself.

## Domain Events

| Event | Trigger | Outbox |
|-------|---------|--------|
| `MedicineCreated` | New medicine persisted | `CREATE` on `Medicine` uuid |
| `MedicineUpdated` | Master fields or composition changed | `UPDATE` |
| `MedicineDeactivated` | `isActive` set false | `UPDATE` |
| `MedicineDiscontinued` | `discontinued` set true | `UPDATE` |
| `MedicineDeleted` | Soft delete | `DELETE` |

Supporting master events follow the same pattern when sync is enabled for those entity types. See [events.md](./events.md).

## State Model

Medicine lifecycle is expressed with boolean flags, not a string status column:

| Flag | Meaning |
|------|---------|
| `isActive = true`, `discontinued = false` | Available for new batches and billing |
| `discontinued = true` | No longer procured; existing stock may still sell |
| `isActive = false` | Hidden from selection; retained for history |

See [lifecycle.md](./lifecycle.md) and [state-machine.md](./state-machine.md).

## Integrations

- **Inventory** — `Medicine` → `Batch` → `Stock` (branch-scoped balances).
- **Pricing** — `Medicine` → `PriceListItem` (branch-scoped sale rate and tax).
- **Purchasing / Sales** — line items reference `medicineId`; rates and tax snapshotted at transaction time.
- **Party** — `Manufacturer.partyId` → `Party` for legal identity and contacts.
- **Sync** — outbox enqueue on medicine mutations; UUID is the cross-device identifier.
- **Barcode** — `BarcodeConfiguration.appliesTo = MEDICINE` for label printing.

## Security Considerations

- Mutations require `MASTER:MEDICINE:UPDATE` (seed permission). See [permissions.md](./permissions.md).
- Schedule and system UOM changes should be restricted to administrators.
- Audit trail via `AuditService` for create/update/delete on master records.
- Medicine master is not branch-scoped for authorization; branch context still required for downstream transactional modules.

## Performance Considerations

- Index-backed lookups: `medicineCode`, `medicineName`, `barcode`, `manufacturerId`, `categoryId`, `isActive`.
- Master lists are cache-friendly (read-heavy); invalidate on outbox `Medicine` events.
- Composition joins (`MedicineSalt` + `SaltComposition` + `MedicineGeneric`) should be eager-loaded for detail screens only.
- Paginate medicine search; avoid unbounded full-table scans in POS autocomplete.

## Future Enhancements

- Alternate SKUs, substitute medicine mapping, and therapeutic equivalence groups.
- External drug database import (RxNorm, CDSCO) with merge workflow.
- Image and leaflet attachments per medicine.
- See [future.md](./future.md) for the full deferred backlog.

## Topic Index

| Document | Focus |
|----------|-------|
| [aggregate.md](./aggregate.md) | `Medicine` as aggregate root |
| [business-rules.md](./business-rules.md) | Master data invariants |
| [events.md](./events.md) | Domain and outbox events |
| [inventory.md](./inventory.md) | Medicine ↔ Batch ↔ Stock |
| [lifecycle.md](./lifecycle.md) | Active / discontinued lifecycle |
| [permissions.md](./permissions.md) | `MASTER:MEDICINE:*` |
| [pricing.md](./pricing.md) | PriceList / Tax cross-domain |
| [state-machine.md](./state-machine.md) | Status flag model |
| [supplier.md](./supplier.md) | Manufacturer vs supplier |
| [terminology.md](./terminology.md) | Medicine vs Product vocabulary |
| [validation.md](./validation.md) | Input validation rules |
| [workflows.md](./workflows.md) | Master maintenance workflow |
| [future.md](./future.md) | Deferred features |
