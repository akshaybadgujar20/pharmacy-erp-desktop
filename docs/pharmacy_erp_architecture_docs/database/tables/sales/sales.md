# Sales

Sales records customer transactions from invoice through payment and returns. `SalesInvoice` is the primary billing document; line items snapshot batch, price, and tax at sale time.

**Domain documentation:** [Sales domain overview](../../domain/sales/README.md) — business rules, workflows, and permissions. There is no `SalesOrder` or `Quotation` table in the current schema.

## Relationship Diagram

```mermaid
flowchart TB
    INV["SalesInvoice<br/><small>Customer sale header</small>"]
    INV_ITEM["SalesInvoiceItem<br/><small>Batch • qty • price snapshot</small>"]
    PAY["SalesPayment<br/><small>Cash • UPI • Card</small>"]
    RET["SalesReturn<br/><small>Customer return header</small>"]
    RET_ITEM["SalesReturnItem<br/><small>Returned lines</small>"]

    INV -->|"1 : many"| INV_ITEM
    INV -->|"1 : many"| PAY
    INV -->|"1 : 0..1"| RET
    RET -->|"1 : many"| RET_ITEM

    INV_ITEM -.->|"decreases"| STOCK["Stock"]
    RET_ITEM -.->|"may increase"| STOCK

    classDef header fill:#1d4ed8,stroke:#1e3a8a,color:#ffffff,stroke-width:3px;
    classDef item fill:#dbeafe,stroke:#2563eb,color:#172554,stroke-width:1.5px;
    classDef payment fill:#dcfce7,stroke:#16a34a,color:#14532d,stroke-width:1.5px;
    classDef external fill:#f3f4f6,stroke:#6b7280,color:#374151,stroke-width:1px,stroke-dasharray:5;

    class INV header;
    class INV_ITEM,RET_ITEM item;
    class PAY,RET payment;
    class STOCK external;
```

**Legend:** dashed `Stock` node shows inventory impact on posting. `SalesReturn` references the original invoice.

## How the Tables Work Together

- **SalesInvoice** is the customer billing document with totals, tax, discounts, and optional prescribing doctor.
- **SalesInvoiceItem** snapshots batch, quantity, selling price, MRP, GST, and line total at transaction time.
- **SalesPayment** records payments (Cash, UPI, Card, mixed modes) including partial and advance payments.
- **SalesReturn** handles customer returns with reason, approval status, and refund method.
- **SalesReturnItem** restores inventory where applicable and maintains batch-level traceability.
- Invoice numbers are unique within branch scope.
- Posting must atomically update invoice, items, stock movements, and outbox.
- Schedule H medicines may require prescription and patient/doctor fields on the invoice.

## Tables

- [[38_sales_invoice]] — sales invoice header.
- [[39_sales_invoice_item]] — sales invoice line items.
- [[40_sales_return]] — sales return header.
- [[41_sales_return_item]] — sales return line items.
- [[42_sales_payment]] — payment received against sales invoices.
