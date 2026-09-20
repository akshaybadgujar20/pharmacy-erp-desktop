# Pharmacy ERP Workflow Handbook

End-to-end business workflows aligned to the Prisma schema and persistence patterns.

**Cross-cutting:** every posting workflow uses `UnitOfWork` — business row + `StockMovement` (if inventory) + `AuditService` + `Outbox` (`entityUuid`) in one SQLite transaction.

## Diagrams

**Start here:** [system-map-flow.drawio](./system-map-flow.drawio) · [SVG preview](./system-map-flow.svg) — L0 module handoffs (no step detail).

| Layer | File | Description | Status |
|-------|------|-------------|--------|
| L0 | [system-map-flow](./system-map-flow.drawio) | Module handoffs across Purchase, Inventory, Sales, Payment, Returns, Adjustments, Transfers, Month-end | Done |
| L2 | [cross-cutting-persistence-flow](./cross-cutting-persistence-flow.drawio) | UnitOfWork, side effects, Audit, Outbox, commit / rejected | Done |
| L1 | [sales-invoice-flow](./sales-invoice-flow.drawio) | Sales invoice: draft → finalise → payment / return / cancel | Done |
| L1 | [purchase-invoice-flow](./purchase-invoice-flow.drawio) | Purchase: PO → GRN accept (stock IN) → invoice post | Done |
| L1 | [stock-adjustment-flow](./stock-adjustment-flow.drawio) | Draft → approve corrections (gain IN / loss OUT) | Done |
| L1 | [stock-transfer-flow](./stock-transfer-flow.drawio) | Dispatch → receive between branches | Done |
| L1 | [inventory-movement-flow](./inventory-movement-flow.drawio) | Central ledger hub — all stock IN/OUT triggers | Done |
| L1 | [payment-flow](./payment-flow.drawio) | Counter payment, finance receipt, supplier payment | Done |
| L1 | [return-flow](./return-flow.drawio) | Sales and purchase return branches | Done |
| L1 | [month-end-flow](./month-end-flow.drawio) | FY close spine (Implemented / Partial / GAP labels) | Done |
| L1 | [prescription-flow](./prescription-flow.drawio) | Minimal prescription lifecycle (draft → active → cancel/expire) | Done |
| L1 | [stock-take-flow](./stock-take-flow.drawio) | Physical count: draft → count → reconcile variances | Done |

All L1 diagrams reference [cross-cutting-persistence-flow](./cross-cutting-persistence-flow.drawio) for the shared write pattern instead of redrawing it.

**Known gaps:** [workflow-gap-index.md](./workflow-gap-index.md)

**Regenerate:** from `workflows/`, run `python generate-all-workflows.py` (or `python generate-all-workflows.py sales` for one diagram). Generators use the shared engine in `lib/flowchart_engine.py`.

## Workflows

| Flow | Description |
|------|-------------|
| [Sales flow](./sales-flow.md) | Invoice, FEFO allocation, payment, stock OUT |
| [Purchase flow](./purchase-flow.md) | PO → GRN → Batch + Stock IN → purchase invoice |
| [Inventory flow](./inventory-flow.md) | Ledger pattern for all stock changes |
| [Payment flow](./payment-flow.md) | Customer receipts and supplier payments |
| [Return flow](./return-flow.md) | Sales and purchase returns |
| [Stock adjustment](./stock-adjustment.md) | Manual corrections with approval |
| [Stock transfer](./stock-transfer.md) | Inter-branch movement |
| [Stock take](./stock-take.md) | Physical count and variance reconciliation |
| [Month end closing](./month-end-closing.md) | Period close and reconciliation |
| [Prescription](../ado/012_prescription_management.md) · [diagram](./prescription-flow.drawio) | Prescription lifecycle and sales dispensing hook |

## Anchor facts

- `Batch` org-global; `Stock` per `(branchId, batchId)`
- Sale price from `PriceListItem`; snapshotted on invoice lines
- Document numbers unique per branch via `SequenceGenerator`
- See [domain/ANCHOR_FACTS.md](../domain/ANCHOR_FACTS.md)

## Related

- [Domain layer](../domain/README.md)
- [Persistence patterns](../database/persistence-patterns.md)
