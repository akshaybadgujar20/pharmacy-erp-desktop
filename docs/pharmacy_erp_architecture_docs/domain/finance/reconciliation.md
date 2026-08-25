# Finance — Reconciliation

## Purpose

Describe reconciliation processes that align denormalized party balances, bank records, and ledger truth.

## Responsibilities

- Outstanding reconciliation for customers and suppliers.
- Bank and cash reconciliation concepts.
- Drift detection and correction policy.

## Scope

Reconciliation jobs and manual procedures; not full bank feed integration (future).

## Related Entities

[46_ledger_entry.md](../../database/tables/financial/46_ledger_entry.md), [financial.md](../../database/tables/financial/financial.md), [05_customer.md](../../database/tables/party_management/05_customer.md), [06_supplier.md](../../database/tables/party_management/06_supplier.md).

## Reconciliation Types

### REC-01 — Customer receivable outstanding

**Goal:** `Customer.outstandingAmount` matches ledger-derived receivable balance.

**Source of truth:** Sum of `LedgerEntry` on Customer Receivable sub-ledger filtered by customer/party reference (implementation via voucher linkage or sub-ledger dimension).

**Procedure (WF-F08):**

1. Select customers with activity in period.
2. Compute `ledgerBalance` from entries.
3. Compare to `Customer.outstandingAmount`.
4. If |drift| > ε (e.g., ₹0.01), update cache and log audit.
5. Emit `OutstandingReconciled` if changed.

**Common drift causes:**

- Manual SQL on Customer row.
- Failed partial transaction before fix.
- Receipt posted without cache update.

Customer domain: [customer/workflows.md](../customer/workflows.md#wf-c07--outstanding-reconciliation).

### REC-02 — Supplier payable outstanding

Same pattern for `Supplier.outstandingAmount` vs Supplier Payable ledger.

Supplier domain: [supplier/payments.md](../supplier/payments.md).

### REC-03 — Cash drawer vs Cash ledger

**Goal:** Physical cash count matches Cash in Hand ledger balance for shift.

**Procedure:**

1. End-of-shift count entered in UI.
2. Compare to ledger balance as of shift close.
3. Variance posts to Cash Short/Over expense journal (manual JOURNAL voucher).

### REC-04 — Bank statement (future)

Match `Payment`/`Receipt` with `transactionReference` to bank CSV — not implemented.

### REC-05 — Loyalty points (cross-domain)

**Goal:** `Customer.loyaltyPoints` matches sum of `LoyaltyTransaction.points`.

Source: [loyalty.md](../../database/tables/loyalty/loyalty.md), [52_loyalty_transaction.md](../../database/tables/loyalty/52_loyalty_transaction.md).

## Business Rules

| ID | Rule |
|----|------|
| BR-R01 | LedgerEntry is authoritative for monetary outstanding |
| BR-R02 | Cache updates must be audited |
| BR-R03 | Reconciliation does not modify posted LedgerEntry |
| BR-R04 | Large drift triggers alert to admin |

## Domain Events

`OutstandingReconciled` — [events.md](events.md).

## State Model

Reconciliation is operational process — no document state machine.

## Integrations

| Domain | Field reconciled |
|--------|------------------|
| Customer | outstandingAmount |
| Supplier | outstandingAmount |
| Loyalty | loyaltyPoints |
| Finance | Cash/Bank ledgers |

## Security Considerations

- Manual reconciliation override requires supervisor permission.
- Reports may expose party balances — restrict via REPORT permission.

## Performance Considerations

- Run REC-01/REC-02 nightly off-peak.
- Incremental reconciliation: only parties with entries since last run.

## Future Enhancements

- Bank feed auto-match (REC-04).
- Reconciliation dashboard with drift trends.
- Tie payment UTR to gateway webhook.

## See Also

[journal.md](journal.md) — immutable entries; reconciliation never edits history.
