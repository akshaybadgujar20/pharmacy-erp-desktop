# Finance — Accounting (Double-Entry)

## Purpose

Explain double-entry accounting principles as applied in the Pharmacy ERP through the **LedgerEntry** pattern, and map business transactions to standard financial reports.

## Responsibilities

- Accounting equation, normal balances, and report derivation.
- Bridge operational documents to GL postings.

## Scope

Conceptual accounting using Ledger + LedgerEntry; complements [journal.md](journal.md).

## Related Entities

[financial.md](../../database/tables/financial/financial.md), [45_ledger.md](../../database/tables/financial/45_ledger.md), [46_ledger_entry.md](../../database/tables/financial/46_ledger_entry.md).

## Accounting Foundation

### Equation

```text
Assets = Liabilities + Equity
```

Income increases equity (via retained earnings); expenses decrease it.

### Double-entry rule

Every transaction affects **at least two** accounts with equal total debits and credits. Implemented as multiple `LedgerEntry` rows per voucher — see [journal.md](journal.md).

### Normal balances

| Type | Increases with | Decreases with |
|------|----------------|----------------|
| ASSET | Debit | Credit |
| EXPENSE | Debit | Credit |
| LIABILITY | Credit | Debit |
| INCOME | Credit | Debit |
| EQUITY | Credit | Debit |

## Transaction → Posting Map

### Sales invoice (simplified retail cash)

| Account | Debit | Credit |
|---------|------:|-------:|
| Cash / Receivable | Total invoice | |
| Sales Revenue | | Taxable + exempt sales |
| GST Output | | Tax amount |
| COGS / Inventory | Cost | |
| Inventory Asset | | Cost |

Exact accounts depend on payment terms and tax split — posting handler uses configured ledger codes.

### Purchase invoice

| Account | Debit | Credit |
|---------|------:|-------:|
| Purchase / Inventory | Net + tax | |
| GST Input | Input tax | |
| Supplier Payable | | Total |

Links to [supplier](../supplier/README.md) payable balance.

### Customer receipt

Debit Cash/Bank; Credit Customer Receivable — [44_receipt.md](../../database/tables/financial/44_receipt.md).

### Supplier payment

Debit Supplier Payable; Credit Cash/Bank — [43_payment.md](../../database/tables/financial/43_payment.md).

### Expense (via Payment)

Debit Expense account; Credit Cash/Bank with `paymentType = EXPENSE`. Dedicated Expense document planned — [future.md](future.md).

## Reports from LedgerEntry

| Report | Derivation |
|--------|------------|
| **Trial Balance** | Sum debits and credits per ledgerId for period |
| **General Ledger** | Lines filtered by ledgerId + date |
| **P&L** | INCOME − EXPENSE ledgers for period |
| **Balance Sheet** | ASSET, LIABILITY, EQUITY as of date |
| **GST Summary** | GST Input/Output ledger activity |

Financial year from `FinancialYear` configuration table scopes date filters.

## Business Rules

- BR-F12 balance enforcement on every voucher.
- Tax amounts on invoices are informational snapshots from [Tax](../../database/tables/pricing/49_tax.md); GL GST postings use tax component totals from invoice post handler.

## Domain Events

`LedgerEntryPosted` triggers report cache invalidation (future).

## State Model

Posted accounting period may be **closed** (future) — reject backdated posts.

## Integrations

| Module | Posts via |
|--------|-----------|
| Sales | Invoice post handler |
| Purchasing | Purchase invoice post |
| Customer | Receipt |
| Supplier | Payment |
| Inventory | Adjustment journal (policy) |

Party management outstanding caches reconcile against receivable/payable ledgers — [reconciliation.md](reconciliation.md).

Loyalty redemption reduces sales revenue or posts discount account — [loyalty.md](../../database/tables/loyalty/loyalty.md).

## Security Considerations

- Report export may contain aggregated financial data — role-gated via `REPORT:REPORT:READ`.

## Performance Considerations

- P&L for month: aggregate indexed by transactionDate and ledgerType join.

## Future Enhancements

- Automated month-end close and retained earnings transfer journal.
- Parallel accounting standards (Ind AS) mapping layers.

## See Also

[journal.md](journal.md) — LedgerEntry posting pattern and reversal mechanics.
