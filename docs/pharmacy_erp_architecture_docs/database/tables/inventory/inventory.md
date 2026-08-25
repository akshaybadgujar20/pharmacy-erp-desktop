# Inventory

Inventory tracks medicine lots, branch-level stock balances, and every quantity change through an immutable movement ledger. `Batch` is org-global lot identity; `Stock` holds per-branch quantities.

## Relationship Diagram

```mermaid
flowchart TB
    BATCH["Batch<br/><small>Lot identity • expiry • cost</small>"]
    STOCK["Stock<br/><small>Balance per branch + batch</small>"]
    MOVEMENT["StockMovement<br/><small>Immutable ledger IN/OUT</small>"]

    subgraph ADJUST["Adjustments"]
        direction LR
        ADJ["StockAdjustment<br/><small>Header</small>"]
        ADJ_ITEM["StockAdjustmentItem<br/><small>Line items</small>"]
    end

    subgraph TRANSFER["Transfers"]
        direction LR
        XFER["StockTransfer<br/><small>Source → Destination</small>"]
        XFER_ITEM["StockTransferItem<br/><small>Line items</small>"]
    end

    subgraph COUNT["Stock Take"]
        direction LR
        TAKE["StockTake<br/><small>Count session</small>"]
        TAKE_ITEM["StockTakeItem<br/><small>Counted lines</small>"]
    end

    BATCH -->|"1 : many"| STOCK
    BATCH -->|"1 : many"| MOVEMENT
    ADJ -->|"1 : many"| ADJ_ITEM
    XFER -->|"1 : many"| XFER_ITEM
    TAKE -->|"1 : many"| TAKE_ITEM

    ADJ_ITEM -.->|"generates"| MOVEMENT
    XFER_ITEM -.->|"generates OUT + IN"| MOVEMENT
    TAKE_ITEM -.->|"may trigger"| ADJ

    classDef master fill:#1d4ed8,stroke:#1e3a8a,color:#ffffff,stroke-width:3px;
    classDef balance fill:#dbeafe,stroke:#2563eb,color:#172554,stroke-width:1.5px;
    classDef ledger fill:#fef3c7,stroke:#d97706,color:#92400e,stroke-width:1.5px;
    classDef detail fill:#dcfce7,stroke:#16a34a,color:#14532d,stroke-width:1.5px;

    class BATCH master;
    class STOCK balance;
    class MOVEMENT ledger;
    class ADJ,XFER,TAKE,ADJ_ITEM,XFER_ITEM,TAKE_ITEM detail;
```

**Legend:** dashed arrows show business workflows (not direct FKs). `Stock` is unique per `(branchId, batchId)`.

## How the Tables Work Together

- **Batch** stores org-global lot identity: batch number, expiry, purchase rate, statutory MRP — not branch quantities.
- **Stock** holds current quantities for `(branchId, batchId)` — one balance row per branch holding that lot.
- **StockMovement** is the append-only ledger recording every IN/OUT with `balanceAfter` and polymorphic reference.
- **StockAdjustment** + **StockAdjustmentItem** record manual corrections (damage, expiry, theft) with approval workflow.
- **StockTransfer** + **StockTransferItem** move stock between branches (OUT at source, IN at destination).
- **StockTake** + **StockTakeItem** capture physical counts; variances may generate adjustments.
- Stock quantities are never overwritten without a corresponding movement or ledger entry.
- Document numbers (`movementNumber`, `adjustmentNumber`, `transferNumber`) are unique within branch scope.

## Tables

- [[23_batch]] — org-global medicine lot identity.
- [[24_stock]] — per-branch stock balance for a batch.
- [[25_stock_movement]] — immutable inventory ledger.
- [[26_stock_adjustment]] — stock adjustment header.
- [[71_stock-adjustment-item]] — stock adjustment line items.
- [[27_stock_transfer]] — inter-branch transfer header.
- [[72_stock-transfer-item]] — stock transfer line items.
- [[28_stock_take]] — physical stock count session.
- [[29_stock_take_item]] — stock take counted lines.
