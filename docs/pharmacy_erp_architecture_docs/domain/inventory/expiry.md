# Inventory — Expiry and FEFO

## Purpose

Govern **expiry-driven eligibility** and **First Expiry First Out (FEFO)** allocation so pharmacies dispense oldest viable lots first and never sell expired medicine. Expiry lives on **Batch.expiryDate**; branch quantities on **Stock**; write-offs via **StockAdjustment**.

**Schema reference:** [23_batch](../../database/tables/inventory/23_batch.md) · [Inventory overview](../../database/tables/inventory/inventory.md)

---

## Responsibilities

- Store authoritative expiry per org-global batch.
- Enforce no sales OUT against expired batches.
- Guide batch selection for dispensing and transfers using FEFO ordering.
- Support near-expiry audits via StockTake countType `NEAR_EXPIRY_AUDIT`.
- Route expired on-shelf quantity to expiredQuantity bucket and adjustment write-off.

---

## Scope

### In Scope

- FEFO query ordering: `ORDER BY expiryDate ASC` among batches with available stock at branch.
- Expiry validation on sales OUT and optional warning on transfer OUT.
- Near-expiry reporting and stock take types.
- Expired stock adjustment workflow.

### Out of Scope

- Manufacturing date compliance beyond storage on Batch.
- Regulatory recall campaign management (future).

---

## Related Entities

| Entity | Expiry role |
|--------|-------------|
| Batch.expiryDate | Authoritative expiry |
| Batch.manufacturingDate | Optional shelf-life calculation input |
| Stock.availableQuantity | FEFO candidate pool per branch |
| Stock.expiredQuantity | Segregated expired units on shelf |
| StockMovement | OUT blocked or adjustment for expiry |
| StockTake.countType | NEAR_EXPIRY_AUDIT, COLD_CHAIN_AUDIT |
| SalesInvoiceItem | Must reference non-expired batch at sale date |

---

## Business Rules

1. **expiryDate required** on every Batch.
2. **FEFO default:** when user or system picks batch for a medicine at branch, prefer earliest expiry among rows where `Stock.availableQuantity > 0` and batch not expired.
3. **Expired definition:** `expiryDate < current date` (branch timezone policy for calendar day).
4. **No sale of expired batch:** sales ledger OUT rejects with domain error; POS must not allow selection.
5. **Near-expiry warning:** configurable threshold (e.g. 90 days) — UI warning, not hard block unless policy says so.
6. **Expired on shelf:** move to `expiredQuantity` via adjustment (adjustmentType EXPIRY); then ADJUSTMENT_LOSS OUT from available or direct expired bucket policy.
7. **Transfer FEFO:** optional policy to prefer sending nearer-expiry batches on routine replenishment.
8. **Stock take NEAR_EXPIRY_AUDIT:** count limited to batches expiring within window.
9. **Batch deactivation** does not remove expiry obligation — historical movements retain dates.

---

## Domain Events

| Event | When |
|-------|------|
| `BatchExpiryApproaching` | Scheduled scan (future) |
| `BatchExpiredOnShelf` | expiredQuantity increased |
| `StockAdjustmentApproved` | EXPIRY type write-off |
| `SaleBlockedExpiredBatch` | validation failure (monitoring) |

---

## State Model

Batch expiry is a **date attribute**, not a status enum. Operational states:

| Situation | System behavior |
|-----------|-----------------|
| Valid | FEFO eligible, sales allowed |
| Near expiry | Warning in UI |
| Expired | Sales blocked; adjustment required for write-off |

---

## Integrations

- **Sales:** batch picker API filters `expiryDate >= today`, sorts FEFO.
- **InventoryLedgerService:** optional guard on OUT movementType SALES_INVOICE.
- **Reporting:** expiry pipeline report joins Batch + Stock by branch.
- **StockTake:** countType NEAR_EXPIRY_AUDIT pre-filters batch list.

---

## Security

- Backdating expiry correction requires elevated permission + audit (compliance risk).
- Expiry reports may contain medicine volumes — branch-scoped read.

---

## Performance

- Index `Batch(medicineId, expiryDate)` for FEFO selection.
- Index `Batch(expiryDate)` for global expiry job.
- Precompute near-expiry batch list nightly for large catalogs (optional cache).

---

## Future Enhancements

- Auto markdown / promotion workflow near expiry (Sales integration).
- SMS alerts to branch manager for batches expiring in N days.
- Cold chain temperature breach flag affecting expiry (COLD_CHAIN_AUDIT linkage).
- Multi-level expiry (inner/outer pack) for hospital packs.

See also [batch.md](./batch.md) and [adjustments.md](./adjustments.md).
