
# Month End Closing

## Business Objective

Close the accounting period for a branch or company: freeze postings, reconcile stock and ledgers, and produce month-end reports for GST and management.

## Data Model

- **FinancialYear** — open/closed accounting period
- **LedgerEntry** — all posted journal lines for the period
- **Stock** + **StockMovement** — inventory valuation at period end
- **SalesInvoice**, **PurchaseInvoice** — revenue and purchase totals
- Optional **StockTake** — physical verification before close

## Business Owner

- Finance
- Store Manager

## Actors

- Accountant
- Inventory manager
- ClosingService (future)

## Trigger

Last business day of month or financial year; or manual close initiated by finance.

## Preconditions

- No pending draft documents in branch (or policy allows carry-forward)
- Bank/cash reconciliation completed
- Stock take completed or variances approved (recommended)
- User has finance admin permission

## Main Flow

1. **Pre-close checks** — list open POs, unpaid invoices, pending transfers in `IN_TRANSIT`.
2. **Stock reconciliation** — optional `StockTake`; approve adjustments.
3. **Ledger review** — Trial balance from `LedgerEntry` for period.
4. **GST summary** — aggregate tax from posted sales/purchase invoices.
5. **Mark period** — update `FinancialYear` status or branch period flag (implementation-specific).
6. **Lock postings** — reject new invoices dated in closed period (service rule).
7. **Archive reports** — export P&L, stock valuation, GST files.
8. Audit close action via `AuditService`.

## Alternate Flows

- Material variance found → block close until adjustment approved
- Late supplier invoice → backdated posting with finance approval only

## Exception Handling

- Close is reversible only by finance admin with audit reason (reopen period)

## Business Rules

- Inventory value = sum of `Stock.availableQuantity × Batch.purchaseRate` (or movement-based COGS policy)
- No stock quantity changes without movement even during close
- Document numbers and sequences continue in new period via `SequenceGenerator`
- Branch-scoped reports roll up to company for consolidated view

## Database Tables

- FinancialYear, Ledger, LedgerEntry
- SalesInvoice, PurchaseInvoice, Payment, Receipt
- Stock, StockMovement, Batch
- StockTake (optional)
- AuditLog

## Permissions

- Finance close — admin/finance role (seed: extend beyond `REPORT:REPORT:READ`)

## KPIs

- Days to close
- Stock variance % at count
- Unposted document count at close

## Future Improvements

- Automated close checklist UI
- Scheduled close reminders
- Multi-branch consolidated close wizard

## Related

- [Inventory flow](./inventory-flow.md)
- [Finance domain](../domain/finance/README.md)
- [Payment flow](./payment-flow.md)
