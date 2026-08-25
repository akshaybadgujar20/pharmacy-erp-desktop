# Finance Domain

## Purpose

The Finance bounded context records all monetary movement for the pharmacy through double-entry accounting. It provides the chart of accounts (`Ledger`), immutable journal lines (`LedgerEntry`), payment and receipt vouchers, expense tracking, and tax configuration consumed by pricing and transactional modules.

## Responsibilities

- Maintain chart of accounts and posting rules.
- Enforce double-entry balance on every voucher.
- Record outgoing `Payment` and incoming `Receipt` transactions.
- Post journal entries for sales, purchase, returns, and adjustments (via integration handlers).
- Expose tax master data (`Tax`) for pricing — table under pricing category.
- Support reconciliation, trial balance, and statutory reporting.

## Scope

### In Scope

- Ledger, LedgerEntry (general journal).
- Payment, Receipt vouchers.
- Expense payments (via Payment types; Expense table planned — see [future.md](future.md)).
- Tax definitions (pricing integration).
- Financial year scoping via configuration.

### Out of Scope

- Sales invoice line pricing ([sales](../sales/README.md)).
- Supplier/customer master data ([customer](../customer/README.md), [supplier](../supplier/README.md)).
- Inventory valuation postings detail ([inventory](../inventory/README.md)) — referenced only.

## Related Entities

| Entity | Table overview |
|--------|----------------|
| Ledger | [45_ledger.md](../../database/tables/financial/45_ledger.md) |
| LedgerEntry | [46_ledger_entry.md](../../database/tables/financial/46_ledger_entry.md) |
| Payment | [43_payment.md](../../database/tables/financial/43_payment.md) |
| Receipt | [44_receipt.md](../../database/tables/financial/44_receipt.md) |
| Tax | [49_tax.md](../../database/tables/pricing/49_tax.md) |
| Financial overview | [financial.md](../../database/tables/financial/financial.md) |

**Note:** `Expense` is referenced in architecture docs and payment types but **not yet modeled** as a dedicated table — see [architecture-review.md](../../database/architecture-review.md).

## Business Rules

- Every posted voucher: sum(debits) = sum(credits).
- LedgerEntry rows immutable after post; reversals via opposite entries.
- Ledger balances never stored on Ledger row — derived from entries.
- Tax rates versioned by effective dates; historical rates immutable after use.
- Payments and receipts generate LedgerEntry in same transaction.

## Domain Events

| Event | Trigger |
|-------|---------|
| `LedgerEntryPosted` | Balanced journal saved |
| `PaymentCompleted` | Outgoing payment posted |
| `ReceiptCompleted` | Incoming receipt posted |
| `PaymentCancelled` | Reversal posted |
| `TaxRateActivated` | New tax effective period |

## State Model

| Document | States |
|----------|--------|
| Payment | PENDING, COMPLETED, FAILED, CANCELLED |
| Receipt | PENDING, COMPLETED, CANCELLED, REVERSED |
| LedgerEntry | isPosted true (immutable) |

## Integrations

- **Sales/Purchasing** — invoice post handlers create LedgerEntry sets.
- **Customer/Supplier** — receivable/payable sub-ledgers update denormalized outstanding.
- **Pricing** — Tax master on invoice lines.
- **Configuration** — FinancialYear for report periods.

## Security Considerations

- Financial posting permissions planned: `FINANCE:PAYMENT:CREATE`, `FINANCE:RECEIPT:CREATE`, `FINANCE:LEDGER:READ`.
- All posts audited with user id and correlation id.

## Performance Considerations

- Index LedgerEntry by voucherType/voucherId and transactionDate.
- Trial balance queries aggregate by ledgerId and date range — consider materialized views at scale.

## Future Enhancements

- Dedicated Expense entity and approval workflow.
- Bank reconciliation import.
- Full GST return export.

## Document Index

| File | Topic |
|------|-------|
| [aggregate.md](aggregate.md) | Aggregates |
| [business-rules.md](business-rules.md) | Rules |
| [ledger.md](ledger.md) | Chart of accounts |
| [journal.md](journal.md) | LedgerEntry journal pattern |
| [accounting.md](accounting.md) | Double-entry accounting |
| [workflows.md](workflows.md) | Workflows |
| [validation.md](validation.md) | Validation |
| [taxation.md](taxation.md) | Tax master |
| [reconciliation.md](reconciliation.md) | Reconciliation |
| [events.md](events.md) | Events |
| [future.md](future.md) | Roadmap |
