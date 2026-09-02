# Explore inventory DTOs/mappers
_Exported on 9/3/2026 at 01:46:42 GMT+5:30 from Cursor (3.18.25)_

---

**User**

Explore the inventory module in backend/src/inventory/. I need a comprehensive summary for planning:

1. List all files in inventory/dto and inventory/mappers (current state)
2. List inventory controllers and services to understand what entities exist
3. For each existing inventory DTO and mapper, summarize what's already implemented vs incomplete
4. Check Prisma schema or entity definitions for inventory-related models (Batch, Stock, StockMovement, StockAdjustment, StockTake, StockTransfer, etc.)
5. Read git-modified inventory files if they show work in progress

Return: complete file inventory, gaps vs party module patterns, and which entities need DTOs/mappers.

---

**Cursor**

Exploring the inventory module structure, DTOs, mappers, controllers, services, and Prisma models for your planning summary.


# Inventory Module — Planning Summary

## Executive state

The inventory feature is **early scaffold only**. Prisma models (9 tables) and `InventoryLedgerService` are implemented; `backend/src/inventory/` has file stubs but **no wired controllers, services, or mappers**. `InventoryModule` is registered in `app.module.ts` but exports nothing.

**Git note:** The conversation-start snapshot showed modified inventory files; the working tree now only has `db/pharmacy.sqlite` modified. Inventory files on disk are stubs/placeholders, not in-progress implementations.

---

## 1. Complete file inventory

### `backend/src/inventory/dto/` (22 files)

| File | Class exported | Status |
|------|----------------|--------|
| `create-batch.dto.ts` | `CreateBatchDto` | Partially correct |
| `update-batch.dto.ts` | `UpdateBatchDto` | Partially correct |
| `create-stock.dto.ts` | `CreateStockDto` | Structurally OK; domain questionable |
| `update-stock.dto.ts` | `UpdateStockDto` | Structurally OK; domain questionable |
| `create-stock-movement.dto.ts` | `CreateStockMovementDto` | **Wrong** — party name fields |
| `update-stock-movement.dto.ts` | `UpdateStockMovementDto` | **Wrong** — party name fields |
| `create-stock-adjustment.dto.ts` | `CreateStockAdjustmentDto` | **Wrong/incomplete** |
| `update-stock-adjustment.dto.ts` | `UpdateStockAdjustmentDto` | **Wrong/incomplete** |
| `create-stock-adjustment-item.dto.ts` | `CreateStockAdjustmentItemDto` | Partial structure; validator bugs |
| `update-stock-adjustment-item.dto.ts` | `UpdateStockAdjustmentItemDto` | **Wrong** — party address fields |
| `create-stock-take.ts` | `CreateStockTake` | **Wrong** — supplier DTO copy; missing `.dto` suffix |
| `create-stock-take-item.ts` | `CreateStockTake` | **Wrong** — duplicate supplier copy; wrong class name |
| `update-stock-take.dto.ts` | `UpdateStockTakeDto` | **Wrong** — supplier DTO copy |
| `update-stock-take-item.dto.ts` | `UpdateStockTakeDto` | **Wrong** — wrong class name + supplier copy |
| `create-stock-transfer.dto.ts` | `CreateStockTransferDto` | **Wrong** — party contact DTO copy |
| `update-stock-transfer.dto.ts` | `UpdateStockTransferDto` | **Wrong** — party contact DTO copy |
| `create-stock-transfer-item.dto.ts` | `CreateStockTransferItemDto` | **Stub** — only `isPrimary`/`isActive` |
| `update-stock-transfer-item.dto.ts` | `UpdateStockTransferItemDto` | **Stub** — only `version`/`isPrimary`/`isActive` |

**Missing DTOs (not present at all):**
- Proper `create-stock-take.dto.ts` / `update-stock-take-item.dto.ts` with `UpdateStockTakeItemDto`
- Workflow/action DTOs (approve, dispatch, receive, reconcile, post) — likely needed per domain workflows
- List/query filter DTOs (optional; party uses shared `PaginationQueryDto`)

### `backend/src/inventory/mappers/` (6 files — all empty)

| File | Entity |
|------|--------|
| `batch.mapper.ts` | Batch |
| `stock.mapper.ts` | Stock |
| `stock-movement.mapper.ts` | StockMovement |
| `stock-adjustment.mapper.ts` | StockAdjustment |
| `stock-take.mapper.ts` | StockTake |
| `stock-transfer.mapper.ts` | StockTransfer |

**Missing mappers (no files):**
- `stock-adjustment-item.mapper.ts`
- `stock-take-item.mapper.ts`
- `stock-transfer-item.mapper.ts`

### Controllers (6 files — all empty)

| File | Entity |
|------|--------|
| `controllers/batch.controller.ts` | Batch |
| `controllers/stock.controller.ts` | Stock |
| `controllers/stock-movement.controller.ts` | StockMovement |
| `controllers/stock-adjustment.controller.ts` | StockAdjustment |
| `controllers/stock-take.controller.ts` | StockTake |
| `controllers/stock-transfer.controller.ts` | StockTransfer |

