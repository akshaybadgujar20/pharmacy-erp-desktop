# Loyalty

Loyalty manages customer reward programs. `LoyaltyProgram` defines earning and redemption rules; `LoyaltyTransaction` is the immutable history of points earned, redeemed, or adjusted.

## Relationship Diagram

```mermaid
flowchart TB
    PROGRAM["LoyaltyProgram<br/><small>Earn • redeem rules</small>"]
    TXN["LoyaltyTransaction<br/><small>Points history</small>"]

    PROGRAM -->|"1 : many"| TXN
    TXN -.->|"source"| INV["SalesInvoice"]
    TXN -.->|"customer"| CUST["Customer"]

    classDef master fill:#1d4ed8,stroke:#1e3a8a,color:#ffffff,stroke-width:3px;
    classDef ledger fill:#fef3c7,stroke:#d97706,color:#92400e,stroke-width:1.5px;
    classDef external fill:#f3f4f6,stroke:#6b7280,color:#374151,stroke-width:1px,stroke-dasharray:5;

    class PROGRAM master;
    class TXN ledger;
    class INV,CUST external;
```

**Legend:** transactions reference the source sales document and customer for audit trail.

## How the Tables Work Together

- **LoyaltyProgram** configures point earning ratios, redemption rules, validity, and eligible products.
- **LoyaltyTransaction** records every earn, redeem, adjustment, expiry, or promotional bonus.
- Points balance is derived from the transaction history — not stored as a single mutable counter.
- Sales invoices and returns generate loyalty transactions automatically when programs are active.
- Multiple programs can exist for seasonal or targeted campaigns.
- Customer loyalty settings also appear on the `Customer` record (party management).

## Tables

- [[51_loyalty_program]] — loyalty program configuration.
- [[52_loyalty_transaction]] — loyalty points transaction history.
