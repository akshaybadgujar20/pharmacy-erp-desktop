# Domain Layer

Business knowledge independent of UI and persistence implementation. Each subfolder is a **bounded context** aligned to the Prisma schema and implemented backend.

**Anchor reference:** [ANCHOR_FACTS.md](./ANCHOR_FACTS.md) — identity, inventory model, outbox, auth, vocabulary mapping.

## Bounded contexts

| Folder | Schema focus | Table overview |
|--------|--------------|----------------|
| [product/](./product/README.md) | Medicine master (`Medicine`, salts, manufacturer) | [medicine_master](../database/tables/medicine_master/medicine_master.md) |
| [inventory/](./inventory/README.md) | `Batch`, `Stock`, `StockMovement`, adjustments, transfers | [inventory](../database/tables/inventory/inventory.md) |
| [sales/](./sales/README.md) | `SalesInvoice`, payments, returns (invoice-first) | [sales](../database/tables/sales/sales.md) |
| [purchasing/](./purchasing/README.md) | PO → GRN → invoice → return | [purchase](../database/tables/purchase/purchase.md) |
| [customer/](./customer/README.md) | `Party` + `Customer`, loyalty | [party_management](../database/tables/party_management/party_management.md) |
| [supplier/](./supplier/README.md) | `Party` + `Supplier`, payments | [party_management](../database/tables/party_management/party_management.md) |
| [finance/](./finance/README.md) | `Ledger`, `LedgerEntry`, `Payment`, `Receipt` | [financial](../database/tables/financial/financial.md) |

## Cross-cutting (implemented)

- Auth/RBAC — [early-foundations](../architecture/early-foundations.md#authentication-configuration)
- Settings — `AppSetting` / `SettingsService`
- Audit — `AuditService` + [logging-and-audit](../architecture/logging-and-audit.md)
- Sync outbox — `Outbox` with `entityUuid` (worker deferred)

## Document structure

Each domain file documents: Purpose, Responsibilities, Scope, Related Entities, Business Rules, Domain Events, State Model, Integrations, Security, Performance, Future Enhancements.

## Related

- [Workflows](../workflows/README.md) — end-to-end business flows
- [Persistence patterns](../database/persistence-patterns.md)
- [Architecture overview](../architecture/overview.md)
