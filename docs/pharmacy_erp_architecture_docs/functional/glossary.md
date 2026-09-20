# Glossary — Pharmacy ERP Terms

**Purpose:** Plain-English definitions for terms used across functional module guides. For table-level detail, follow links to domain and database docs.

**Parent:** [Functional overview](./functional-overview.md)

---

## A–C

**AppSetting** — Key-value configuration stored in the database (e.g. `FEFO_ENABLED`, `LOYALTY_POINTS_RATIO`). Can be org-wide or branch-scoped.

**AuditLog** — Immutable record of who did what business action, when, with correlation id. Written in the same transaction as the mutation.

**Batch** — Org-global medicine lot: batch number, expiry, purchase rate, MRP. One batch can have stock at multiple branches.

**Branch** — A pharmacy outlet under a company. Documents and stock balances are branch-scoped.

**Chart of accounts** — Hierarchy of Ledger accounts (Cash, Sales, Supplier Payable, etc.).

**COGS (Cost of Goods Sold)** — Expense recognized when stock is sold, from batch/movement unit cost.

**Company** — Top-level tenant. Owns branches, medicines, batches, and global settings.

**Customer** — Party role for someone who buys medicines. May be walk-in, retail, wholesale, or corporate.

---

## D–F

**Dispense** — Give medicine to patient per prescription. Target workflow links prescription lines to invoice lines (Partial — see Prescription module).

**Document number** — Human-readable id (e.g. `SI-2026-00042`) from SequenceGenerator at post time.

**Double-entry** — Every financial event produces balanced debit and credit LedgerEntry rows.

**DRAFT / POSTED** — Common document states. DRAFT is editable; POSTED is finalized and triggers stock/ledger side effects.

**FEFO (First Expiry First Out)** — Batch allocation rule: sell earliest-expiring eligible stock first.

**Financial year** — Accounting period for reports and optional date guards on mutations.

**Free stock** — `availableQuantity - reservedQuantity` at a branch for a batch.

**Goods Receipt (GRN)** — Purchase document that records physical receipt and **creates or increases stock**.

---

## G–L

**GRN** — See Goods Receipt.

**Inventory ledger** — StockMovement rows; append-only record of every IN/OUT.

**Ledger / LedgerEntry** — Account and individual debit/credit line. Balances are derived, not stored on the account row.

**LoyaltyTransaction** — Immutable points movement (earn, redeem, adjustment).

**MRP** — Maximum Retail Price on a batch; may cap selling price when `ENFORCE_MRP_CAP` is on.

---

## O–P

**Outbox** — Queue of sync events written in the same transaction as business data for cloud replication.

**Party** — Shared identity record; roles include Customer, Supplier, Doctor, Employee.

**Payment** — Outgoing money (supplier, expense). **Receipt** — incoming money (customer).

**PO (Purchase Order)** — Request to supplier; no stock impact until GRN is posted.

**Post** — Finalize a document (invoice, GRN, return, etc.) so side effects apply atomically.

**Prescription** — Doctor order for patient medicines; used for Schedule H compliance.

**Price snapshot** — Selling price and tax frozen on sales invoice lines at post — not re-read from master.

**PriceList / PriceListItem** — Branch selling prices per medicine (separate from batch cost).

---

## R–S

**RBAC** — Role-based access control. Permissions use `MODULE:RESOURCE:ACTION` codes.

**RESTOCK** — Return disposition that puts quantity back into sellable stock (only disposition implemented today).

**Schedule H** — Regulated medicines requiring a valid prescription to sell (enforcement Planned at sale post).

**SequenceGenerator** — Allocates next document number per branch and document type.

**Stock** — Quantity of one batch at one branch (available, reserved, damaged, etc.).

**StockMovement** — One ledger line: direction IN/OUT, quantity, unit cost, balance after.

**StockTake** — Physical count session; variances become stock adjustments.

**Supplier** — Party role for vendors. Purchase documents reference supplierId.

**Sync / delta sync** — Background replication of outbox events to cloud PostgreSQL.

---

## T–Z

**Tax** — GST or other rate master; snapshotted on invoice lines.

**UnitOfWork** — Single database transaction wrapping document save, stock, ledger, audit, and outbox.

**Voucher** — Group of LedgerEntry lines sharing voucherType and voucherId (balanced debits and credits).

**Walk-in customer** — Default customer for counter sales without registration.

---

## References

- [Functional overview](./functional-overview.md)
- [Domain anchor facts](../domain/ANCHOR_FACTS.md)
- [Persistence patterns](../database/persistence-patterns.md)
- [Implementation status](./implementation-status.md)
