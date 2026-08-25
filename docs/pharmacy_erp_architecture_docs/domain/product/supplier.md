# Medicine — Manufacturer and Supplier

## Purpose

Clarify the distinction between **Manufacturer** (who makes the medicine) and **Supplier** (who sells/delivers stock to the pharmacy), and how Medicine Master integrates with Party management.

## Responsibilities

- Document the Manufacturer → Party relationship.
- Explain why medicines reference Manufacturer, not Supplier or Party directly.
- Guide procurement workflows that involve both supplier and manufacturer identity.

## Scope

### In Scope

- `Manufacturer` entity and `Party` link.
- Medicine's `manufacturerId` reference.
- Business distinction from Supplier bounded context.

### Out of Scope

- Supplier contracts, payment terms, and GRN supplier selection — [Supplier domain](../supplier/README.md).
- Purchase order header party — Purchasing domain.

## Related Entities

```
Party (legal identity)
    │
    ├── Manufacturer (1:1) ──< Medicine (many)
    │
    └── Supplier (1:1) ── used on PurchaseOrder / PurchaseInvoice
```

| Entity | Table spec |
|--------|------------|
| Manufacturer | [19_manufacturer.md](../../database/tables/medicine_master/19_manufacturer.md) |
| Medicine | [15_medicine.md](../../database/tables/medicine_master/15_medicine.md) |
| Party | Party management tables |

## Business Rules

### Manufacturer

1. **One Party, one Manufacturer** — `Manufacturer.partyId` is unique; company name and address live on `Party`.
2. **Unique manufacturer code** — `manufacturerCode` required for master data integrity.
3. **Regulatory identifiers** — `manufacturingLicenseNo` unique when provided; `gstin` unique when provided.
4. **Preferred flag** — `isPreferred` hints procurement/reporting; does not auto-select on PO.
5. **Produces many medicines** — one manufacturer, many `Medicine` rows.
6. **Inactive manufacturer** — `isActive = false` warns on new medicine create; existing medicines remain.

### Supplier vs manufacturer

7. **Supplier distributes** — a distributor (`Supplier` → `Party`) may deliver batches from multiple manufacturers.
8. **Medicine points to maker** — `Medicine.manufacturerId` is the pharma company on the pack, not the invoicing supplier.
9. **GRN line** — references `medicineId` (hence manufacturer) and purchase invoice supplier separately.
10. **No skip-level link** — do not set `Medicine` → `Party` directly; always through `Manufacturer`.

### Name uniqueness

11. **Medicine name** — unique per manufacturer (`medicineName` + `manufacturerId`), not per supplier.

### Sync

12. **Manufacturer UUID** — syncable master with `version`; Party uuid linked for identity merge on sync.

## Domain Events

| Event | When |
|-------|------|
| `ManufacturerCreated` | New manufacturer registered (future outbox) |
| `ManufacturerUpdated` | License, GSTIN, preferred flag changed |
| `ManufacturerDeactivated` | `isActive = false` |
| `MedicineCreated` | Includes `manufacturerId` / uuid in payload |

Medicine events carry manufacturer reference; manufacturer events do not cascade-change medicine rows automatically.

## State Model

| Manufacturer state | New medicines | Existing medicines |
|--------------------|---------------|-------------------|
| Active | Allowed | Normal |
| Inactive | Warn/block | Unchanged |
| Soft deleted | Block | Historical reference |

## Integrations

- **Party module** — create Party first, then Manufacturer extension row.
- **Purchasing** — PO to Supplier; line items resolve Medicine → Manufacturer for product identity.
- **Reporting** — sales by manufacturer via `Medicine.manufacturerId` join.
- **Compliance** — manufacturing license on manufacturer; supplier drug license on supplier party (Supplier domain).

## Security Considerations

- Manufacturer create/update may use `MASTER:MEDICINE:UPDATE` initially or `PARTY:PARTY:UPDATE` for Party shell — align with role design.
- GSTIN and license numbers are sensitive; restrict export reports.

## Performance Considerations

- Index `Medicine.manufacturerId` for manufacturer-wise catalogs.
- Join Party for display name only when needed — cache manufacturer list for dropdowns.

## Future Enhancements

- Many-to-many **supplier–manufacturer** authorization (which distributor can supply which brands).
- Manufacturer merge workflow when duplicate Party detected.
- Link manufacturer to country of origin for import compliance.

See [terminology.md](./terminology.md) for vocabulary and [workflows.md](./workflows.md) for maintenance order (Party → Manufacturer → Medicine).
