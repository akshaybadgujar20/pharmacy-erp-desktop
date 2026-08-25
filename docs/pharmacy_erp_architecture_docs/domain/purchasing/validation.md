# Purchasing — Validation

## Purpose

Validation rules for purchasing documents at API, domain, and database layers. Distinguish draft saves from post/submit operations.

**Database reference:** [Purchase overview](../../database/tables/purchase/purchase.md)

## Responsibilities

- Field and cross-field rules per document type
- Gate status transitions
- Align with CHECK constraints in table specs

## Scope

### In Scope

- PO, GRN, purchase invoice, purchase return
- Stock and batch validation on GRN post
- PO–GRN quantity consistency

### Out of Scope

- Supplier master validation (Supplier domain)

## Related Entities

All purchase tables; `Batch`, `Stock`, `Medicine`, `Supplier`.

## Business Rules

### PurchaseOrder

- `branchId`, `supplierId`, `orderDate` required.
- Lines: `medicineId`, `orderedQuantity > 0`, valid `unitId`.
- Submit: at least one line; supplier active.
- Approve: status must be `PENDING_APPROVAL`.
- Cancel: not allowed if any posted GRN exists unless policy defines cancel-with-receipt exception.

### GoodsReceipt

- `supplierId`, `branchId`, `receivedByEmployeeId`, `receiptDate` required.
- If `purchaseOrderId` set: PO supplier matches; PO status receivable.
- Line: `receivedQuantity > 0`, `batchNumber` non-empty, `expiryDate` valid and not in past (warning vs error per setting).
- `purchaseRate >= 0`, `mrp >= 0`.
- Post: sum received on PO line + this GRN ≤ ordered qty + over-receipt tolerance.

### PurchaseInvoice

- Supplier invoice number required.
- Lines: qty > 0, rate >= 0.
- Match mode: invoice qty ≤ linked GRN received qty.

### PurchaseReturn

- Lines: `returnQuantity > 0`, stock available at branch for batch.
- Supplier matches source GRN/invoice when linked.

### Common

- Document numbers generated before post, unique per branch.
- `version` match on update (optimistic lock).

## Domain Events

Failed validation emits no events; success emits per [events.md](./events.md).

## State Model

Validators tied to allowed transitions — e.g. cannot post GRN from `CANCELLED` PO.

## Integrations

- **class-validator** on DTOs
- **SettingsService:** tolerance flags, allow GRN without PO
- **Prisma** FK enforcement

## Security

- `branchId` from request context, validated against user branches.

## Performance

- Validate stock availability with single `SELECT availableQuantity FROM Stock WHERE branchId AND batchId`.

## Future

- Async validation against external drug code directory (HSN/GST)
