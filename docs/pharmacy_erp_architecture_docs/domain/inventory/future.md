# Inventory — Future Enhancements

## Purpose

Roadmap for inventory capabilities beyond the current schema and `InventoryLedgerService` implementation. Items here are **not** implemented unless explicitly scheduled; they inform ADRs and backlog prioritization.

**Schema reference:** [Inventory tables](../../database/tables/inventory/inventory.md)

---

## Responsibilities

- Capture planned extensions without polluting current business rules.
- Align proposals with existing Batch / Stock / Movement model.
- Flag dependencies on Sales, Purchasing, Finance, and sync infrastructure.

---

## Scope

### In Scope

- Inventory domain enhancements only.

### Out of Scope

- Unrelated product catalog features.
- Full ERP modules (payroll, CRM).

---

## Related Entities

Future features extend: Batch, Stock, StockMovement, document aggregates, and new supporting tables where noted.

---

## Business Rules

Planned rules remain **subordinate** to current [business-rules.md](./business-rules.md) until shipped and documented there.

---

## Domain Events

Future modules should add events to [events.md](./events.md) rather than ad hoc string literals.

---

## State Model

No change to current state machines until features ship.

---

## Integrations

| Initiative | Integration touchpoints |
|------------|-------------------------|
| WMS / bin locations | Stock sub-location dimension |
| Supplier EDI | Auto Batch create on ASN |
| Finance GL | Auto journal from movement types |
| Mobile cycle count | StockTake offline sync |

---

## Security

Future APIs must inherit RequestContext branch scoping and permission model extensions (new resource:action pairs per feature).

---

## Performance

Large initiatives (event sourcing replay, weighted average) need ADR before implementation.

---

## Future Enhancements

### Near term

1. **Stock reservation service** — formal API to reserve/release `reservedQuantity` tied to sales order UUID with TTL.
2. **Transfer application service** — full implementation of DISPATCHED → IN_TRANSIT → RECEIVED with inTransitQuantity updates.
3. **Stock take reconciliation service** — auto StockAdjustment from StockTakeItem variances.
4. **Additional permissions** — INVENTORY:STOCK_TRANSFER:*, INVENTORY:STOCK_TAKE:*, approve actions.
5. **Negative stock policy flag** per branch in Settings.

### Medium term

6. **Weighted average costing** — optional per medicine per branch cost layer alongside lot cost.
7. **Bin / aisle location** — sub-location on Stock or new StockLocation table.
8. **Barcode-driven operations** — scan-to-adjust, scan-to-transfer line confirmation.
9. **Near-expiry automation** — scheduled jobs + notifications + optional markdown hooks to Sales.
10. **Blind count mode** — StockTake hides systemQuantity until COUNTED.

### Long term

11. **Serialization** — unit-level serial tracking for high-value medicines.
12. **Recall management** — batch recall flag, block sales/transfer, trace forward from GRN.
13. **Multi-warehouse central inventory** — HQ view with branch allocation rules.
14. **Event sourcing projection** — rebuild Stock from StockMovement replay for audit disputes.
15. **Cold chain telemetry** — temperature log linkage to batch quarantine.
16. **AI demand forecasting** — reorder suggestions from movement history (read-only analytics first).

### Technical debt

- Feature modules for Adjustment / Transfer / StockTake instead of raw Prisma in controllers.
- Central movement type registry constant file shared with docs.
- Integration test coverage for full transfer and stock-take happy paths.

---

## Cross-references

- [reservation.md](./reservation.md) — current reservedQuantity semantics
- [workflows.md](./workflows.md) — transfer and count flows to extend
- [costing.md](./costing.md) — weighted average design impact
