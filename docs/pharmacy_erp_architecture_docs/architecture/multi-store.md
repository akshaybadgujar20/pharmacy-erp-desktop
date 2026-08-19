# Multi Store Architecture

> Source: Original Architecture Handbook

The Pharmacy ERP supports multiple branches from the foundation of the data model.

## Core inventory model

| Entity | Scope | Purpose |
|--------|-------|---------|
| **Batch** | Org-global | Lot identity: medicine + batch number + expiry + lot cost + statutory MRP |
| **Stock** | Per branch | Current quantities for `(branchId, batchId)` — one row per branch holding that lot |
| **StockMovement** | Per branch | Immutable ledger of IN/OUT at a branch |

```text
Medicine (org master)
    └── Batch (org-global lot)
            ├── Stock @ Branch A
            ├── Stock @ Branch B
            └── Stock @ Branch C
```

The same batch (e.g. lot B001 of Medicine X) can exist at multiple branches with independent quantities. Inter-branch movement uses **StockTransfer** (OUT at source, IN at destination).

## Branch-scoped operations

- Document numbers (`invoiceNumber`, `transferNumber`, `movementNumber`, etc.) are unique **within branch scope**, not globally.
- Sale pricing is branch-scoped via **PriceList** / **PriceListItem** — not on Batch.
- Sequence generators are company/branch scoped.

## Future capabilities

- Multiple branches
- Central procurement with branch distribution
- Branch-to-branch transfers
- Consolidated reporting across branches

Keep `branchId` in core transactional and inventory models from the beginning.
