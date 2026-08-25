# Purchasing — Purchase Return

## Purpose

`PurchaseReturn` handles sending stock back to a supplier — damaged goods, wrong items, near-expiry returns under agreement, or post-invoice adjustments. Posting decreases branch `Stock` and creates OUT `StockMovement` records.

**Database reference:** [PurchaseReturn](../../database/tables/purchase/36_purchase_return.md) · [PurchaseReturnItem](../../database/tables/purchase/37_purchase_return_item.md) · [Purchase overview](../../database/tables/purchase/purchase.md)

## Responsibilities

- Document return authorization with supplier reference
- Line-level batch and quantity returned
- Reduce inventory at branch
- Link to purchase invoice or GRN when applicable for credit note tracking

## Scope

### In Scope

- Return to supplier with reason codes
- Partial batch qty return
- Approval before post (policy)

### Out of Scope

- Customer sales returns (Sales domain)
- Destruction / write-off without supplier return (Inventory adjustment)

## Related Entities

- `PurchaseReturnItem`
- `Batch`, `Stock`, `StockMovement` (OUT)
- `Supplier`, `PurchaseInvoice`, `GoodsReceipt`

## Business Rules

- At least one return line.
- Return qty ≤ available branch stock for specified `batchId`.
- Cannot return more than received on linked GRN line when traceability enforced.
- On post: OUT movement, decrement stock, optional AP credit expectation in Finance.
- Return number unique per branch.
- Status flow: `DRAFT` → `APPROVED` / `POSTED` → `CANCELLED` per table definition.
- Expired batch return may require supplier RMA number in `remarks`.

## Domain Events

- `PurchaseReturnCreated`, `PurchaseReturnApproved`, `PurchaseReturnCancelled`
- Inventory OUT paired with stock movement event

## State Model

Draft editable; posted locked; cancellation reverses stock if policy allows.

## Integrations

- **Finance:** Supplier credit note / debit note expectation
- **Supplier:** RMA reference fields
- **Outbox:** Sync return to HO

## Security

- Return approval often manager-only — future `PURCHASE:PURCHASE_RETURN:APPROVE`.

## Performance

- Validate stock availability in single query per line before post.

## Future

- Debit note auto-generation from return post
- Return shipment tracking number
