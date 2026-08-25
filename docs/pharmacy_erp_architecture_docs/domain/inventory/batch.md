# Inventory — Batch

## Purpose

**Batch** is the org-global lot identity for a medicine: manufacturer batch number, expiry, landed cost (`purchaseRate`), and statutory **MRP** printed on the pack. Batches exist once per organization; branch quantities live in **Stock**, not on Batch.

Batch answers: *Which physical lot is this, when does it expire, and what did we pay for it?*

**Schema reference:** [23_batch](../../database/tables/inventory/23_batch.md) · [Inventory overview](../../database/tables/inventory/inventory.md)

---

## Responsibilities

- Enforce unique `(medicineId, batchNumber)` across the organization.
- Store expiry and manufacturing dates for FEFO and compliance.
- Snapshot **purchaseRate** (lot cost at receipt) and **mrp** (legal maximum retail price).
- Link to all branch Stock rows, movements, and transactional line items referencing the lot.
- Support soft deactivation without deleting ledger history.

---

## Scope

### In Scope

- Batch creation on goods receipt / purchase invoice posting.
- Batch lookup by barcode, batch number, medicine, expiry range.
- FEFO batch selection input (ordered by `expiryDate`).
- isActive / soft delete governance.

### Out of Scope

- **saleRate** — not on Batch; branch pricing via PriceListItem.
- **discountPercent** on batch — sale line snapshots at invoice time.
- Per-branch quantity — Stock domain.
- Dispensing workflow UI — Sales domain consumes batch id from inventory selection.

---

## Related Entities

| Relation | Cardinality | Notes |
|----------|-------------|-------|
| Medicine | many Batch → one Medicine | Product master |
| Stock | one Batch → many Stock | One row per branch holding the lot |
| StockMovement | one Batch → many | All IN/OUT history |
| StockAdjustmentItem | line reference | Adjustment by batch |
| StockTransferItem | line reference | Same batch moves between branches |
| StockTakeItem | line reference | Count variance per batch |
| PurchaseInvoiceItem / GoodsReceiptItem | origin | Often creates or resolves Batch |
| SalesInvoiceItem | consumption | OUT movement per sale line |

---

## Business Rules

1. **Unique lot per medicine:** `(medicineId, batchNumber)` must be unique.
2. **expiryDate required.** manufacturingDate optional but recommended.
3. **purchaseRate** is the default **unitCost** for IN movements at receipt and for adjustment/stock-take valuation unless overridden at document line.
4. **mrp** is statutory; not used for inventory valuation — used for sale compliance and line snapshots.
5. **No saleRate on Batch.** Selling price is branch-scoped PriceList; invoice items store final price.
6. **Expired batches cannot be sold.** Sales OUT must validate `expiryDate >= sale date` (calendar policy).
7. **FEFO:** When allocating stock for a medicine, order eligible batches by ascending `expiryDate`.
8. **UUID** is sync key; local `id` (BIGINT) is not replicated to cloud peers.
9. **Soft delete:** `deletedAt` set only when no active Stock with positive quantities (policy); historical movements retain batch reference.

---

## Domain Events

| Event | When |
|-------|------|
| `BatchCreated` | New row after GRN or manual entry |
| `BatchUpdated` | barcode, dates, or isActive change (not purchaseRate after movements) |
| `BatchDeactivated` | isActive false or soft delete |
| `BatchExpiryApproaching` | scheduled job (future) — near expiryDate threshold |

---

## State Model

| State | Condition |
|-------|-----------|
| **Active** | `isActive = true`, `deletedAt = null` |
| **Inactive** | `isActive = false` — no new receipts; existing stock may still deplete |
| **Deleted (soft)** | `deletedAt` set — hidden from pick lists; ledger retained |

No draft/workflow state on Batch itself.

---

## Integrations

- **Purchasing / GRN:** Creates Batch if `(medicineId, batchNumber)` not found; sets purchaseRate from invoice/GRN line.
- **InventoryLedgerService:** Movements denormalize `medicineId` from Batch for indexed queries.
- **Sales:** Batch picker queries active batches with Stock.availableQuantity > 0 at branch, ordered by expiry.
- **Sync / Outbox:** Batch UUID included in entity payloads for cloud replication.

---

## Security

- Batch master read typically bundled with `INVENTORY:STOCK:READ` or medicine master read permissions.
- Batch create/update on receipt may be restricted to purchasing roles; manual batch entry requires elevated inventory master permission.
- Audit log batch attribute changes (expiry correction is sensitive).

---

## Performance

- Index `(medicineId, expiryDate)` supports FEFO selection.
- Index `(expiryDate)` for expiry reports and near-expiry jobs.
- Index `(barcode)` for scan workflows.
- Avoid joining all Stock rows when listing batches for a medicine — filter by branchId via Stock subquery.

---

## Future Enhancements

- Serialization / unique serial numbers per unit for high-value items.
- Manufacturer recall flag linking affected batch numbers.
- Multi-MRP packs (inner/outer) — secondary MRP fields if regulatory need arises.
- Batch merge/split workflows with movement audit trail.
