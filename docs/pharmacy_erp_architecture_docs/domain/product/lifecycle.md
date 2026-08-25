# Medicine — Lifecycle

## Purpose

Describe the business lifecycle of a medicine master record from introduction through active use, discontinuation, deactivation, and soft deletion — without conflating it with batch expiry or invoice document status.

## Responsibilities

- Define lifecycle phases and allowed operations in each phase.
- Map lifecycle to schema fields (`isActive`, `discontinued`, `deletedAt`).
- Guide UI and API behavior for master data stewards.

## Scope

### In Scope

- Medicine master lifecycle flags and transitions.
- Impact on purchasing, pricing setup, and sales eligibility at master level.

### Out of Scope

- Batch expiry lifecycle — Inventory domain.
- Price list effective dates — Pricing domain.
- Purchase order / sales invoice string statuses (e.g. `DRAFT`, `POSTED`).

## Related Entities

- **Medicine** — [15_medicine.md](../../database/tables/medicine_master/15_medicine.md)
- **Batch** — continues independently — [23_batch.md](../../database/tables/inventory/23_batch.md)
- **PriceListItem** — branch pricing — [48_price_list_item.md](../../database/tables/pricing/48_price_list_item.md)

## Business Rules

### Introduction

1. New medicine created with `isActive = true`, `discontinued = false`, `deletedAt = NULL`.
2. `medicineCode` assigned before or at create; immutable after first sync publish.
3. Composition (`MedicineSalt`) should be complete before scheduled drugs go live.
4. Branch price list entries are configured separately after medicine exists.

### Active use

- Available in medicine search, purchase order lines, goods receipt, and sales (subject to batch stock and schedule rules).
- Updates allowed with optimistic locking; outbox `MedicineUpdated` emitted.

### Discontinuation

- Set `discontinued = true` when manufacturer withdraws the SKU.
- **Do not** soft delete — historical data and batches remain linked.
- Block **new** purchase orders by policy; existing stock sells through.
- Price list items may remain until manually deactivated.

### Deactivation

- Set `isActive = false` to hide from default selectors (duplicate cleanup, seasonal delist).
- Stricter than discontinuation — often used for data quality holds.
- Existing transactions and batches unchanged.

### Soft delete

- Set `deletedAt` only when no operational dependency remains, or for erroneous creates never transacted.
- Prefer discontinue over delete for products that ever had stock or sales.
- Soft delete emits outbox `DELETE`; medicine hidden from all operational UIs.

### Reinstatement

- `discontinued` may return to `false` if product relaunched.
- `isActive` may return to `true` after data correction.
- `deletedAt` reinstatement requires admin workflow (clear `deletedAt`, increment `version`).

## Domain Events

| Transition | Event |
|------------|-------|
| Create | `MedicineCreated` |
| Field edit | `MedicineUpdated` |
| `discontinued: false → true` | `MedicineDiscontinued` |
| `isActive: true → false` | `MedicineDeactivated` |
| Set `deletedAt` | `MedicineDeleted` |
| Reinstate active | `MedicineUpdated` |

## State Model

| Phase | `isActive` | `discontinued` | `deletedAt` |
|-------|------------|----------------|-------------|
| **Active** | true | false | null |
| **Discontinued** | true/false | true | null |
| **Inactive** | false | false | null |
| **Deleted** | any | any | set |

Derived operational label (application layer):

- `ACTIVE` — active and not discontinued
- `DISCONTINUED` — discontinued and not deleted
- `INACTIVE` — not active, not deleted
- `DELETED` — deletedAt set

See [state-machine.md](./state-machine.md) for transition diagram.

## Integrations

- **Purchasing** — validate medicine active and not deleted before PO line add.
- **Sales** — block deleted/inactive; warn on discontinued; schedule rules still apply when active.
- **Pricing** — inactive price list items independent of medicine lifecycle.
- **Reporting** — include discontinued medicines in historical sales reports.

## Security Considerations

- Discontinue and delete require `MASTER:MEDICINE:UPDATE`.
- Reinstate from deleted may need elevated audit (future dual approval).
- Lifecycle changes logged in audit trail with before/after flags.

## Performance Considerations

- Filter default lists with `WHERE deletedAt IS NULL AND isActive = 1`.
- Discontinued medicines optional in search via explicit filter toggle.
- No cascade updates to batches on lifecycle change — O(1) medicine row update.

## Future Enhancements

- Formal approval workflow (Draft → Approved → Active) with string status column.
- Automatic discontinue when last batch expires and zero stock (configurable).
- Lifecycle dashboard for stale active medicines with no stock in 12 months.
