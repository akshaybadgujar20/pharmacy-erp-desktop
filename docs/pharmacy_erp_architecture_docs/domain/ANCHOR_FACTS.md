# Domain Documentation — Anchor Facts

Apply these decisions consistently across all `domain/**` docs. Sources: `backend/prisma/**`, [architecture-review](../database/architecture-review.md), [early-foundations](../architecture/early-foundations.md).

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

| Domain folder | Prisma / tables |
|---------------|-----------------|
| `product/` | Medicine master (`Medicine`, generics, salts, manufacturer) + links to `PriceList`/`Tax` |
| `customer/` | `Party` + `Customer` role, `LoyaltyProgram`/`LoyaltyTransaction` |
| `supplier/` | `Party` + `Supplier` role, `Payment` |
| `inventory/` | `Batch`, `Stock`, `StockMovement`, adjustments, transfers, stock take |
| `purchasing/` | PO → GRN → PurchaseInvoice → PurchaseReturn |
| `sales/` | `SalesInvoice` (+ items, payment, return) — no SalesOrder/Quotation tables |
| `finance/` | `Ledger`, `LedgerEntry`, `Payment`, `Receipt`, `Expense`, `Tax` |

## Table spec cross-links

Use `database/tables/<category>/<category>.md` overviews and `NN_*.md` per table.
