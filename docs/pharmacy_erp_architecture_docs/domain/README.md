# Domain Layer

Business knowledge independent of UI and persistence. Each bounded context is documented in a single markdown file aligned to the Prisma schema and implemented backend.

**Anchor reference:** [ANCHOR_FACTS.md](./ANCHOR_FACTS.md) — identity, inventory model, outbox, auth, vocabulary mapping.

## Bounded contexts

| Context | Schema focus | Table overview |
|--------|--------------|----------------|
| [product.md](./product.md) | Medicine master (`Medicine`, salts, manufacturer) | [medicine_master](../database/tables/medicine_master/medicine_master.md) |
| [inventory.md](./inventory.md) | `Batch`, `Stock`, `StockMovement`, adjustments, transfers | [inventory](../database/tables/inventory/inventory.md) |
| [sales.md](./sales.md) | `SalesInvoice`, payments, returns (invoice-first) | [sales](../database/tables/sales/sales.md) |
| [purchasing.md](./purchasing.md) | PO → GRN → invoice → return | [purchase](../database/tables/purchase/purchase.md) |
| [customer.md](./customer.md) | `Party` + `Customer`, loyalty | [party_management](../database/tables/party_management/party_management.md) |
| [supplier.md](./supplier.md) | `Party` + `Supplier`, payments | [party_management](../database/tables/party_management/party_management.md) |
| [finance.md](./finance.md) | `Ledger`, `LedgerEntry`, `Payment`, `Receipt` | [financial](../database/tables/financial/financial.md) |

## Cross-cutting (implemented)

- Auth/RBAC — [early-foundations](../architecture/early-foundations.md#authentication-configuration)
- Settings — `AppSetting` / `SettingsService`
- Audit — `AuditService` + [logging-and-audit](../architecture/logging-and-audit.md)
- Sync outbox — `Outbox` with `entityUuid` (worker deferred)

## Document structure

One file per bounded context (e.g. `customer.md`, `sales.md`). Include a section only when it has content — typical sections: Overview & Aggregate, Terminology, Business Rules & Invariants, Lifecycle & States, Domain Events, Permissions, Workflows, Integrations. Planned capabilities live in [future-roadmap](../roadmap/future-roadmap.md), not inline.

## Related

- [Workflows](../workflows/README.md) — end-to-end business flows
- [Persistence patterns](../database/persistence-patterns.md)
- [Architecture overview](../architecture/overview.md)
