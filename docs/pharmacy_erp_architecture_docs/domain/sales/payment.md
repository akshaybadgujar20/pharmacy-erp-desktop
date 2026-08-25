# Sales — Payment

## Purpose

`SalesPayment` records money received against a `SalesInvoice`. Retail pharmacies need immediate cash settlement, split payments (cash + UPI), partial credit collection, and refund tracking after returns. Payments drive invoice `paidAmount`, `balanceAmount`, and `paymentStatus` without changing document `status` from `POSTED`.

**Database reference:** [SalesPayment](../../database/tables/sales/42_sales_payment.md) · [Sales overview](../../database/tables/sales/sales.md)

## Responsibilities

- Record payment amount, method, and references (UPI ref, cheque no, etc.)
- Assign branch- or company-scoped `paymentNumber` where applicable
- Update parent invoice settlement fields atomically
- Support multiple payments per invoice and refund payments linked to returns

## Scope

### In Scope

- Cash, card, UPI, cheque, bank transfer, credit account, mixed modes
- Partial payments on credit invoices
- Payment at post time (same transaction) or after post
- Refund disbursement recorded as payment with negative amount or `REFUNDED` status

### Out of Scope

- Supplier payments (Finance / Supplier domains)
- Loyalty point redemption as payment instrument (future)
- Payment gateway reconciliation files

## Related Entities

- `SalesInvoice` — parent; owns `paidAmount`, `balanceAmount`, `paymentStatus`
- `SalesReturn` — may trigger refund payment
- `Receipt`, `LedgerEntry` — finance postings triggered by completed payments

## Business Rules

- Each payment belongs to exactly one `SalesInvoice`.
- `paymentAmount > 0` for collections; refunds use dedicated flow or negative adjustment per finance policy.
- Sum of completed payments cannot exceed `netAmount` unless overpayment handling is enabled in settings.
- On payment save/complete:
  - `paidAmount = SUM(completed payments)`
  - `balanceAmount = netAmount - paidAmount` (adjusted for returns)
  - Recompute `paymentStatus`: `UNPAID` | `PARTIALLY_PAID` | `PAID` | `REFUNDED`
- Posted/completed payments are immutable; cancel via reversal payment row.
- Payment methods: `CASH`, `CARD`, `UPI`, `CHEQUE`, `BANK`, `CREDIT`, `MIXED` (header-level summary on invoice optional).
- Credit sales: invoice may post with `paymentStatus = UNPAID`; collections added later.

## Domain Events

- `SalesPaymentRecorded` — payment completed
- `SalesPaymentCancelled` — reversal
- `SalesInvoicePaid` — when `paymentStatus` transitions to `PAID`
- `SalesInvoiceRefunded` — when returns/refunds drive `paymentStatus` to `REFUNDED`

## State Model

### SalesPayment.status

| Value | Meaning |
|-------|---------|
| `PENDING` | Initiated, not settled (e.g. cheque pending) |
| `COMPLETED` | Counts toward `paidAmount` |
| `FAILED` | Does not affect invoice |
| `CANCELLED` | Voided before settlement |
| `REFUNDED` | Refund issued to customer |

### Invoice paymentStatus (derived)

| Condition | paymentStatus |
|-----------|---------------|
| No completed payments | `UNPAID` |
| `0 < paidAmount < netAmount` | `PARTIALLY_PAID` |
| `paidAmount >= netAmount` | `PAID` |
| Refunds net to zero or credit | `REFUNDED` |

## Integrations

- **Finance:** Ledger cash/bank entries on `COMPLETED`
- **Returns:** Refund amount on `SalesReturn` triggers refund payment or adjusts balance
- **Audit:** Log payment method and amount; sanitize card/UPI refs in application logs

## Security

- Recording payment requires `SALES:SALES_INVOICE:CREATE` or dedicated payment permission (future `SALES:SALES_PAYMENT:CREATE`).
- Users cannot attach payments to invoices outside their branch.

## Performance

- Index payments by `salesInvoiceId` for quick settlement view on invoice detail.
- Day-end cash drawer report: aggregate `COMPLETED` payments by method for `(branchId, paymentDate)`.

## Future

- Integrated POS terminal capture
- Customer wallet / store credit balance
- Auto-reconcile UPI merchant settlement files
