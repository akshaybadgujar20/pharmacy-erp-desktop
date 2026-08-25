# Finance — Validation

## Purpose

Validation rules for financial commands, posting lines, and tax master data.

## Responsibilities

- Field-level and voucher-level validation before UnitOfWork commit.

## Scope

Payment, Receipt, LedgerEntry composition, Tax DTOs.

## Related Entities

[43_payment.md](../../database/tables/financial/43_payment.md), [44_receipt.md](../../database/tables/financial/44_receipt.md), [46_ledger_entry.md](../../database/tables/financial/46_ledger_entry.md), [49_tax.md](../../database/tables/pricing/49_tax.md).

## Payment Validation

| Field | Rules |
|-------|-------|
| `paymentType` | Required; valid enum set |
| `amount` | > 0; max 14,2 |
| `paymentMethod` | CASH, UPI, CARD, CHEQUE, BANK_TRANSFER |
| `paymentDate` | Required; not future beyond policy |
| `referenceType` / `referenceId` | Required for SUPPLIER_PAYMENT when paying invoice |
| `transactionReference` | Required for BANK_TRANSFER, CHEQUE |

## Receipt Validation

| Field | Rules |
|-------|-------|
| `receiptType` | CUSTOMER_PAYMENT, ADVANCE, REFUND, INTEREST, OTHER |
| `amount` | > 0 |
| `receiptMethod` | Same set as payment methods |
| `referenceId` | Required when allocating to sales invoice |

## Journal Line Validation

| Rule | Check |
|------|-------|
| Minimum lines | ≥ 2 per voucher |
| Balance | Σ debit = Σ credit |
| Per line | debit XOR credit strictly |
| ledgerId | Must exist and isActive |
| transactionDate | Within open financial year |
| voucherNumber | Non-empty; max 30 |

## Ledger Master Validation

| Field | Rules |
|-------|-------|
| `ledgerCode` | Unique; max 30 |
| `ledgerName` | Required; max 150 |
| `ledgerType` | Valid enum |
| `parentLedgerId` | No circular hierarchy |

## Tax Validation

| Field | Rules |
|-------|-------|
| `taxCode` | Unique; max 20 |
| `taxRate` | 0–100 |
| `taxType` | GST, CGST, SGST, IGST, CESS |
| `effectiveFrom` | Required |
| `effectiveTo` | ≥ effectiveFrom if set |

## Business Rules

Implements BR-F10–BR-F44 from [business-rules.md](business-rules.md).

## Domain Events

Validation failure returns ApplicationException with ErrorCode — no events.

## State Model

Cannot COMPLETE payment without passing journal validation.

## Integrations

- NestJS ValidationPipe on API DTOs.
- LedgerPostingService validates voucher before insert.

## Security Considerations

- Reject client-supplied ledger balances or running totals.

## Performance Considerations

- Balance check O(n) on line count — typical n ≤ 10 per voucher.

## Future Enhancements

- Period lock validation on transactionDate.
