# Pricing

Pricing defines how medicines are priced for different customer groups and scenarios. `PriceList` groups prices; `Tax` and `DiscountRule` apply reusable commercial rules at billing time.

## Relationship Diagram

```mermaid
flowchart TB
    PL["PriceList<br/><small>Retail • Wholesale • Corporate</small>"]
    PLI["PriceListItem<br/><small>Medicine price per list</small>"]
    TAX["Tax<br/><small>GST rates • HSN mapping</small>"]
    DISC["DiscountRule<br/><small>Promo • category rules</small>"]

    PL -->|"1 : many"| PLI

    PLI -.->|"references"| MED["Medicine"]
    DISC -.->|"evaluated at"| INV["SalesInvoice"]

    classDef master fill:#1d4ed8,stroke:#1e3a8a,color:#ffffff,stroke-width:3px;
    classDef item fill:#dbeafe,stroke:#2563eb,color:#172554,stroke-width:1.5px;
    classDef rule fill:#dcfce7,stroke:#16a34a,color:#14532d,stroke-width:1.5px;
    classDef external fill:#f3f4f6,stroke:#6b7280,color:#374151,stroke-width:1px,stroke-dasharray:5;

    class PL master;
    class PLI item;
    class TAX,DISC rule;
    class MED,INV external;
```

**Legend:** `PriceList` may be branch-scoped. Final prices are snapshotted on transaction line items.

## How the Tables Work Together

- **PriceList** defines a pricing scheme (Retail, Wholesale, Hospital, Promotional).
- **PriceListItem** stores selling price, discount, and effective dates per medicine within a list.
- **Tax** maintains GST rates, cess, and HSN/SAC mappings with effective date ranges.
- **DiscountRule** defines reusable discount policies (customer category, quantity, campaign).
- Branch-specific sale pricing uses branch-scoped `PriceList` / `PriceListItem` — not on `Batch`.
- Billing evaluates rules at transaction time; line items snapshot the applied price and tax.
- Tax changes should not retroactively alter historical invoice lines.

## Tables

- [[47_price_list]] — price list header.
- [[48_price_list_item]] — medicine price within a price list.
- [[49_tax]] — tax rate master.
- [[50_discount_rule]] — reusable discount policy.
