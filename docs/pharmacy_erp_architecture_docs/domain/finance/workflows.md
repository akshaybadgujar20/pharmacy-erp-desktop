# Finance — Workflows

## Purpose

End-to-end workflows for payments, receipts, ledger posting, tax maintenance, and reconciliation.

## Responsibilities

- Sequence diagrams and transaction boundaries.

## Scope

Finance operations; invoice posting summarized as integration steps.

## Related Entities

[financial.md](../../database/tables/financial/financial.md), [49_tax.md](../../database/tables/pricing/49_tax.md).

## Workflows

### WF-F01 — Post supplier payment

1. Select supplier and invoices to pay.
2. Create `Payment` (PENDING) with `paymentType = SUPPLIER_PAYMENT`.
3. Build balanced LedgerEntry lines (Payable DR, Bank CR).
4. Set Payment COMPLETED in same `UnitOfWork`.
5. Update Supplier.outstandingAmount.
6. Emit `PaymentCompleted`.

Detail: [supplier/payments.md](../supplier/payments.md).

### WF-F02 — Post customer receipt

1. Select customer and optional sales invoices.
2. Create `Receipt` (PENDING), `receiptType = CUSTOMER_PAYMENT`.
3. LedgerEntry: Cash/Bank DR, Receivable CR.
4. Receipt COMPLETED; update Customer.outstandingAmount.
5. Emit `ReceiptCompleted`.

### WF-F03 — Cancel payment / receipt

1. Verify user has cancel permission.
2. Create reversal LedgerEntry voucher (opposite debits/credits).
3. Set original status CANCELLED/REVERSED.
4. Restore party outstanding cache.
5. Emit cancellation event.

Never delete posted rows — [journal.md](journal.md).

### WF-F04 — Sales invoice accounting (integration)

Triggered by Sales module on invoice post:

1. Load tax snapshots from invoice lines ([Tax](../../database/tables/pricing/49_tax.md)).
2. Build multi-line journal: revenue, GST output, receivable/cash, COGS/inventory.
3. `LedgerPostingService.post(voucherType=SALES, voucherId=invoiceId)`.
4. Emit `LedgerEntryPosted`.

### WF-F05 — Purchase invoice accounting (integration)

Similar to WF-F04 with PURCHASE voucherType — increases Supplier payable.

### WF-F06 — Record expense payment

Until Expense table exists:

1. Create Payment with `paymentType = EXPENSE`.
2. Post DR Expense ledger, CR Cash/Bank.
3. Optional referenceType for memo.

Future: Expense document approval — [future.md](future.md).

### WF-F07 — Add new tax rate

1. Clone or create new `Tax` row with new `effectiveFrom`.
2. Set prior tax `effectiveTo` if replacing.
3. Emit `TaxRateActivated`.
4. Do not mutate rates used on historical invoices (BR-F43).

See [taxation.md](taxation.md).

### WF-F08 — Outstanding reconciliation

1. Nightly job for each Customer/Supplier with activity.
2. Sum receivable/payable ledger entries.
3. Compare to denormalized outstanding on master.
4. Update if |drift| > ε; log `OutstandingReconciled`.

See [reconciliation.md](reconciliation.md).

## Business Rules

Each workflow enforces [business-rules.md](business-rules.md).

## Domain Events

Per [events.md](events.md).

## State Model

WF-F01/F02 transition PENDING → COMPLETED atomically with journal post.

## Integrations

| Workflow | External module |
|----------|-----------------|
| WF-F04 | Sales |
| WF-F05 | Purchasing |
| WF-F01 | Supplier |
| WF-F02 | Customer |

## Security Considerations

- WF-F03 cancel requires supervisor permission.
- WF-F07 tax change admin-only.

## Performance Considerations

- WF-F08 batch by branch; limit concurrency to avoid DB lock on SQLite.

## Future Enhancements

- WF-F09 — Bank statement import reconciliation.
- WF-F10 — Manual journal voucher UI.