**Missing (party nested-child pattern):**
- Item controllers under parent routes, e.g. `stock-adjustments/:id/items`, `stock-takes/:id/items`, `stock-transfers/:id/items` (see `PartyAddressController` at `parties/:partyId/addresses`)

### Services (6 files — all empty)

Same six entities as controllers; no item services.

### Other inventory files

| File | State |
|------|-------|
| `inventory.module.ts` | Stub — imports Prisma/Persistence/Audit; **no controllers/providers** |
| `constants/inventory.constants.ts` | **Wrong** — copy of `party.constants.ts` (AddressType, ContactType, CustomerType, SupplierType) |
| `utils/inventory.util.ts` | Empty |

---

## 2. Entities (from Prisma + domain)

| Entity | Prisma file | Scope | Role |
|--------|-------------|-------|------|
| **Batch** | `prisma/inventory/batch.prisma` | Org-global | Lot identity: medicineId, batchNumber, expiry, purchaseRate, mrp |
| **Stock** | `prisma/inventory/stock.prisma` | Branch | Balance per `(branchId, batchId)` — quantity buckets + version |
| **StockMovement** | `prisma/inventory/stock-movement.prisma` | Branch | Immutable ledger; created by `InventoryLedgerService` |
| **StockAdjustment** | `prisma/inventory/stock-adjustment.prisma` | Branch | Manual correction header |
| **StockAdjustmentItem** | `prisma/inventory/stock-adjustment-item.prisma` | Child | batchId + signed quantity + unitCost |
| **StockTake** | `prisma/inventory/stock-take.prisma` | Branch | Physical count session |
| **StockTakeItem** | `prisma/inventory/stock-take-item.prisma` | Child | system/physical/variance quantities |
| **StockTransfer** | `prisma/inventory/stock-transfer.prisma` | Cross-branch | source → destination transfer |
| **StockTransferItem** | `prisma/inventory/stock-transfer-item.prisma` | Child | sent/received/damaged quantities |

**Golden rule (domain):** Never mutate `Stock` directly — always via `StockMovement` through `InventoryLedgerService.applyMovement()`.

---

## 3. DTO & mapper detail per entity

### Batch — best starting point

**DTO gaps vs Prisma:**
- `manufacturingDate` marked mandatory in DTO but optional in schema
- `purchaseRate` / `mrp` use `@IsOptional()` but `!` (required) — inconsistent; should use `@Type(() => Number)` + decimal validation like party
- Missing `@IsIn` for any batch-specific enums (none in schema)

**Mapper:** Empty — needs `BatchResponse` + `toBatchResponse()` (serialize bigint ids, Decimal fields)

### Stock — structurally closest DTOs

**DTO gaps:**
- Direct create/update may violate domain (balances should come from ledger)
- Likely API is **read-only** list/get + maybe reservation endpoints later
- Quantities should use decimal validation, not plain `@IsNumber()`

**Mapper:** Empty

### StockMovement — DTOs are party copies

**Should be:**
- **Read-only** list/get (filter by branch, batch, medicine, date range, movementType)
- **No create/update DTOs** for REST — ledger creates movements
- Optional query DTO for list filters

**Mapper:** Empty

### StockAdjustment + StockAdjustmentItem

**Header DTO problems:**
- Has `batchId` on header (wrong — belongs on items)
- Missing `branchId`, `adjustmentDate`
- `adjustmentNumber` typed as `number` (schema: `String`, sequence-generated)
- Missing `items[]` on create
- `createdBy` shouldn't be client-supplied (from JWT/context)

**Item DTO problems:**
- `quantity` uses `@IsInt()` but schema is `Decimal` (can be negative)
- `update-stock-adjustment-item.dto.ts` is a party address DTO

**Mappers:** Both empty; consider nested items in adjustment response or separate item mapper

### StockTake + StockTakeItem

**All four files wrong** — copied from supplier DTOs. Need:
- Header: `branchId`, `stockTakeDate`, `countType`, `status`, `countedByEmployeeId`, `remarks`
- Item: `batchId`, `physicalQuantity`, optional `remarks` (system/variance computed server-side)

**Naming bugs:**
- `create-stock-take.ts` should be `create-stock-take.dto.ts`
- `create-stock-take-item.ts` exports `CreateStockTake` (duplicate wrong class)
- `update-stock-take-item.dto.ts` exports `UpdateStockTakeDto` instead of `UpdateStockTakeItemDto`

**Mappers:** Empty; no item mapper file

### StockTransfer + StockTransferItem

**Header DTOs** are party contact copies. Need:
- `sourceBranchId`, `destinationBranchId`, `transferDate`, `transferType`, `expectedArrivalDate`, `remarks`
- Status transitions via workflow endpoints, not generic PATCH

**Item DTOs** are stubs. Need:
- `batchId`, `sentQuantity`, optional `receivedQuantity`/`damagedQuantity` on receive

**Mappers:** Empty; no item mapper file

---

## 4. Gaps vs party module patterns

