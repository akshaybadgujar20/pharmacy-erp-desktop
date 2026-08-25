# Finance — Future Enhancements

## Purpose

Roadmap for financial management capabilities not yet implemented or partially modeled.

## Responsibilities

- Document gaps (Expense table, permissions) and planned features.

## Scope

Finance domain evolution.

## Related Entities

Current: [financial.md](../../database/tables/financial/financial.md). Gap analysis: [architecture-review.md](../../database/architecture-review.md).

## Known Gaps

| Gap | Status |
|-----|--------|
| **Expense** table | Referenced in Payment types and LedgerEntry voucher examples; **no Prisma model yet** |
| FINANCE:* permissions | Not seeded; only REPORT_VIEW exists |
| Bank reconciliation | Not implemented |
| Period close | Not implemented |
| Manual journal UI | Posting service only via integrations |

## Planned Capabilities

### Expense management

- `Expense` aggregate: header + lines, approval workflow.
- Link Payment `paymentType = EXPENSE` to Expense document.
- Category ledgers for rent, utilities, consumables.
- BR-F51 approval before post.

### Permissions

Seed permissions:

- `FINANCE:PAYMENT:CREATE`, `READ`, `CANCEL`
- `FINANCE:RECEIPT:CREATE`, `READ`, `CANCEL`
- `FINANCE:LEDGER:READ`, `FINANCE:LEDGER:UPDATE` (COA admin)
- `FINANCE:JOURNAL:CREATE` (manual entries)

### Reporting and compliance

- GSTR exports from invoice snapshots + GST ledgers — extends [taxation.md](taxation.md).
- TDS on supplier payments.
- Financial period lock and year-end close journal.
- Budget vs actual by expense ledger.

### Banking

- Bank statement import (REC-04 in [reconciliation.md](reconciliation.md)).
- UPI/cardless reconciliation via reference id.
- Multi-bank account support per branch.

### Architecture

- Idempotent posting with `operationId`.
- Read models for trial balance / aging snapshots.
- Event-sourced projection optional for high-volume chains.

## Business Rules

Future period close must preserve BR-F13 immutability of posted entries.

## Domain Events

Planned: `PeriodClosed`, `ExpenseApproved`, `BankStatementImported`.

## State Model

Expense document: DRAFT → APPROVED → PAID.

## Integrations

- HR payroll → Payment (salary — out of pharmacy scope v1).
- Inventory valuation adjustment journals automated.

## Security Considerations

- SOX-style segregation: creator ≠ approver ≠ poster for expenses.

## Performance Considerations

- Move trial balance to materialized view when entry count > 1M.

## Dependencies

- [009_financial_management_accounting.md](../../ado/009_financial_management_accounting.md)
- Customer/Supplier outstanding cache maturity from [reconciliation.md](reconciliation.md)

## Cross-Links

When Expense is modeled, update:

- [ANCHOR_FACTS.md](../ANCHOR_FACTS.md)
- [supplier/payments.md](../supplier/payments.md) expense payment section
- [accounting.md](accounting.md) expense posting examples
