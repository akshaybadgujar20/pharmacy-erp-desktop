# Inventory — Domain Events

## Purpose

Catalog domain events emitted by the Inventory bounded context for audit, outbox sync, integrations, and eventual read models. Events describe **business facts** after successful transaction commit unless noted as integration events.

**Schema reference:** [Inventory tables](../../database/tables/inventory/inventory.md)

---

## Responsibilities

- Name events consistently with past-tense verbs.
- Map events to aggregate roots and triggering state transitions.
- Specify payload fields for outbox and AuditService consumers.

---

## Scope

### In Scope

- Batch, Stock balance, StockMovement, StockAdjustment, StockTransfer, StockTake events.

### Out of Scope

- Sales invoice events (Sales domain) — may reference batchId.
- Infrastructure logging (HTTP request logs).

---

## Related Entities

Events carry entity **uuid** (sync key) and relevant foreign uuids/ids.

---

## Business Rules

1. Events emit **after** successful UoW commit (outbox in same tx for sync).
2. **StockMovementRecorded** always accompanies balance change events from ledger.
3. Idempotent consumers use `(entityType, entityUuid, operationId)`.
4. No event for failed validation — only ApplicationException to client.

---

## Domain Events

### Batch

| Event | Trigger | Key payload |
|-------|---------|-------------|
| `BatchCreated` | Batch insert | uuid, medicineId, batchNumber, expiryDate, purchaseRate, mrp |
| `BatchUpdated` | Batch attribute change | uuid, changedFields |
| `BatchDeactivated` | isActive false / soft delete | uuid, medicineId |

### Stock and ledger

| Event | Trigger | Key payload |
|-------|---------|-------------|
| `StockBalanceChanged` | Stock row updated | branchId, batchId, availableQuantity, reservedQuantity, version |
| `StockMovementRecorded` | Movement insert | uuid, movementNumber, branchId, batchId, direction, quantity, unitCost, balanceAfter, movementType, referenceTable, referenceId |
| `StockInsufficient` | OUT rejected | branchId, batchId, requested, available (monitoring) |

### StockAdjustment

| Event | Trigger | Key payload |
|-------|---------|-------------|
| `StockAdjustmentCreated` | DRAFT save | uuid, adjustmentNumber, branchId, adjustmentType |
| `StockAdjustmentSubmitted` | → PENDING_APPROVAL | uuid, itemCount |
| `StockAdjustmentApproved` | → APPROVED + movements | uuid, approvedByEmployeeId, totalValue |
| `StockAdjustmentCancelled` | → CANCELLED | uuid, reason |

### StockTransfer

| Event | Trigger | Key payload |
|-------|---------|-------------|
| `StockTransferCreated` | DRAFT save | uuid, transferNumber, sourceBranchId, destinationBranchId |
| `StockTransferSubmitted` | → PENDING_APPROVAL | uuid |
| `StockTransferApproved` | Approval recorded | uuid, approvedByEmployeeId |
| `StockTransferRejected` | → REJECTED | uuid |
| `StockTransferDispatched` | → DISPATCHED / IN_TRANSIT | uuid, items with sentQuantity |
| `StockTransferReceived` | Receive action | uuid, receivedQuantity per item |
| `StockTransferPartiallyReceived` | → PARTIALLY_RECEIVED | uuid, outstanding quantities |
| `StockTransferCompleted` | → COMPLETED | uuid, receivedDate |
| `StockTransferCancelled` | → CANCELLED | uuid |

### StockTake

| Event | Trigger | Key payload |
|-------|---------|-------------|
| `StockTakeCreated` | DRAFT | uuid, stockTakeNumber, branchId, countType |
| `StockTakeStarted` | → IN_PROGRESS | uuid, countedByEmployeeId |
| `StockTakeCounted` | → COUNTED | uuid, itemCount, totalVarianceValue |
| `StockTakeReconciled` | → RECONCILED + adjustments | uuid, linkedAdjustmentUuids |
| `StockTakeCancelled` | → CANCELLED | uuid |

---

## State Model

Events align to state transitions documented in [workflows.md](./workflows.md). Terminal states (APPROVED, COMPLETED, RECONCILED) emit completion events once.

---

## Integrations

| Consumer | Usage |
|----------|-------|
| **OutboxService** | Cloud sync entity payloads |
| **AuditService** | User-action audit trail |
| **Notifications (future)** | Low stock, transfer arrival |
| **Analytics** | Movement stream for dashboards |

Outbox `entityType` constants should map to aggregate names; `operation` CREATE/UPDATE per [outbox-operation.constants.ts](../../../../backend/src/persistence/outbox/outbox-operation.constants.ts).

---

## Security

- Event payloads exclude secrets; sanitize logs per LogSanitizer.
- Subscribers must respect branch scope when projecting read models.

---

## Performance

- Batch outbox enqueue in same transaction as business write — no second round trip.
- High-volume `StockMovementRecorded` — consumers should process asynchronously.

---

## Future Enhancements

- CloudEvents-compatible envelope with correlationId from RequestContext.
- Event replay API for branch disaster recovery.
- Webhook subscriptions for transfer COMPLETED to destination branch POS.
