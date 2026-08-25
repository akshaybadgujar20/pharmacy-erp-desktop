# Purchasing — Business Rules

## Purpose

Consolidated business rules for the procurement lifecycle from PO creation through GRN, supplier invoice, and return. Use this as the authoritative checklist for domain services and validation.

**Database reference:** [Purchase overview](../../database/tables/purchase/purchase.md)

## Responsibilities

- Single reference for cross-document rules
- Align domain docs with inventory and finance boundaries

## Scope

### In Scope

- All purchasing tables and status transitions
- Inventory creation on GRN only
- PO fulfillment math

### Out of Scope

- Detailed field validation (see [validation.md](./validation.md))
- API DTO shapes

## Related Entities

Full table list in [purchase.md](../../database/tables/purchase/purchase.md).

## Business Rules

### Document numbering

- All purchasing document numbers unique per branch (`purchaseOrderNumber`, `goodsReceiptNumber`, etc.).
- UUID is sync identity; never expose local id across devices.

### Purchase order

1. PO must have ≥1 line before submit/approve.
2. Status values: `DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `SENT_TO_SUPPLIER`, `PARTIALLY_RECEIVED`, `COMPLETED`, `FORCE_CLOSED`, `CANCELLED`.
3. PO create/edit requires `PURCHASE:PURCHASE_ORDER:CREATE`.
4. Inventory unchanged by PO alone.
5. Cancelled PO cannot receive GRNs.
6. `COMPLETED` when every line `receivedQuantity >= orderedQuantity` within tolerance.
7. `FORCE_CLOSED` closes remaining open qty with audit reason.

### Goods receipt

8. GRN post creates/updates **Batch** (org-global) and **Stock** at **branchId**.
9. GRN post creates IN **StockMovement** per line.
10. Multiple GRNs allowed per PO (partial delivery).
11. Posted GRN read-only; reversal via cancel workflow.
12. Batch number + expiry mandatory for pharmaceutical lines.
13. `purchaseRate` and `mrp` captured on batch at receipt — not sale price.

### Purchase invoice

14. Invoice post records AP; no stock change.
15. Prefer qty/cost match to GRN when linking enabled.
16. Duplicate supplier invoice number blocked per policy.

### Purchase return

17. Return post creates OUT stock movement.
18. Return qty ≤ branch available for batch.
19. Supplier credit tracked in Finance after return post.

### Cross-cutting

20. All posts: `UnitOfWork.run` — business + audit + outbox atomic.
21. Optimistic locking via `version` on concurrent edits.
22. Soft delete only on drafts; posted docs use cancel/reversal.
23. Tenant scope: all docs carry `branchId`; company via branch.

## Domain Events

Rules trigger events listed in [events.md](./events.md) — e.g. rule 8 → `GoodsReceiptPosted`.

## State Model

PO status drives fulfillment; GRN `POSTED` drives inventory. See [README.md](./README.md) diagrams.

## Integrations

- Inventory, Finance, Outbox, SequenceGenerator, Audit — see entity-specific docs.

## Security

- Branch isolation on every rule that reads/writes documents.
- Approval and force-close segregated permissions.

## Performance

- Roll up PO received qty from GRN items via SQL aggregate, not in-memory full history scan on every post.

## Future

- Automated PO generation from min/max stock rules
- Contract pricing enforcement on PO lines
