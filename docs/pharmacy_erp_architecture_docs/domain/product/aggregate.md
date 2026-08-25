# Medicine — Aggregate

## Purpose

`Medicine` is the aggregate root of the Medicine Master bounded context. It represents a **branded pharmaceutical product** that the pharmacy can buy, store, and sell. All identity, classification, regulatory, and composition data for a sellable SKU converges on this aggregate.

## Responsibilities

- Own medicine identity: `medicineCode`, `medicineName`, `brandName`, `dosageForm`, `packSize`, `strength`, `hsnCode`, `barcode`.
- Enforce references to required masters: `Manufacturer`, `MedicineCategory`, `UnitOfMeasure`, optional `MedicineSchedule`.
- Maintain regulatory flags: `requiresPrescription`, `narcoticDrug`, `refrigerated`.
- Control lifecycle flags: `isActive`, `discontinued`.
- Coordinate child composition via `MedicineSalt` entries (value objects / entities within the aggregate boundary).
- Emit outbox events on create, update, and soft delete for UUID-based sync.

## Scope

### In Scope

- The `Medicine` entity and its `medicineSalts` collection.
- Invariants that must hold before a medicine is persisted or offered to inventory/pricing modules.
- Optimistic concurrency on the medicine row (`version`).

### Out of Scope

- `Batch`, `Stock`, and stock movements (Inventory aggregate).
- `PriceListItem` rows (Pricing aggregate).
- `Manufacturer`, `MedicineCategory`, and other reference masters as separate aggregates — referenced by ID, not owned inline.
- Transaction line items (`PurchaseInvoiceItem`, `SalesInvoiceItem`).

## Related Entities

```
Manufacturer ──► Medicine ◄── MedicineCategory
                      │
         ┌────────────┼────────────┐
         ▼            ▼            ▼
  MedicineSchedule  UnitOfMeasure  MedicineSalt ──► SaltComposition ──► MedicineGeneric
```

- **Aggregate root:** `Medicine` — [15_medicine.md](../../database/tables/medicine_master/15_medicine.md)
- **Composition children:** `MedicineSalt` — [21_medicine_salt.md](../../database/tables/medicine_master/21_medicine_salt.md)
- **Referenced masters:** `Manufacturer`, `MedicineCategory`, `MedicineSchedule`, `UnitOfMeasure`
- **Downstream consumers:** `Batch`, `PriceListItem`, purchase/sales line items

## Business Rules

- `medicineCode` is globally unique; assigned via sequence or admin policy, never reused after soft delete.
- `medicineName` should be unique within the same manufacturer (business rule; enforce in application layer).
- Exactly one primary `unitId` per medicine — the UOM used on invoices and stock.
- `scheduleId` drives prescription and register rules; when set, application logic should align `requiresPrescription` with schedule defaults.
- At least one `MedicineSalt` row is recommended for scheduled drugs; combination medicines have multiple salts with distinct `sequenceNo`.
- Discontinuing a medicine does not delete batches or historical transactions.
- Deactivating (`isActive = false`) prevents **new** operational use but preserves referential integrity.
- All mutations increment `version`; concurrent updates throw `CONFLICT`.

## Domain Events

| Event | Payload highlights |
|-------|-------------------|
| `MedicineCreated` | `uuid`, `medicineCode`, `manufacturerId`, `categoryId` |
| `MedicineUpdated` | Changed fields, new `version` |
| `MedicineCompositionChanged` | Added/removed `MedicineSalt` rows |
| `MedicineDeactivated` | `isActive: false` |
| `MedicineDiscontinued` | `discontinued: true` |
| `MedicineDeleted` | `deletedAt`, `uuid` |

Outbox: `entityType = Medicine`, `entityUuid = medicine.uuid`, `operation = CREATE | UPDATE | DELETE`.

## State Model

The aggregate does not use a string `status` column. Operational state is derived:

| Derived state | Conditions |
|---------------|------------|
| **Active** | `isActive && !discontinued && deletedAt IS NULL` |
| **Discontinued** | `discontinued && deletedAt IS NULL` |
| **Inactive** | `!isActive && deletedAt IS NULL` |
| **Deleted** | `deletedAt IS NOT NULL` |

See [state-machine.md](./state-machine.md).

## Integrations

- **Inventory module** creates `Batch` rows referencing `medicineId` after goods receipt; medicine aggregate does not create batches.
- **Pricing module** adds `PriceListItem` per branch price list; medicine aggregate does not store prices.
- **SequenceGenerator** may allocate `medicineCode` using a dedicated document type when implemented.
- **AuditService** records actor, module `MASTER`, action `CREATE` / `UPDATE` / `DELETE`.

## Security Considerations

- Create/update/delete on the aggregate requires `MASTER:MEDICINE:UPDATE`.
- Read access for medicine search is typically granted to all authenticated branch users (separate read permission may be added later).
- Narcotic and Schedule X medicines may require elevated dispensing permissions in the Sales context (cross-cutting rule).

## Performance Considerations

- Load aggregate with `medicineSalts` + `saltComposition` + `generic` only for detail/edit screens.
- List/search endpoints should project flat DTOs without deep joins.
- Unique indexes on `medicineCode` and `barcode` keep point lookups O(log n).

## Future Enhancements

- Domain service for **medicine merge** (duplicate detection by barcode/generic).
- Aggregate factory validating schedule ↔ prescription flag consistency.
- Event-sourced composition history for regulatory audit of formula changes.
