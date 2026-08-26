# Domain Documentation — Anchor Facts

Apply these decisions consistently across all `domain/*.md` docs. Sources: `backend/prisma/**`, [architecture-review](../database/architecture-review.md), [early-foundations](../architecture/early-foundations.md).

## Identity & persistence

- Hybrid PK: `BigInt @id` (local FK performance) + `uuid @unique @default(uuid())` (sync identity).
- Sync layer keys on `uuid` / `entityUuid` — never local `id`.
- Status fields are `String` (no Prisma enums). Document allowed values from schema comments.
- Soft delete: `deletedAt`. Optimistic lock: `version`.
- Tenant scope: `companyId` via `Branch`; transactional docs carry `branchId`.

## Inventory model

- `Batch` — org-global lot: `(medicineId, batchNumber)` unique; `purchaseRate` + statutory `mrp`; no `saleRate`.
- `Stock` — balance per `(branchId, batchId)`; `@@unique([branchId, batchId])`.
- `StockMovement` — immutable ledger; IN/OUT at branch; never delete.
- Sale pricing — branch-scoped `PriceList` / `PriceListItem` + `Tax`; snapshotted on invoice lines.

## Documents & sequences

- Document numbers unique per branch (`@@unique([branchId, invoiceNumber])`, etc.).
- `SequenceGenerator` scoped by `companyId` + optional `branchId` + `documentType`.

## Cross-cutting services (implemented)

- `UnitOfWork.run(tx)` — atomic business + audit + outbox.
- `Outbox` — `entityUuid`, `deviceId`, `operationId`, `sequenceNo`, payload `entityVersion`.
- `AuditService.log(tx)` — business audit in same transaction.
- `SettingsService` — `AppSetting` with branch → company fallback.
- Auth — JWT 15m, refresh 7d, `UserSession`, bcrypt, `MODULE:RESOURCE:ACTION` RBAC.

## Vocabulary mapping

| Domain doc | Prisma / tables |
|---------------|-----------------|
| [product.md](product.md) | Medicine master (`Medicine`, generics, salts, manufacturer) + links to `PriceList`/`Tax` |
| [customer.md](customer.md) | `Party` + `Customer` role, `LoyaltyProgram`/`LoyaltyTransaction` |
| [supplier.md](supplier.md) | `Party` + `Supplier` role, `Payment` |
| [inventory.md](inventory.md) | `Batch`, `Stock`, `StockMovement`, adjustments, transfers, stock take |
| [purchasing.md](purchasing.md) | PO → GRN → PurchaseInvoice → PurchaseReturn |
| [sales.md](sales.md) | `SalesInvoice` (+ items, payment, return) — no SalesOrder/Quotation tables |
| [finance.md](finance.md) | `Ledger`, `LedgerEntry`, `Payment`, `Receipt`, `Expense`, `Tax` |

## Table spec cross-links

Use `database/tables/<category>/<category>.md` — one self-contained file per category. Prisma models: `backend/prisma/schema.prisma`.
