# Purchasing — Supplier Selection

## Purpose

Describe how suppliers are chosen when creating purchase orders and receipts. Supplier master data lives in the Supplier domain; Purchasing applies business rules for eligible vendors per branch, medicine, and compliance.

**Database reference:** [Purchase overview](../../database/tables/purchase/purchase.md) · Supplier tables in database catalog

## Responsibilities

- Validate supplier active and licensed for procurement
- Prefer default supplier per medicine where configured
- Enforce branch–supplier commercial relationships

## Scope

### In Scope

- Supplier picker on PO and GRN headers
- Default supplier from medicine or vendor contract tables (when present)
- Block PO to inactive/blacklisted suppliers

### Out of Scope

- Supplier onboarding KYC (Supplier domain)
- Price negotiation / RFQ (future)

## Related Entities

- `Supplier`, `Party`
- `Medicine` — may reference preferred supplier
- `PurchaseOrder`, `GoodsReceipt`
- `Branch`

## Business Rules

- PO `supplierId` required; must belong to same `companyId` as branch via tenant rules.
- Inactive supplier (`isActive = false`) cannot be selected on new PO.
- GRN `supplierId` must match linked PO supplier when `purchaseOrderId` set.
- Ad-hoc GRN without PO still requires valid supplier.
- Schedule X / controlled procurement may restrict supplier list (regulatory flag — future).
- Changing supplier on PO allowed only in `DRAFT`; after approval, cancel and recreate PO.

## Domain Events

- No dedicated supplier selection events; supplier captured on `PurchaseOrderCreated` / `GoodsReceiptCreated`.

## State Model

Supplier master uses active/inactive — not PO states.

## Integrations

- **Supplier domain:** Read supplier credit limit for PO block (future)
- **Reporting:** Spend by supplier from posted invoices

## Security

- Users see only suppliers scoped to their company.
- Hide commercial terms from users without purchasing role.

## Performance

- Supplier typeahead: search by name/code with limit 20; index supplier name.

## Future

- Approved vendor list (AVL) per medicine with rank
- Auto-suggest supplier from last GRN cost and lead time
- Integration with distributor API catalog
