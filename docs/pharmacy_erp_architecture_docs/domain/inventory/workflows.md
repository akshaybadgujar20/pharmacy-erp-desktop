# Inventory — Workflows

## Purpose

End-to-end operational workflows for **StockTransfer**, **StockAdjustment**, and **StockTake**, showing how document states connect to **StockMovement** ledger entries and **Stock** balance buckets. Implements cross-branch moves without changing org-wide batch identity.

**Schema reference:** [27_stock_transfer](../../database/tables/inventory/27_stock_transfer.md) · [26_stock_adjustment](../../database/tables/inventory/26_stock_adjustment.md) · [28_stock_take](../../database/tables/inventory/28_stock_take.md) · [Inventory overview](../../database/tables/inventory/inventory.md)

---

## Responsibilities

- Define status transitions and side effects for each workflow.
- Specify when inventory quantities change (only on defined transitions).
- Coordinate multi-branch transactions at dispatch and receive.
- Link stock take reconciliation to adjustment approval.

---

## Scope

### In Scope

- Transfer lifecycle through all eight statuses.
- Adjustment draft → approve → movements.
- Stock take count → reconcile → adjustment → movements.

### Out of Scope

- Purchase GRN and sales invoice workflows (see Purchasing / Sales domains) — they call the same ledger.

---

## Related Entities

| Workflow | Header | Lines | Ledger |
|----------|--------|-------|--------|
| Transfer | StockTransfer | StockTransferItem | TRANSFER_OUT, TRANSFER_IN |
| Adjustment | StockAdjustment | StockAdjustmentItem | ADJUSTMENT_GAIN, ADJUSTMENT_LOSS |
| Stock take | StockTake | StockTakeItem | via StockAdjustment |

---

## Business Rules

### Stock transfer

1. Create DRAFT with items (batchId, sentQuantity).
2. Submit → PENDING_APPROVAL (optional skip if policy allows direct dispatch from DRAFT).
3. Approve → record approvedByEmployeeId, approvedAt.
4. **Dispatch** → status DISPATCHED or IN_TRANSIT:
   - TRANSFER_OUT at **source** branch for each item sentQuantity.
   - Increment source `inTransitQuantity` (optional bucket) or rely on transfer status until receive.
5. **Receive** at destination:
   - TRANSFER_IN for receivedQuantity (good stock).
   - Separate adjustment for damagedQuantity if not received as sellable.
   - Partial: status PARTIALLY_RECEIVED until all lines closed.
6. **COMPLETED** when all items fully received or closed; set receivedDate.
7. **REJECTED** from PENDING_APPROVAL — no movements.
8. **CANCELLED** from DRAFT or PENDING_APPROVAL — no movements.
9. transferNumber unique per **sourceBranchId**.
10. transferType: ROUTINE_REPLENISHMENT, EMERGENCY_TRANSFER, EXCESS_REBALANCING.

### Stock adjustment

1. DRAFT with items (signed quantity per batch).
2. Submit → PENDING_APPROVAL.
3. **Approve** → post movements per line; status APPROVED immutable.
4. **Cancel** before approval — no movements.

### Stock take

1. DRAFT → IN_PROGRESS (count started; countedByEmployeeId set).
2. Enter StockTakeItem: systemQuantity from Stock snapshot, physicalQuantity counted, compute varianceQuantity and varianceType (MATCHED, SURPLUS, DEFICIT), varianceValue = variance × unitCost.
3. COUNTED when all lines entered.
4. **Reconcile** → RECONCILED: create StockAdjustment(s) for non-MATCHED lines; link stockAdjustmentId on items; approve adjustments to post movements.
5. CANCELLED from early states — no inventory change.

---

## Domain Events

See [events.md](./events.md) for `StockTransferDispatched`, `StockTransferCompleted`, `StockAdjustmentApproved`, `StockTakeReconciled`.

---

## State Model

### StockTransfer

```
                    ┌──────────────┐
                    │    DRAFT     │
                    └──────┬───────┘
                           │ submit
                           ▼
                    ┌──────────────┐     reject      ┌───────────┐
                    │PENDING_APPROVAL├───────────────►│ REJECTED  │
                    └──────┬───────┘                 └───────────┘
                           │ approve + dispatch
                           ▼
                    ┌──────────────┐
                    │  DISPATCHED  │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  IN_TRANSIT  │
                    └──────┬───────┘
                           │ receive (partial ok)
              ┌────────────┴────────────┐
              ▼                         ▼
    ┌──────────────────┐        ┌──────────────┐
    │PARTIALLY_RECEIVED│───────►│  COMPLETED   │
    └──────────────────┘        └──────────────┘

DRAFT / PENDING_APPROVAL ──cancel──► CANCELLED
```

| Status | Stock impact |
|--------|--------------|
| DRAFT, PENDING_APPROVAL, REJECTED, CANCELLED | None |
| DISPATCHED, IN_TRANSIT | OUT source; in-transit tracking |
| PARTIALLY_RECEIVED | Partial IN destination |
| COMPLETED | All quantities accounted |

### StockAdjustment

`DRAFT` → `PENDING_APPROVAL` → `APPROVED` | `CANCELLED`

### StockTake

`DRAFT` → `IN_PROGRESS` → `COUNTED` → `RECONCILED` | `CANCELLED`

---

## Integrations

- **InventoryLedgerService** — all quantity mutations inside UoW.
- **SequenceGeneratorService** — transferNumber, adjustmentNumber, stockTakeNumber, movementNumber.
- **UnitOfWorkService** — dispatch/receive multi-line atomicity.
- **Outbox** — status change notifications for destination branch sync.
- **AuditService** — approve, dispatch, receive, reconcile actions.

### Ledger reference mapping

| Workflow | referenceTable | referenceId |
|----------|----------------|-------------|
| Transfer OUT/IN | StockTransferItem | item.id |
| Adjustment | StockAdjustmentItem | item.id |
| GRN (external) | GoodsReceiptItem | line id |
| Sale (external) | SalesInvoiceItem | line id |

---

## Security

| Action | Permission (minimum) |
|--------|----------------------|
| View transfers / counts | `INVENTORY:STOCK:READ` |
| Create adjustment | `INVENTORY:STOCK_ADJUSTMENT:CREATE` |
| Dispatch / receive transfer | Transfer write + branch access (TBD) |
| Reconcile stock take | Stock take approve (TBD) |

Destination branch users receive IN — must have branch context for destinationBranchId.

---

## Performance

- Dispatch/receive: sort items by batchId; single transaction for all movements.
- Long IN_TRANSIT: status index supports open transfer dashboard without scanning movements.
- Stock take systemQuantity: bulk snapshot query for branch Stock JOIN Batch at IN_PROGRESS start.

---

## Future Enhancements

- In-app notifications when transfer arrives at destination.
- Mobile receive with barcode scan per StockTransferItem line.
- Auto-complete PARTIALLY_RECEIVED after timeout with variance adjustment.
- Workflow engine for configurable approval chains by transferType.

See [adjustments.md](./adjustments.md), [future.md](./future.md).
