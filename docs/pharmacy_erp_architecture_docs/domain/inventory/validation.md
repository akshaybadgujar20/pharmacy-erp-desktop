# Inventory — Validation

## Purpose

Input validation, domain invariant checks, and authorization gates for inventory operations. Aligns with global NestJS `ValidationPipe` (whitelist, transform) and `ApplicationException` / `ErrorCode` patterns in the backend.

**Schema reference:** [Inventory tables](../../database/tables/inventory/inventory.md)

---

## Responsibilities

- Define DTO-level validation rules for API inputs.
- Define domain guards before ledger and document state transitions.
- Map failures to stable error codes for clients.
- Enforce permission and branch scope checks.

---

## Scope

### In Scope

- Batch, Stock read, StockMovement query, Adjustment, Transfer, StockTake validation.
- Ledger preconditions in InventoryLedgerService.

### Out of Scope

- Medicine master field validation (Product domain).
- JWT parsing (Auth module).

---

## Related Entities

Validation runs against persisted and incoming data for all inventory aggregates.

---

## Business Rules

### Common

| Check | Failure code / HTTP |
|-------|---------------------|
| branchId matches RequestContext | FORBIDDEN |
| Entity not soft-deleted | NOT_FOUND |
| Optimistic version mismatch | SEQUENCE_CONFLICT (409) |
| Decimal quantity ≤ 0 where positive required | BAD_REQUEST |

### Batch

| Check | Rule |
|-------|------|
| medicineId exists, active | NOT_FOUND |
| batchNumber non-empty, unique per medicine | CONFLICT |
| expiryDate required, valid date | BAD_REQUEST |
| purchaseRate, mrp ≥ 0 | BAD_REQUEST |

### Stock / ledger (InventoryLedgerService)

| Check | Rule |
|-------|------|
| quantity > 0 | BAD_REQUEST |
| OUT: Stock row exists | STOCK_NOT_FOUND |
| OUT: available ≥ quantity | STOCK_INSUFFICIENT |
| batchId belongs to medicineId on movement | BAD_REQUEST |
| movementType, direction valid strings | BAD_REQUEST |
| referenceTable, referenceId present | BAD_REQUEST |

### StockAdjustment

| Check | Rule |
|-------|------|
| ≥ 1 item before submit | BAD_REQUEST |
| reason non-empty | BAD_REQUEST |
| unique batch per document | CONFLICT |
| item quantity ≠ 0 | BAD_REQUEST |
| item unitCost ≥ 0 | BAD_REQUEST |
| approve only from PENDING_APPROVAL | BAD_REQUEST |
| loss OUT: sufficient available | STOCK_INSUFFICIENT |

### StockTransfer

| Check | Rule |
|-------|------|
| sourceBranchId ≠ destinationBranchId | BAD_REQUEST |
| ≥ 1 item | BAD_REQUEST |
| sentQuantity > 0 | BAD_REQUEST |
| dispatch: status allows transition | BAD_REQUEST |
| dispatch: sent ≤ source available | STOCK_INSUFFICIENT |
| receive: received + damaged ≤ sent | BAD_REQUEST |
| valid status enum string | BAD_REQUEST |

Valid **status** values: `DRAFT`, `PENDING_APPROVAL`, `DISPATCHED`, `IN_TRANSIT`, `PARTIALLY_RECEIVED`, `COMPLETED`, `REJECTED`, `CANCELLED`.

### StockTake

| Check | Rule |
|-------|------|
| countedByEmployeeId required | BAD_REQUEST |
| physicalQuantity ≥ 0 | BAD_REQUEST |
| unique batch per stock take | CONFLICT |
| reconcile only from COUNTED | BAD_REQUEST |
| one IN_PROGRESS per branch (policy) | CONFLICT |

Valid **countType**: `FULL_AUDIT`, `CYCLE_COUNT`, `SCHEDULE_H_AUDIT`, `COLD_CHAIN_AUDIT`, `NEAR_EXPIRY_AUDIT`.

Valid **status**: `DRAFT`, `IN_PROGRESS`, `COUNTED`, `RECONCILED`, `CANCELLED`.

### Expiry / FEFO (sales path)

| Check | Rule |
|-------|------|
| batch.expiryDate ≥ sale date | BAD_REQUEST / domain code |
| FEFO warning if not earliest expiry batch (configurable strict) | WARNING or BAD_REQUEST |

---

## Domain Events

Validation failures do **not** emit domain events; successful transitions emit per [events.md](./events.md).

---

## State Model

Validate allowed transitions explicitly — e.g. cannot DISPATCH from DRAFT without approval if policy requires PENDING_APPROVAL.

Example transfer transition matrix (simplified):

| From → To | Allowed |
|-----------|---------|
| DRAFT → PENDING_APPROVAL | yes |
| PENDING_APPROVAL → DISPATCHED | yes (approved) |
| PENDING_APPROVAL → REJECTED | yes |
| DISPATCHED → IN_TRANSIT | yes |
| IN_TRANSIT → PARTIALLY_RECEIVED / COMPLETED | yes (receive) |
| * → CANCELLED | from DRAFT or PENDING_APPROVAL only |

---

## Integrations

- **class-validator** on DTOs at controller boundary.
- **PermissionsGuard** + `@RequirePermissions()` for API routes.
- **Prisma unique constraints** mapped to CONFLICT via prisma-error.mapper.
- **ContextEnrichInterceptor** supplies branchId for scope validation.

---

## Security

| Permission | Gates |
|------------|-------|
| `INVENTORY:STOCK:READ` | GET stock, movements, batch lookup, documents read |
| `INVENTORY:STOCK_ADJUSTMENT:CREATE` | POST/PATCH adjustment draft |

Additional permissions required for transfer, stock take, approve actions (to be seeded with feature modules).

- Creator ≠ approver for adjustments above value threshold (policy).
- All validation re-checks branchId from server context, not request body alone.

---

## Performance

- Validate cheap checks first (DTO, status) before loading Stock with lock.
- Batch existence: single query with medicineId filter.
- FEFO validation query reuses indexed `(medicineId, expiryDate)`.

---

## Future Enhancements

- Central `InventoryValidationService` shared by modules.
- JSON schema export for Electron offline validation parity.
- Configurable validation severity (warn vs block) per branch in Settings.
