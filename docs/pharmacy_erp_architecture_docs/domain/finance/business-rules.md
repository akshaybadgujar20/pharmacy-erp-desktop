# Finance — Business Rules

## Purpose

Catalog enforceable financial rules for ledger, journal, payments, receipts, and tax usage.

## Responsibilities

- Rule IDs for implementers and testers.

## Scope

Finance bounded context; cross-references to supplier payments and customer receipts.

## Related Entities

[financial.md](../../database/tables/financial/financial.md), [49_tax.md](../../database/tables/pricing/49_tax.md).

## Ledger Rules

| ID | Rule | Enforcement |
|----|------|-------------|
| BR-F01 | ledgerCode unique | DB |
| BR-F02 | ledgerType ∈ ASSET, LIABILITY, INCOME, EXPENSE, EQUITY | Validation |
| BR-F03 | normalBalance ∈ DEBIT, CREDIT | Validation |
| BR-F04 | System ledgers cannot be deleted | Application |
| BR-F05 | Ledger balance = sum(entries); never store on Ledger | Design |

## Journal (LedgerEntry) Rules

| ID | Rule | Enforcement |
|----|------|-------------|
| BR-F10 | Each line: debit XOR credit (not both > 0) | DB CHECK |
| BR-F11 | Each line: debit ≥ 0 AND credit ≥ 0 | DB CHECK |
| BR-F12 | Per voucher: Σ debit = Σ credit | Posting service |
| BR-F13 | Posted entries immutable | Application |
| BR-F14 | Cancellation = reversal entries with opposite amounts | Posting service |
| BR-F15 | voucherType + voucherId groups entries | Index |

See [journal.md](journal.md) and [accounting.md](accounting.md).

## Payment Rules

| ID | Rule | Enforcement |
|----|------|-------------|
| BR-F20 | amount > 0 | DB CHECK |
| BR-F21 | COMPLETED payment has ledger entries | Transaction |
| BR-F22 | CANCELLED payment has reversal entries | Transaction |
| BR-F23 | paymentNumber unique | DB |
| BR-F24 | SUPPLIER_PAYMENT references supplier or purchase invoice | Validation |

## Receipt Rules

| ID | Rule | Enforcement |
|----|------|-------------|
| BR-F30 | amount > 0 | DB CHECK |
| BR-F31 | COMPLETED receipt has ledger entries | Transaction |
| BR-F32 | receiptNumber unique | DB |
| BR-F33 | CUSTOMER_PAYMENT reduces receivable | Posting + customer cache |

## Tax Rules

| ID | Rule | Enforcement |
|----|------|-------------|
| BR-F40 | taxCode unique | DB |
| BR-F41 | 0 ≤ taxRate ≤ 100 | DB CHECK |
| BR-F42 | Inactive tax not selectable on new lines | UI + validation |
| BR-F43 | Do not edit tax after use; add new effective row | Application |
| BR-F44 | Invoice lines snapshot taxRate at post time | Sales/Purchasing |

## Expense Rules (conceptual — table not modeled)

| ID | Rule | Status |
|----|------|--------|
| BR-F50 | Expense payment uses Payment with paymentType EXPENSE | Via Payment |
| BR-F51 | Expense approval before post | Future |

## Domain Events

Rules tie to events in [events.md](events.md).

## State Model

PENDING documents editable; COMPLETED trigger BR-F21/BR-F31.

## Integrations

Sales/Purchase invoice post handlers must call same posting service enforcing BR-F12.

## Security Considerations

- Posting rules cannot be bypassed via direct SQL in production.

## Performance Considerations

- BR-F12 validation in memory before batch insert — O(n) on line count per voucher.

## Future Enhancements

- Financial period lock — reject posts before close date.
