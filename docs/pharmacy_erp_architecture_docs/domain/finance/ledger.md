# Finance — Ledger (Chart of Accounts)

## Purpose

Document the Ledger subdomain: account taxonomy, hierarchy, normal balances, and relationship to journal entries.

## Responsibilities

- Explain COA structure for pharmacy operations.
- Link to persistence spec and posting behavior.

## Scope

Ledger master data — not transactional posting (see [journal.md](journal.md)).

## Related Entities

[45_ledger.md](../../database/tables/financial/45_ledger.md), overview [financial.md](../../database/tables/financial/financial.md).

## Ledger Structure

### Account types

| ledgerType | Normal balance | Examples |
|------------|----------------|----------|
| ASSET | DEBIT | Cash, Bank, Inventory, Customer Receivable |
| LIABILITY | CREDIT | Supplier Payable, GST Output payable |
| INCOME | CREDIT | Sales Revenue, Other Income |
| EXPENSE | DEBIT | Purchase, Rent, Salaries |
| EQUITY | CREDIT | Owner Capital, Retained Earnings |

### Hierarchy

Parent-child via `parentLedgerId` enables roll-up reporting:

```text
Assets
├── Current Assets
│   ├── Cash in Hand (CASH001)
│   └── HDFC Bank (BANK001)
└── Inventory Asset (INV001)

Liabilities
└── Supplier Payable (SUP001)
```

### System ledgers

Seeded `isSystem = true` accounts cannot be deleted:

- Cash, primary Bank, Sales, Purchase, GST Input/Output, Supplier Payable, Customer Receivable, Inventory.

## Business Rules

- BR-F01–BR-F05 from [business-rules.md](business-rules.md).
- Balance query: `SUM(debitAmount) - SUM(creditAmount)` adjusted for normal balance sign — see [accounting.md](accounting.md).

## Domain Events

- `LedgerAccountCreated` — manual account add (non-system).
- `LedgerAccountDeactivated` — isActive false.

## State Model

Ledger `isActive` controls selectable accounts on new postings; historical entries retain inactive ledger ids.

## Integrations

| Consumer | Usage |
|----------|-------|
| LedgerPostingService | Resolves ledgerId by code |
| Trial Balance report | Aggregates entries by ledger |
| Customer/Supplier | Sub-ledgers under Receivable/Payable |

Party links: customer receivable updates from [customer](../customer/README.md); supplier payable from [supplier](../supplier/README.md).

## Integrations with Loyalty

Loyalty points have **no** separate ledger in v1; redemption discounts post to Sales discount accounts — see [loyalty.md](../../database/tables/loyalty/loyalty.md).

## Security Considerations

- COA edit restricted to admin; system ledger codes immutable.

## Performance Considerations

- Cache ledger code → id map in memory at startup (small COA).
- Index childLedgers by parentLedgerId for tree UI.

## Future Enhancements

- Branch-specific ledger segments.
- Multi-currency ledger columns.
