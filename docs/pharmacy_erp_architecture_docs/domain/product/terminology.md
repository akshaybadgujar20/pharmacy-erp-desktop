# Medicine Master — Terminology

## Purpose

Establish consistent domain vocabulary for the Medicine Master bounded context and eliminate ambiguity between **Medicine** (schema term) and **Product** (legacy/generic ERP term).

## Responsibilities

- Define canonical terms used in code, docs, UI, and permissions.
- Map deprecated or external terms to schema entities.
- Support cross-team communication (pharmacy ops, dev, sync).

## Scope

### In Scope

- Medicine master entity names and relationships.
- Folder naming note (`domain/product/` vs Medicine).
- Contrast with inventory, pricing, and party terms.

### Out of Scope

- Full glossary of entire ERP — see domain README at [../README.md](../README.md).
- Medical/clinical terminology beyond master data labels.

## Related Entities

Canonical schema names — [medicine_master.md](../../database/tables/medicine_master/medicine_master.md):

| Term | Entity / table |
|------|----------------|
| Medicine | `Medicine` |
| Generic | `MedicineGeneric` |
| Category | `MedicineCategory` |
| Schedule | `MedicineSchedule` |
| Manufacturer | `Manufacturer` |
| Salt / composition | `SaltComposition`, `MedicineSalt` |
| Unit | `UnitOfMeasure` |

## Business Rules

### Use "Medicine", not "Product"

| Prefer | Avoid | Reason |
|--------|-------|--------|
| Medicine | Product | No `Product` table exists |
| medicineCode | productCode | Column is `medicineCode` |
| Medicine master | Product catalog | Matches bounded context intent |
| `MASTER:MEDICINE:UPDATE` | `MASTER:PRODUCT:UPDATE` | Seed resource is `MEDICINE` |

The documentation folder `domain/product/` is a **layout alias** only — all new code, APIs, and UI strings should say **Medicine**.

### Core definitions

- **Medicine** — A branded sellable SKU (e.g. "Crocin 500 Tablet"). Aggregate root.
- **MedicineGeneric** — Active pharmaceutical ingredient name independent of brand (e.g. Paracetamol).
- **SaltComposition** — A standardized strength of a generic (e.g. Paracetamol 500 mg).
- **MedicineSalt** — Link between a medicine and one or more salt compositions (supports combinations).
- **MedicineCategory** — Business classification (Antibiotics, Tablets, Surgical Items).
- **MedicineSchedule** — Regulatory class (OTC, Schedule H, H1, X).
- **Manufacturer** — Company that manufactures the medicine; links to `Party`.
- **UnitOfMeasure (UOM)** — Count/pack/volume unit for transactions (Tablet, Strip, Bottle).

### Related but distinct terms

| Term | Domain | Meaning |
|------|--------|---------|
| **Batch** | Inventory | Lot of a medicine (batch no, expiry, cost) |
| **Stock** | Inventory | Branch quantity for a batch |
| **Supplier** | Party / Purchasing | Distributor who invoices the pharmacy |
| **Customer** | Party / Sales | Buyer of medicines |
| **PriceListItem** | Pricing | Branch sale price for a medicine |
| **HSN** | Medicine + Tax | GST classification code on medicine |
| **MRP** | Batch + PriceListItem | Statutory on batch; commercial ceiling on price item |

### Status vocabulary

- Medicine uses **boolean lifecycle flags**, not a single "status" string — see [state-machine.md](./state-machine.md).
- Transactions (PO, invoice) use **string statuses** — do not apply invoice status words to medicine master.

### Sync vocabulary

- **UUID** — global identifier for medicine and syncable masters.
- **id (BIGINT)** — local primary key; not sent as authoritative identity across devices.
- **version** — optimistic lock counter for concurrent edits.

## Domain Events

Event names use Medicine prefix: `MedicineCreated`, not `ProductCreated`.

Outbox entity type: `Medicine` (`OutboxEntityType.MEDICINE`).

## State Model

Derived labels for documentation and UI:

- **Active medicine** — operable master record
- **Discontinued medicine** — withdrawn SKU
- **Inactive medicine** — hidden from selectors
- **Deleted medicine** — soft-deleted tombstone

## Integrations

- **Barcode configuration** — `appliesTo = MEDICINE` in seed barcode config.
- **API routes** — prefer `/medicines` not `/products`.
- **Angular/Electron UI** — display "Medicine" in menus aligned with permission name "Manage Medicines".

## Security Considerations

- Permission strings expose `MEDICINE` resource code — train admins on JWT format `MASTER:MEDICINE:UPDATE`.

## Performance Considerations

- Search indexes named on `Medicine_*` — avoid aliasing tables as Product in raw SQL views.

## Future Enhancements

- Rename `domain/product/` → `domain/medicine/` (requires link updates across docs).
- i18n keys prefixed `medicine.*` not `product.*`.

See [README.md](./README.md) for bounded context index.
