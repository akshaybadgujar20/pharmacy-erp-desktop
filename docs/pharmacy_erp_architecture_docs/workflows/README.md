# Pharmacy ERP Workflow Handbook

End-to-end business workflows aligned to the Prisma schema and persistence patterns.

**Cross-cutting:** every posting workflow uses `UnitOfWork` — business row + `StockMovement` (if inventory) + `AuditService` + `Outbox` (`entityUuid`) in one SQLite transaction.

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
| [Month end closing](./month-end-closing.md) | Period close and reconciliation |

## Anchor facts

- `Batch` org-global; `Stock` per `(branchId, batchId)`
- Sale price from `PriceListItem`; snapshotted on invoice lines
- Document numbers unique per branch via `SequenceGenerator`
- See [domain/ANCHOR_FACTS.md](../domain/ANCHOR_FACTS.md)

## Related

- [Domain layer](../domain/README.md)
- [Persistence patterns](../database/persistence-patterns.md)
