# Purchase

Purchase covers the full procurement lifecycle: ordering from suppliers, receiving goods, recording supplier invoices, and returning stock. Each document type has a header and line-item table.

**Domain documentation:** [Purchasing domain overview](../../domain/purchasing/README.md) — PO approval, GRN batch/stock creation, and fulfillment states.

## Relationship Diagram

```mermaid
flowchart TB
    PO["PurchaseOrder<br/><small>Order to supplier</small>"]
    PO_ITEM["PurchaseOrderItem<br/><small>Ordered lines</small>"]
    GRN["GoodsReceipt<br/><small>Physical receipt</small>"]
    GRN_ITEM["GoodsReceiptItem<br/><small>Received lines + batch</small>"]
    PI["PurchaseInvoice<br/><small>Supplier invoice</small>"]
    PI_ITEM["PurchaseInvoiceItem<br/><small>Invoice lines</small>"]
    PR["PurchaseReturn<br/><small>Return to supplier</small>"]
    PR_ITEM["PurchaseReturnItem<br/><small>Returned lines</small>"]

    PO -->|"1 : many"| PO_ITEM
    PO -->|"1 : many"| GRN
    GRN -->|"1 : many"| GRN_ITEM
    GRN -.->|"may link"| PI
    PI -->|"1 : many"| PI_ITEM
    PI -->|"1 : many"| PR
    PR -->|"1 : many"| PR_ITEM

    GRN_ITEM -.->|"creates"| BATCH["Batch"]
    GRN_ITEM -.->|"updates"| STOCK["Stock"]

    classDef header fill:#1d4ed8,stroke:#1e3a8a,color:#ffffff,stroke-width:3px;
    classDef item fill:#dbeafe,stroke:#2563eb,color:#172554,stroke-width:1.5px;
    classDef external fill:#f3f4f6,stroke:#6b7280,color:#374151,stroke-width:1px,stroke-dasharray:5;

    class PO,GRN,PI,PR header;
    class PO_ITEM,GRN_ITEM,PI_ITEM,PR_ITEM item;
    class BATCH,STOCK external;
```

**Legend:** dashed nodes (`Batch`, `Stock`) are inventory tables updated when goods are received.

## How the Tables Work Together

- **PurchaseOrder** is the procurement request sent to a supplier before goods arrive.
- **PurchaseOrderItem** lists medicines, quantities, and expected prices on the order.
- **GoodsReceipt** records physical delivery; one PO may produce multiple partial receipts.
- **GoodsReceiptItem** captures batch number, expiry, received quantity, and creates `Batch` + `Stock` rows.
- **PurchaseInvoice** is the supplier's financial document for accounting and payment.
- **PurchaseInvoiceItem** line totals drive inventory valuation and cost calculations.
- **PurchaseReturn** handles returns due to expiry, damage, or incorrect supply.
- **PurchaseReturnItem** decreases inventory and may generate supplier credit adjustments.
- All document numbers are unique within branch scope for offline multi-branch safety.
- Posting workflows must be atomic: document + items + stock movements + outbox in one transaction.

## Tables

- [[30_purchase_order]] — purchase order header.
- [[31_purchase_order_item]] — purchase order line items.
- [[32_goods_receipt]] — goods receipt note header.
- [[33_goods_receipt_item]] — goods receipt line items.
- [[34_purchase_invoice]] — supplier purchase invoice header.
- [[35_purchase_invoice_item]] — purchase invoice line items.
- [[36_purchase_return]] — purchase return header.
- [[37_purchase_return_item]] — purchase return line items.
