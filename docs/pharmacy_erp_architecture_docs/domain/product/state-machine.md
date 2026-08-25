# Medicine — State Model

## Purpose

Document the operational state model for medicine master records. Unlike transactional documents (purchase orders, sales invoices) that use **string status** fields, medicine lifecycle is modeled with **boolean flags** plus soft delete.

## Responsibilities

- Define derived states and valid transitions.
- Prevent invalid combinations where possible.
- Provide a reference for UI badges and API filters.

## Scope

### In Scope

- `isActive`, `discontinued`, and `deletedAt` on `Medicine`.
- Application-layer derived status labels.

### Out of Scope

- Batch `isActive` and expiry — Inventory.
- Outbox `syncStatus` strings (`PENDING`, `SYNCED`, etc.) — infrastructure.
- Invoice statuses (`DRAFT`, `POSTED`, `CANCELLED`) — Sales/Purchasing.

## Related Entities

- **Medicine** — [15_medicine.md](../../database/tables/medicine_master/15_medicine.md)
- **MedicineSchedule** — compliance overlays — [18_medicine_schedule.md](../../database/tables/medicine_master/18_medicine_schedule.md)

## Business Rules

### Flag semantics

| Field | Default | Meaning |
|-------|---------|---------|
| `isActive` | `true` | Shown in default master search and selectors |
| `discontinued` | `false` | Manufacturer withdrawal; sell-through allowed |
| `deletedAt` | `null` | Soft delete tombstone |

### Derived states

| Label | Condition | Operational summary |
|-------|-----------|---------------------|
| **ACTIVE** | `deletedAt` null, `isActive`, not `discontinued` | Full use |
| **DISCONTINUED** | `deletedAt` null, `discontinued` | No new procurement; stock may sell |
| **INACTIVE** | `deletedAt` null, not `isActive`, not `discontinued` | Hidden; data hold or duplicate |
| **DELETED** | `deletedAt` set | Terminal; history only |

### Valid transitions

```
                    ┌─────────────┐
         create ──► │   ACTIVE    │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │ DISCONTINUED│ │  INACTIVE   │ │   DELETED   │
    └──────┬──────┘ └──────┬──────┘ └─────────────┘
           │               │               ▲
           └───────────────┴───────────────┘
                  (admin paths)
```

| From | To | Action |
|------|-----|--------|
| ACTIVE | DISCONTINUED | Set `discontinued = true` |
| ACTIVE | INACTIVE | Set `isActive = false` |
| ACTIVE | DELETED | Soft delete (rare) |
| DISCONTINUED | ACTIVE | Set `discontinued = false` |
| INACTIVE | ACTIVE | Set `isActive = true` |
| INACTIVE | DELETED | Soft delete |
| DISCONTINUED | DELETED | Soft delete (avoid if stock exists) |
| DELETED | ACTIVE | Clear `deletedAt` (admin reinstate) |

### Invalid or discouraged

- **DELETED + active operations** — block at API layer.
- **Discontinued + new batches** — discouraged by business policy, not DB constraint.
- **`isActive = false` and `discontinued = true`** — allowed but redundant; UI should prefer one primary reason.

### Schedule overlay

Schedule compliance is orthogonal to lifecycle:

- Schedule H medicine in **ACTIVE** state still requires prescription at sale time.
- **DELETED** medicine never sold regardless of schedule.

## Domain Events

| Transition | Event |
|------------|-------|
| → ACTIVE (create) | `MedicineCreated` |
| → DISCONTINUED | `MedicineDiscontinued` |
| → INACTIVE | `MedicineDeactivated` |
| → DELETED | `MedicineDeleted` |
| Any reinstate | `MedicineUpdated` |

## State Model

This document **is** the state model reference. No separate `status` VARCHAR column exists on `Medicine` today.

**Contrast with transactional string statuses:**

| Domain | Status storage |
|--------|----------------|
| Medicine master | Boolean flags + `deletedAt` |
| Sales invoice | String status (`DRAFT`, `POSTED`, …) |
| Outbox row | String `syncStatus` |

Future ADR may introduce `medicineStatus` string enum — see [future.md](./future.md).

## Integrations

- **UI badges** — map derived label to color (Active=green, Discontinued=amber, Inactive=gray, Deleted=hidden).
- **Purchasing validation** — reject DELETED; warn DISCONTINUED.
- **Sales validation** — reject DELETED and INACTIVE; schedule rules on ACTIVE/DISCONTINUED with stock.

## Security Considerations

- Transition to DELETED requires `MASTER:MEDICINE:UPDATE`.
- Reinstate from DELETED should be audit-heavy (future approval).

## Performance Considerations

- Partial index on `(isActive, deletedAt)` for default catalog queries.
- Derived status computed in application layer or SQL CASE — no extra column to sync.

## Future Enhancements

- Explicit `status` string column with CHECK constraint for workflow (Draft/Review/Active).
- State transition table for compliance audit trail.
- Automatic transition to DISCONTINUED when manufacturer master deactivated.
