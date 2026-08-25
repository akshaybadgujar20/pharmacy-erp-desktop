# Purchasing — Purchase Invoice

## Purpose

`PurchaseInvoice` records the supplier's financial bill for goods or services. It drives accounts payable and cost validation against GRN/PO but **does not by itself increase stock** — inventory was already updated on GRN post.

**Database reference:** [PurchaseInvoice](../../database/tables/purchase/34_purchase_invoice.md) · [PurchaseInvoiceItem](../../database/tables/purchase/35_purchase_invoice_item.md) · [Purchase overview](../../database/tables/purchase/purchase.md)

## Responsibilities

- Register supplier invoice number, date, and amounts
- Line-level cost, tax, and discount for valuation
- Optional link to PO/GRN for three-way match
- Trigger finance AP entries on post

## Scope

### In Scope

- Invoice entry against one supplier and branch
- Match invoice qty/cost to received goods
- Post and cancel with audit

### Out of Scope

- Paying supplier (Finance payment voucher)
- GRN physical receipt (see [goods-receipt.md](./goods-receipt.md))

## Related Entities

- `PurchaseInvoiceItem`
- `GoodsReceipt`, `GoodsReceiptItem`, `PurchaseOrder`
- `Supplier`, `Branch`
- `LedgerEntry` (AP)

## Business Rules

- At least one invoice line.
- Supplier invoice number unique per supplier within company policy (duplicate detection).
- Branch-scoped internal document number per sequence config.
- Posted invoice immutable; corrections via credit note or return (future) or cancel policy.
- Line amounts roll to header `totalAmount`, `taxAmount`, `discountAmount`.
- Three-way match (when enabled):
  - Invoice qty ≤ GRN received qty for linked lines
  - Unit cost variance beyond tolerance requires approver
- Posting creates AP liability; does not create `Batch`/`Stock`.

## Domain Events

- `PurchaseInvoicePosted`
- `PurchaseInvoiceCancelled`
- `PurchaseInvoiceMatched` (when GRN link validated)

## State Model

Typical: `DRAFT` → `POSTED` → `CANCELLED` (exact CHECK values per table spec).

## Integrations

- **Finance:** AP ledger, tax input credit registers
- **GRN/PO:** Reference IDs on lines for match reports
- **Outbox:** Sync posted invoices to HO systems

## Security

- Separate permission recommended: `PURCHASE:PURCHASE_INVOICE:CREATE` (future).
- Prevent invoice for supplier not contracted with branch company.

## Performance

- Match validation: join invoice lines to GRN items in one query before post.

## Future

- OCR ingest of supplier PDF invoices
- Auto-match GRN lines by batch number
- Multi-GRN single invoice consolidation
