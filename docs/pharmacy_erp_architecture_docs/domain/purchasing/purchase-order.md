# Purchasing — Purchase Order

## Purpose

`PurchaseOrder` is the formal request to a supplier listing medicines, quantities, and expected commercial terms. It controls approval and fulfillment tracking but **does not change inventory** until a **GoodsReceipt** is posted.

**Database reference:** [PurchaseOrder](../../database/tables/purchase/30_purchase_order.md) · [Purchase overview](../../database/tables/purchase/purchase.md)

## Responsibilities

- Assign branch-scoped `purchaseOrderNumber`
- Capture supplier, branch, dates, and line-level order qty/price
- Drive approval workflow and supplier communication states
- Roll up received quantities from GRNs into PO status

## Scope

### In Scope

- PO create, edit (while editable), submit, approve, send, cancel, force close
- Line items: medicine, qty, unit, expected rate, tax hints
- Link to one or many GRNs

### Out of Scope

- Physical receipt (see [goods-receipt.md](./goods-receipt.md))
- Supplier payment (Finance)

## Related Entities

- `PurchaseOrderItem`
- `GoodsReceipt` (child fulfillment documents)
- `Supplier`, `Branch`, `Employee` (approver)

## Business Rules

- Minimum one line item.
- `purchaseOrderNumber` unique per `(branchId, purchaseOrderNumber)`.
- `supplierId` required; supplier must supply branch's company.
- **Status lifecycle:**
  - `DRAFT` — editable
  - `PENDING_APPROVAL` — submitted, locked for requester edits
  - `APPROVED` — eligible for GRN and send
  - `SENT_TO_SUPPLIER` — recorded dispatch to vendor
  - `PARTIALLY_RECEIVED` — posted GRN totals < ordered
  - `COMPLETED` — all lines received per tolerance rules
  - `FORCE_CLOSED` — user closes with open qty (reason required)
  - `CANCELLED` — no further activity
- Only `DRAFT` and `PENDING_APPROVAL` (reject path) allow structural line changes.
- `expectedDeliveryDate` optional; overdue POs flagged in reports only.
- Totals on header recalc from lines on save.

## Domain Events

- `PurchaseOrderCreated`, `PurchaseOrderSubmittedForApproval`, `PurchaseOrderApproved`
- `PurchaseOrderSentToSupplier`, `PurchaseOrderPartiallyReceived`, `PurchaseOrderCompleted`
- `PurchaseOrderForceClosed`, `PurchaseOrderCancelled`

## State Model

See state diagram in [README.md](./README.md). Approval gates transition from `DRAFT` → `PENDING_APPROVAL` → `APPROVED`.

## Integrations

- **SequenceGenerator:** `documentType = PURCHASE_ORDER`, format e.g. `PO-{BR}-{SEQ}`
- **Approval:** [approval-flow.md](./approval-flow.md)
- **GRN:** Updates line received qty and PO status on post

## Security

- `PURCHASE:PURCHASE_ORDER:CREATE` — create and edit draft PO (seed: `PURCHASE_CREATE`)
- Approve/send/force-close require elevated permissions (future seed entries)

## Performance

- List open POs: filter `(branchId, status IN ('APPROVED','SENT_TO_SUPPLIER','PARTIALLY_RECEIVED'))`.

## Future

- PO templates from reorder rules
- Multi-currency PO for imported medicines
