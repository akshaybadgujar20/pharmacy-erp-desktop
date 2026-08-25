# Future Roadmap

## Already implemented (foundation)

These were handbook "future" items but are now part of the core architecture:

- **Offline-first** — local SQLite as operational database; HTTP to local NestJS
- **Multi-branch** — `Branch`, per-branch `Stock`, branch-scoped document numbers
- **JWT auth + RBAC** — `UserSession`, refresh tokens, `MODULE:RESOURCE:ACTION` permissions
- **Configuration-driven** — `AppSetting` + `SettingsService` (branch → company fallback)
- **Transactional outbox** — `Outbox` with `entityUuid` (sync worker not yet implemented)
- **Audit trail** — `AuditLog` + Winston `AppLogger`
- **Angular + Electron shell** — auth interceptors, secure token storage, i18n scaffold (`en-IN`)
- **Keyboard shortcuts** — global registry (handlers pending feature modules)

See [early-foundations](../architecture/early-foundations.md) for implementation detail.

## Near-term (next feature modules)

- Sales invoice posting service (atomic invoice + stock + outbox)
- Purchase GRN → Batch + Stock creation
- Inventory adjustment/transfer approval workflows
- Sync worker (outbox drain to cloud Postgres)
- Reports (sales, stock, GST, expiry)

## Medium-term

- Mobile companion app (read-only stock, orders)
- Customer loyalty UI (tables exist: `LoyaltyProgram`, `LoyaltyTransaction`)
- E-prescription import
- Payment gateway integration (UPI/card reconciliation)
- WhatsApp notifications (order ready, expiry alerts)

## Long-term

- Supplier portal
- AI inventory forecasting and purchase suggestions
- Cloud dashboards and consolidated multi-branch analytics
- Automated purchase suggestions from sales velocity

## Deferred / not modeled

- `SalesOrder` / `Quotation` tables — see [sales/sales-order.md](../domain/sales/sales-order.md)
- Supplier contracts — see [supplier/contracts.md](../domain/supplier/contracts.md)
- Full expense module UI (`Expense` table exists in schema)
