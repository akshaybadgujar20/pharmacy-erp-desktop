# Inventory — Reservation

## Purpose

Describe how **reserved stock** is represented and consumed. `Stock.reservedQuantity` holds quantity committed to pending operations (typically sales drafts or transfer dispatch preparation) without reducing **availableQuantity** until a ledger OUT posts. Effective free stock = `availableQuantity - reservedQuantity` (strict mode).

**Schema reference:** [24_stock](../../database/tables/inventory/24_stock.md) · [Inventory overview](../../database/tables/inventory/inventory.md)

---

## Responsibilities

- Hold quantity aside for in-flight sales or transfers.
- Prevent overselling when concurrent POS sessions exist.
- Release reservation on cancel or convert to OUT on confirm.
- Maintain invariant reserved ≤ available (recommended).

---

## Scope

### In Scope

- Semantics of `Stock.reservedQuantity` column.
- Interaction with availableQuantity and ledger OUT.
- Planned reservation service API (see future.md).

### Out of Scope

- Payment authorization holds (Finance).
- Purchase order commitment (Purchasing).

---

## Related Entities

| Entity | Role |
|--------|------|
| Stock.reservedQuantity | Committed units |
| Stock.availableQuantity | Physically counted saleable (ledger-maintained) |
| StockMovement | OUT reduces available, not reserved directly |
| Sales draft / order (future) | Reservation owner reference |
| StockTransfer | May reserve at source before DISPATCHED |

---

## Business Rules

1. **Reservation does not post StockMovement** — only changes reservedQuantity (and optionally audit row).
2. **Reserve request:** increment reservedQuantity if `(available - reserved) >= requestQty` (free stock check).
3. **Release:** decrement reservedQuantity without movement.
4. **Confirm sale:** ledger OUT for quantity; decrement both available (via movement) and reserved if previously reserved.
5. **Invariant (strict):** `reservedQuantity <= availableQuantity` at all times.
6. **Transfer dispatch:** optional pattern — reserve on PENDING_APPROVAL, release on CANCELLED, OUT on DISPATCHED.
7. **Expired batch:** cannot reserve for sale; block at validation.
8. **FEFO interaction:** reservation should specify batchId; medicine-level reservation requires batch allocation before confirm.

---

## Domain Events

| Event | When |
|-------|------|
| `StockReserved` | reservedQuantity increased |
| `StockReservationReleased` | reservedQuantity decreased without sale |
| `StockReservationConverted` | OUT movement + reservation cleared |
| `StockReservationFailed` | insufficient free stock |

(Full reservation service will emit these; today column exists for forward compatibility.)

---

## State Model

Reservation is a **quantity bucket**, not a document status:

```
availableQuantity  ──────────────────►  ledger IN/OUT
reservedQuantity   ──────────────────►  reserve / release / convert
freeStock          = available - reserved (derived)
```

---

## Integrations

- **Sales (future):** hold batch qty while invoice in DRAFT; confirm posts OUT via InventoryLedgerService.
- **StockTransfer:** reserve source stock between approval and dispatch.
- **InventoryLedgerService:** does not manage reservedQuantity today — separate ReservationService required.

---

## Security

- Reserve/release endpoints require sales or inventory write permissions beyond read-only `INVENTORY:STOCK:READ`.
- Users cannot release others' reservations without supervisor role (future).

---

## Performance

- Row-level lock on Stock `(branchId, batchId)` during reserve/release — same version column as ledger.
- Short TTL job to auto-release stale reservations (future).

---

## Future Enhancements

- Reservation table with referenceType/referenceId, expiry timestamp, and createdBy.
- POS optimistic UI with reservation heartbeat.
- Medicine-level reservation with automatic FEFO batch allocation on confirm.

See [future.md](./future.md).
