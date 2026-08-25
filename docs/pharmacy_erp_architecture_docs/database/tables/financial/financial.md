# Financial

Financial tables record money movement and the general ledger. `Payment` and `Receipt` track cash flow; `Ledger` and `LedgerEntry` form the double-entry accounting journal.

## Relationship Diagram

```mermaid
flowchart TB
    LEDGER["Ledger<br/><small>Cash • Bank • GST accounts</small>"]
    ENTRY["LedgerEntry<br/><small>Debit / Credit journal</small>"]
    PAY["Payment<br/><small>Outgoing payments</small>"]
    REC["Receipt<br/><small>Incoming receipts</small>"]

    LEDGER -->|"1 : many"| ENTRY
    PAY -.->|"posts"| ENTRY
    REC -.->|"posts"| ENTRY

    classDef master fill:#1d4ed8,stroke:#1e3a8a,color:#ffffff,stroke-width:3px;
    classDef journal fill:#fef3c7,stroke:#d97706,color:#92400e,stroke-width:1.5px;
    classDef txn fill:#dcfce7,stroke:#16a34a,color:#14532d,stroke-width:1.5px;

    class LEDGER master;
    class ENTRY journal;
    class PAY,REC txn;
```

**Legend:** dashed arrows show that business transactions (purchase, sales, returns) generate ledger entries — not always direct FKs.

## How the Tables Work Together

- **Payment** records outgoing money to suppliers, employees, authorities, and other payees.
- **Receipt** records incoming money from customers, insurers, and other sources.
- **Ledger** is the master list of accounting heads (Cash, Bank, Sales, Purchase, GST, etc.).
- **LedgerEntry** is the append-only journal with debit/credit pairs for every financial event.
- Sales, purchase, returns, and adjustments ultimately post to ledger entries.
- Ledger entries support Trial Balance, P&L, Balance Sheet, and GST reporting.
- Financial year scoping comes from `FinancialYear` (configuration).

## Tables

- [[43_payment]] — outgoing payment voucher.
- [[44_receipt]] — incoming receipt voucher.
- [[45_ledger]] — accounting ledger master.
- [[46_ledger_entry]] — general ledger journal entry.
