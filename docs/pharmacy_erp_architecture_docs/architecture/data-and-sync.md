# Data & Sync

## Offline First

The local database is the **source of truth** during daily operation.

Users should never know whether the internet is available.

## Synchronization Strategy

### Delta Sync

Send only changed records. Never upload the whole database.

### Push

Local → Cloud

### Pull

Cloud → Local

### Background Sync

Runs:

- App Start
- Every few minutes
- Manual Sync
- Network Reconnect

### Outbox Pattern

Every change is recorded in an Outbox table.

Background worker processes:

1. Read outbox
2. Send to server
3. Mark success
4. Retry failures

This guarantees reliable delivery even after crashes.

Implemented contract: [Early foundations — Outbox sync](./early-foundations.md#outbox-sync-contract).

### Idempotency

Every transaction gets a unique UUID.

If the same request is received twice, the server safely ignores duplicates.

### Conflict Resolution

Different entities require different rules.

Examples:

- Inventory → Transaction-based, never overwrite stock.
- Customer details → Last write wins may be acceptable.
- Medicine master → Prefer server authority.

Keep version numbers or timestamps for conflict detection.

## Multi Store Architecture

The Pharmacy ERP supports multiple branches from the foundation of the data model.

### Core inventory model

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

### Branch-scoped operations

- Document numbers (`invoiceNumber`, `transferNumber`, `movementNumber`, etc.) are unique **within branch scope**, not globally.
- Sale pricing is branch-scoped via **PriceList** / **PriceListItem** — not on Batch.
- Sequence generators are company/branch scoped.

### Future capabilities

- Multiple branches
- Central procurement with branch distribution
- Branch-to-branch transfers
- Consolidated reporting across branches

Keep `branchId` in core transactional and inventory models from the beginning.

Tenant scoping in code: [Early foundations — Request context](./early-foundations.md#request-context-and-tenant-scoping).

## Related docs

- [Overview](./overview.md)
- [Persistence patterns](../database/persistence-patterns.md)
- [Architecture review](../database/architecture-review.md)