| Party pattern | Inventory status |
|---------------|------------------|
| Module wires controllers + services | **Missing** — empty module |
| Thin controller: list/get/create/patch/delete + permissions | **Missing** — empty controllers |
| Service: Prisma reads, UnitOfWork writes, audit + outbox | **Missing** — empty services |
| `*.service.spec.ts` unit tests | **None** |
| `mappers/*.mapper.ts` with `*Response` interface + `to*Response()` | **All empty** |
| `utils/*.util.ts` — serialize, notFound, optimisticUpdate | **Empty** (party has `party.util.ts`) |
| `constants/*.constants.ts` — domain enums | **Wrong file** (party copy) |
| Nested child routes (`parties/:id/addresses`) | **No item controllers** |
| `@RequirePermissions('DOMAIN:ENTITY:ACTION')` | Only `INVENTORY:STOCK:READ` in a guard test |
| Error codes in `error-code.ts` | Only `BATCH_*`, `STOCK_*` — no adjustment/transfer/take codes |
| Outbox `entityType` constants | `Batch`, `StockMovement`, `StockAdjustment` exist; **no** `StockTransfer`, `StockTake`, `Stock` |
| Document sequences | `STOCK_MOVEMENT`, `STOCK_ADJUSTMENT`, `STOCK_TRANSFER` exist; **no** `STOCK_TAKE` |
| Audit module constant | `INVENTORY` exists in `audit-module.constants.ts` but unused |

**Reference implementation:** `backend/src/party/` — especially `customer.controller.ts`, `customer.service.ts`, `customer.mapper.ts`, `party.util.ts`.

**Persistence already done (outside inventory module):**
- `backend/src/persistence/inventory/inventory-ledger.service.ts` — `applyMovement()` with stock upsert, sequence, optimistic locking
- `backend/seed/lib/generators/inventory.generator.ts` — seed data for batches, stock, movements, adjustments, transfers, takes

---

## 5. What needs DTOs / mappers (priority order)

### Tier 1 — Master data & reads

| Entity | DTOs needed | Mapper needed | API shape |
|--------|-------------|---------------|-----------|
| **Batch** | Fix create/update | Yes | Full CRUD |
| **Stock** | Revisit create/update (likely read-only) | Yes | List/get by branch |
| **StockMovement** | Replace with query DTO only | Yes | List/get only (ledger) |

### Tier 2 — Document aggregates (header + items)

| Entity | Header DTOs | Item DTOs | Mappers |
|--------|-------------|-----------|---------|
| **StockAdjustment** | Rewrite create/update | Rewrite create/update item | Header + item (or nested) |
| **StockTransfer** | Rewrite create/update | Rewrite create/update item | Header + item |
| **StockTake** | Create new files (rename/fix) | Create new files | Header + item |

### Tier 3 — Workflow/action DTOs (not started)

Per `docs/pharmacy_erp_architecture_docs/workflows/`:
- StockAdjustment: submit, approve
- StockTransfer: approve, dispatch, receive, cancel
- StockTake: count, approve, reconcile/post (links to adjustment)

### Constants to add (`inventory.constants.ts`)

Replace party copy with inventory enums from schema/docs:
- `StockMovementType`, `StockMovementDirection`
- `StockAdjustmentType`, `StockAdjustmentStatus`
- `StockTransferStatus`, `StockTransferType`
- `StockTakeCountType`, `StockTakeStatus`, `StockTakeVarianceType`

### Utils to add (`inventory.util.ts`)

Mirror `party.util.ts`: `serializeBigInt`, `serializeDecimal`, `optimisticUpdate`, entity-specific `assertBatchExists`, `throwNotFound` helpers.

---

## 6. Recommended build sequence

1. **Foundation** — Replace `inventory.constants.ts`, implement `inventory.util.ts`, add error codes + permissions + outbox entity types + `STOCK_TAKE` document type
2. **Batch** — Fix DTOs, implement mapper/service/controller, wire module
3. **Stock + StockMovement** — Read APIs + mappers (movement is ledger-read-only)
4. **StockAdjustment** — Header + nested items + approval flow calling `InventoryLedgerService`
5. **StockTransfer** — Header + items + dispatch/receive lifecycle
6. **StockTake** — Header + items + reconcile → linked adjustment
7. **Tests** — Unit specs per service; persistence/e2e for ledger integration

---

## 7. Key architectural constraints for planning

- **Batch** is org-global (no `branchId`); **Stock** is branch-scoped
- **StockMovement** is immutable — no update/delete REST endpoints
- All stock mutations go through `UnitOfWorkService` + `InventoryLedgerService.applyMovement()`
- Document numbers via `SequenceGeneratorService` (`adjustmentNumber`, `transferNumber`, `movementNumber`; stock take number may need new `DocumentType`)
- Mutations need `AuditService.log()` + `OutboxService.enqueue()` in same transaction
- Responses must serialize `bigint` → `string` and `Decimal` → number/string (party mapper pattern)

This gives you a complete picture: **file inventory exists but implementation is ~5% done** (Batch/Stock DTO shells + Prisma + ledger). The bulk of work is rewriting misplaced DTOs, implementing all mappers/services/controllers, and adding workflow endpoints aligned with the party module and inventory domain docs.

