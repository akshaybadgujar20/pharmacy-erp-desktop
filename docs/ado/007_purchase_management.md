# Phase 7 — Purchase Management

## 1. Objective

Phase 7 implements the Pharmacy ERP Purchase domain.

The database overview defines Purchase as the procurement module with exactly these tables:

- `PurchaseOrder`
- `PurchaseOrderItem`
- `GoodsReceipt`
- `GoodsReceiptItem`
- `PurchaseInvoice`
- `PurchaseInvoiceItem`
- `PurchaseReturn`
- `PurchaseReturnItem`

The documented business relationship is:

```text
Purchase Order
      ↓
Goods Receipt
      ↓
Purchase Invoice
      ↓
Batch
      ↓
Stock
      ↓
Stock Movement
```

This relationship is explicitly shown in the database overview.

Purchase is therefore the domain that manages procurement from supplier ordering through receipt, purchase invoicing and purchase returns, while Inventory remains the owner of batch/stock state.

---

# 2. Important Boundary

## Purchase owns

```text
Supplier procurement
Purchase orders
Purchase order items
Goods receipts
Received quantities
Purchase invoices
Purchase invoice items
Purchase returns
Purchase return items
Purchase document lifecycle
Purchase document search
Purchase-specific validation
Purchase-to-inventory integration
Purchase audit
Purchase synchronization
```

## Inventory owns

```text
Batch
Stock
StockMovement
StockAdjustment
StockTransfer
StockTake
```

## Pricing owns later

```text
PriceList
PriceListItem
Tax
DiscountRule
```

## Financial owns later

```text
Payment
Receipt
Ledger
LedgerEntry
```

The database overview separates Purchase, Inventory, Pricing and Financial into independent functional modules.

---

# 3. Legacy-Informed Purchase Scope

The legacy application material shows a broad Purchase workflow including:

```text
Goods Receipt (Purchase Bill)
Goods Receipt (Purchase DM)
Goods Receipt (Replacement)

Opening Stock

Supplier Direct Credit Note Entry

Purchase Order
  - Order Placement
  - Order Reprinting
  - Send Order E-Mail / WhatsApp
  - Order Short List From Sale & Closing
  - Pending / Short Receipt Item

Expiry / Breakage / Return / Shortage

Purchase import

Batch operations

Purchase registers
Purchase analysis
Supplier-wise purchase reports
```

The detailed legacy Purchase Receipt UI also contains supplier, voucher number/date, D.M. information, medicine/product, packing, HSN, GST, batch, manufacturer, expiry, MRP, purchase rate, quantity, free quantity, discounts, taxable amount, IGST, CGST and SGST.

These legacy capabilities are used as **functional reference points**, not as a reason to reproduce the old data model literally.

---

# 4. Architecture

The project architecture requires:

```text
Angular
   ↓
NestJS
   ↓
DTO
   ↓
Validation
   ↓
Service
   ↓
Prisma
   ↓
SQLite
```

Controllers remain thin and business rules remain in services.

The application is offline-first:

```text
Local SQLite
      ↓
Purchase operation
      ↓
Transaction
      ↓
Outbox
      ↓
Cloud Sync
```

The architecture also defines:

- delta synchronization
- push/pull synchronization
- background sync
- Outbox
- idempotency using UUID
- conflict detection using version/timestamps
- event-driven communication

---

# 5. ADO Hierarchy

```text
EPIC-007 — Purchase Management
│
├── FEAT-080 — Purchase Domain & Data Model
├── FEAT-081 — Purchase Order Management
├── FEAT-082 — Purchase Order Item & Supplier Ordering
├── FEAT-083 — Goods Receipt Management
├── FEAT-084 — Goods Receipt Item & Batch Capture
├── FEAT-085 — Purchase Invoice Management
├── FEAT-086 — Purchase Invoice Calculation & Validation
├── FEAT-087 — Purchase Return Management
├── FEAT-088 — Purchase Document Lifecycle
├── FEAT-089 — Purchase Search, History & Supplier Analysis
├── FEAT-090 — Purchase-to-Inventory Integration
├── FEAT-091 — Purchase Authorization, Audit & Controls
├── FEAT-092 — Purchase API & NestJS Services
├── FEAT-093 — Purchase Angular UI & Keyboard Workflow
├── FEAT-094 — Offline-First Purchase & Synchronization
└── FEAT-095 — Purchase Testing, Performance & Readiness
```

---

# 6. Epic

## EPIC-007 — Purchase Management

### Description

Build the procurement subsystem of the Pharmacy ERP covering supplier ordering, goods receipt, purchase invoicing and purchase returns while integrating safely with Inventory.

### Business Value

Purchase must provide a reliable procurement lifecycle:

```text
Supplier
   ↓
Purchase Order
   ↓
Goods Receipt
   ↓
Purchase Invoice
   ↓
Batch
   ↓
Stock
```

and, when required:

```text
Stock
   ↓
Purchase Return
   ↓
Supplier
```

### Epic Completion Criteria

- Purchase schema is implemented.
- Purchase Order workflow is implemented.
- Purchase Order items are implemented.
- Goods Receipt workflow is implemented.
- Goods Receipt items are implemented.
- Purchase Invoice workflow is implemented.
- Purchase Invoice items are implemented.
- Purchase Return workflow is implemented.
- Purchase Return items are implemented.
- Supplier integration is implemented.
- Inventory integration is atomic.
- Batch information can be captured during receipt.
- Stock movement is generated through Inventory services.
- Duplicate processing is prevented.
- Purchase authorization is enforced in backend.
- Audit history exists.
- Offline operations are Outbox-aware.
- Synchronization is idempotent.
- Tests cover major purchase workflows.
- SQLite/PostgreSQL compatibility is verified.

---

# 7. FEAT-080 — Purchase Domain & Data Model

## US-207 — Finalize Purchase domain model

### Acceptance Criteria

1. All eight Purchase tables are represented.
2. Relationships between header and item tables are explicit.
3. Supplier relationships are explicit.
4. Purchase Order → Goods Receipt relationship is explicit.
5. Goods Receipt → Purchase Invoice relationship is explicit.
6. Purchase Return relationships are explicit.
7. Inventory integration references are explicit.
8. Standard database conventions are followed.

### Tasks

- TASK-001 — Review PurchaseOrder specification.
- TASK-002 — Review PurchaseOrderItem specification.
- TASK-003 — Review GoodsReceipt specification.
- TASK-004 — Review GoodsReceiptItem specification.
- TASK-005 — Review PurchaseInvoice specification.
- TASK-006 — Review PurchaseInvoiceItem specification.
- TASK-007 — Review PurchaseReturn specification.
- TASK-008 — Review PurchaseReturnItem specification.
- TASK-009 — Define header/item relationships.
- TASK-010 — Define Supplier relationship.
- TASK-011 — Define PurchaseOrder → GoodsReceipt relationship.
- TASK-012 — Define GoodsReceipt → PurchaseInvoice relationship.
- TASK-013 — Define return relationships.
- TASK-014 — Define Inventory integration references.
- TASK-015 — Define document numbering strategy.
- TASK-016 — Define document status strategy.
- TASK-017 — Define cancellation rules.
- TASK-018 — Define soft-delete behavior.
- TASK-019 — Define optimistic-locking behavior.
- TASK-020 — Define synchronization identity.
- TASK-021 — Implement Prisma PurchaseOrder model.
- TASK-022 — Implement Prisma PurchaseOrderItem model.
- TASK-023 — Implement Prisma GoodsReceipt model.
- TASK-024 — Implement Prisma GoodsReceiptItem model.
- TASK-025 — Implement Prisma PurchaseInvoice model.
- TASK-026 — Implement Prisma PurchaseInvoiceItem model.
- TASK-027 — Implement Prisma PurchaseReturn model.
- TASK-028 — Implement Prisma PurchaseReturnItem model.
- TASK-029 — Add foreign keys.
- TASK-030 — Add unique constraints.
- TASK-031 — Add indexes.
- TASK-032 — Add createdAt/updatedAt fields where applicable.
- TASK-033 — Add deletedAt where applicable.
- TASK-034 — Add version fields where required.
- TASK-035 — Create Prisma migration.
- TASK-036 — Validate SQLite migration.
- TASK-037 — Validate PostgreSQL compatibility.

---

# 8. FEAT-081 — Purchase Order Management

## US-208 — Create Purchase Order

### Acceptance Criteria

1. Authorized user can create a Purchase Order.
2. Supplier is mandatory.
3. Order date is validated.
4. At least one item is required.
5. Item quantity is positive.
6. Medicine references are valid.
7. Order totals are calculated correctly.
8. Draft orders can be saved before final submission.
9. Order receives a unique business reference.
10. Creation is audited.
11. Creation is synchronization-aware.

### Tasks

- TASK-038 — Define Purchase Order status model.
- TASK-039 — Define draft behavior.
- TASK-040 — Define supplier validation.
- TASK-041 — Define order date validation.
- TASK-042 — Define item validation.
- TASK-043 — Define quantity validation.
- TASK-044 — Define order numbering.
- TASK-045 — Define order total calculation.
- TASK-046 — Create PurchaseOrder DTO.
- TASK-047 — Create PurchaseOrderItem DTO.
- TASK-048 — Implement DTO validation.
- TASK-049 — Implement PurchaseOrderService.
- TASK-050 — Implement create transaction.
- TASK-051 — Implement order number generation.
- TASK-052 — Implement API endpoint.
- TASK-053 — Add authorization guard.
- TASK-054 — Add audit event.
- TASK-055 — Add Outbox event.
- TASK-056 — Add unit tests.
- TASK-057 — Add integration tests.

---

## US-209 — Add and manage Purchase Order items

### Acceptance Criteria

1. User can add medicine items.
2. User can modify item quantities before submission.
3. User can remove items before submission.
4. Duplicate medicine lines are handled according to defined rules.
5. Supplier-specific ordering information is preserved where required.
6. Totals recalculate after every change.

### Tasks

- TASK-058 — Implement item lookup.
- TASK-059 — Implement item insertion.
- TASK-060 — Implement item update.
- TASK-061 — Implement item deletion.
- TASK-062 — Implement duplicate-line rule.
- TASK-063 — Implement quantity validation.
- TASK-064 — Implement line calculation.
- TASK-065 — Implement header total recalculation.
- TASK-066 — Add tests.

---

## US-210 — Submit Purchase Order

### Acceptance Criteria

1. Draft order can be submitted.
2. Invalid/incomplete orders cannot be submitted.
3. Submitted order becomes controlled against unauthorized changes.
4. Submission is audited.
5. Submission produces a synchronization event.

### Tasks

- TASK-067 — Implement submission validation.
- TASK-068 — Implement submit service.
- TASK-069 — Implement status transition.
- TASK-070 — Implement submit API.
- TASK-071 — Implement backend authorization.
- TASK-072 — Add audit.
- TASK-073 — Add Outbox event.
- TASK-074 — Add tests.

---

## US-211 — Modify/cancel Purchase Order

### Tasks

- TASK-075 — Define editable states.
- TASK-076 — Define cancellation rules.
- TASK-077 — Validate already-received quantities.
- TASK-078 — Prevent invalid modification.
- TASK-079 — Implement update service.
- TASK-080 — Implement cancel service.
- TASK-081 — Implement APIs.
- TASK-082 — Add audit.
- TASK-083 — Add tests.

---

# 9. FEAT-082 — Purchase Order Item & Supplier Ordering

## US-212 — Generate order suggestions from stock

The legacy application includes:

```text
Order Short List From Sale & Closing
Update Stock Below Minimum Level
```

and order-placement information such as closing stock, minimum stock, previous stock/sales information, manufacturer, quantity and value.

This should be implemented only to the extent supported by the finalized modern Inventory/Master model.

### Tasks

- TASK-084 — Define replenishment inputs.
- TASK-085 — Define minimum stock source.
- TASK-086 — Define current stock source.
- TASK-087 — Define sales-history dependency.
- TASK-088 — Define suggested quantity calculation.
- TASK-089 — Define supplier selection.
- TASK-090 — Implement replenishment query.
- TASK-091 — Implement suggested-order service.
- TASK-092 — Implement API.
- TASK-093 — Add tests.

---

## US-213 — Create Purchase Order from suggested items

### Tasks

- TASK-094 — Build suggested-item UI.
- TASK-095 — Add supplier filter.
- TASK-096 — Add Medicine filter.
- TASK-097 — Show current stock.
- TASK-098 — Show minimum stock where available.
- TASK-099 — Show suggested quantity.
- TASK-100 — Allow item selection.
- TASK-101 — Create Purchase Order from selection.
- TASK-102 — Add validation.
- TASK-103 — Add tests.

---

## US-214 — Purchase Order reprint and sharing

Legacy Purchase includes order reprinting and sending orders by E-Mail/WhatsApp.

### Tasks

- TASK-104 — Implement order print view.
- TASK-105 — Implement print-ready format.
- TASK-106 — Implement reprint API.
- TASK-107 — Add permission check.
- TASK-108 — Define outbound sharing abstraction.
- TASK-109 — Prepare email integration contract.
- TASK-110 — Prepare WhatsApp integration contract.
- TASK-111 — Add audit event.
- TASK-112 — Add tests.

---

## US-215 — Track pending and short receipts

The legacy workflow includes:

```text
Order Placed
Pending / Short Receipt Item
```

### Tasks

- TASK-113 — Define ordered quantity.
- TASK-114 — Define received quantity.
- TASK-115 — Define pending quantity.
- TASK-116 — Define short-receipt calculation.
- TASK-117 — Implement pending-order query.
- TASK-118 — Implement short-receipt query.
- TASK-119 — Implement API.
- TASK-120 — Implement UI.
- TASK-121 — Add tests.

---

# 10. FEAT-083 — Goods Receipt Management

## US-216 — Create Goods Receipt

The database defines GoodsReceipt and GoodsReceiptItem as core Purchase tables.

Legacy Purchase shows Goods Receipt as a central purchase workflow, including Purchase Bill, Purchase DM and Replacement variants.

### Acceptance Criteria

1. Supplier is identified.
2. Voucher/document number is captured.
3. Voucher date is captured.
4. Receipt items are validated.
5. Batch and expiry can be captured where applicable.
6. Quantity is validated.
7. Free quantity is supported if part of the finalized schema.
8. Receipt can be linked to Purchase Order.
9. Receipt can be linked to supplier documentation.
10. Inventory is updated only through controlled Inventory operations.
11. The receipt and inventory changes are atomic.
12. Receipt creation is audited.
13. Receipt is synchronization-aware.

### Tasks

- TASK-122 — Define Goods Receipt lifecycle.
- TASK-123 — Define Purchase Order linkage.
- TASK-124 — Define supplier document linkage.
- TASK-125 — Define receipt variants.
- TASK-126 — Define voucher numbering.
- TASK-127 — Define receipt-date rules.
- TASK-128 — Define receipt quantity rules.
- TASK-129 — Define free quantity behavior.
- TASK-130 — Define partial receipt behavior.
- TASK-131 — Define receipt cancellation rules.
- TASK-132 — Create GoodsReceipt DTO.
- TASK-133 — Create GoodsReceiptItem DTO.
- TASK-134 — Add DTO validation.
- TASK-135 — Implement GoodsReceiptService.
- TASK-136 — Implement create transaction.
- TASK-137 — Implement API.
- TASK-138 — Add authorization.
- TASK-139 — Add audit.
- TASK-140 — Add Outbox event.
- TASK-141 — Add tests.

---

## US-217 — Receive against Purchase Order

### Acceptance Criteria

1. User can select an existing Purchase Order.
2. Ordered items are available for selection.
3. Already-received quantity is shown.
4. Pending quantity is calculated.
5. Receipt quantity cannot exceed allowed quantity unless explicitly permitted.
6. Partial receipt is supported.
7. Short receipt is recorded.
8. Purchase Order status is updated.

### Tasks

- TASK-142 — Implement order lookup.
- TASK-143 — Load order items.
- TASK-144 — Calculate previously received quantity.
- TASK-145 — Calculate pending quantity.
- TASK-146 — Validate receipt quantity.
- TASK-147 — Implement partial receipt.
- TASK-148 — Implement short receipt.
- TASK-149 — Update Purchase Order status.
- TASK-150 — Add transaction handling.
- TASK-151 — Add tests.

---

# 11. FEAT-084 — Goods Receipt Item & Batch Capture

## US-218 — Capture received medicine details

Legacy Product Received information includes:

```text
Product
Product Name
Packing
Shelf
HSN Code
GST %
Batch No.
Manufacturer
Expiry Date
MRP
Purchase Rate
Pack
Quantity
Free
Value
Product Discount
Special Discount
Cash Discount
Taxable
IGST
CGST
SGST
Current Stock
Drug Contents
```

Only fields represented in the approved modern schema should be implemented.

### Tasks

- TASK-152 — Map legacy receipt fields to modern model.
- TASK-153 — Identify fields owned by Medicine Master.
- TASK-154 — Identify fields owned by Inventory.
- TASK-155 — Identify fields owned by Pricing.
- TASK-156 — Identify fields owned by Purchase.
- TASK-157 — Finalize GoodsReceiptItem fields.
- TASK-158 — Implement item DTO.
- TASK-159 — Implement item validation.
- TASK-160 — Implement item persistence.
- TASK-161 — Add tests.

---

## US-219 — Create/update Batch during receipt

### Acceptance Criteria

1. New batch can be created when permitted.
2. Existing batch can be identified.
3. Medicine/batch relationship is validated.
4. Expiry is validated.
5. MRP and purchase-specific information are handled according to ownership.
6. Batch creation and receipt processing are transaction-safe.
7. Inventory Batch service remains the owner of Batch lifecycle.

### Tasks

- TASK-162 — Define new/existing batch behavior.
- TASK-163 — Implement batch lookup.
- TASK-164 — Implement batch creation request.
- TASK-165 — Validate medicine.
- TASK-166 — Validate batch identity.
- TASK-167 — Validate expiry.
- TASK-168 — Integrate Inventory BatchService.
- TASK-169 — Prevent duplicate batch creation.
- TASK-170 — Add transaction handling.
- TASK-171 — Add tests.

---

## US-220 — Validate purchase receipt quantities

### Tasks

- TASK-172 — Validate positive quantity.
- TASK-173 — Validate free quantity.
- TASK-174 — Validate total quantity.
- TASK-175 — Validate ordered quantity.
- TASK-176 — Validate returned/rejected quantity where applicable.
- TASK-177 — Validate batch-level quantities.
- TASK-178 — Add unit tests.
- TASK-179 — Add integration tests.

---

# 12. FEAT-085 — Purchase Invoice Management

## US-221 — Create Purchase Invoice

The database overview explicitly places Purchase Invoice after Goods Receipt.

### Acceptance Criteria

1. Supplier is identified.
2. Supplier invoice number is captured.
3. Invoice date is validated.
4. Invoice can reference Goods Receipt.
5. Invoice items are validated.
6. Totals are calculated.
7. Tax/discount information is handled according to finalized ownership.
8. Duplicate supplier invoice detection is implemented according to business rules.
9. Invoice creation is audited.
10. Invoice is synchronization-aware.

### Tasks

- TASK-180 — Define Purchase Invoice lifecycle.
- TASK-181 — Define supplier invoice number rules.
- TASK-182 — Define duplicate invoice rules.
- TASK-183 — Define Goods Receipt linkage.
- TASK-184 — Define invoice date rules.
- TASK-185 — Define invoice status.
- TASK-186 — Define invoice cancellation.
- TASK-187 — Create PurchaseInvoice DTO.
- TASK-188 — Create PurchaseInvoiceItem DTO.
- TASK-189 — Add validation.
- TASK-190 — Implement PurchaseInvoiceService.
- TASK-191 — Implement create API.
- TASK-192 — Add authorization.
- TASK-193 — Add audit.
- TASK-194 — Add Outbox event.
- TASK-195 — Add tests.

---

## US-222 — Match Purchase Invoice with Goods Receipt

### Acceptance Criteria

1. Invoice can be matched against received items.
2. Received quantities are visible.
3. Invoiced quantities are visible.
4. Mismatches are detected.
5. Business-approved tolerance rules can be applied.
6. Invoice cannot be finalized when required matching rules fail.

### Tasks

- TASK-196 — Define matching rules.
- TASK-197 — Define quantity mismatch handling.
- TASK-198 — Define price mismatch handling.
- TASK-199 — Define tax mismatch handling.
- TASK-200 — Define tolerance rules.
- TASK-201 — Implement matching service.
- TASK-202 — Implement mismatch response.
- TASK-203 — Implement API.
- TASK-204 — Implement UI validation.
- TASK-205 — Add tests.

---

# 13. FEAT-086 — Purchase Invoice Calculation & Validation

## US-223 — Calculate purchase totals

### Calculation components

Where supported by the final schema:

```text
Line Quantity
×
Purchase Rate
=
Line Value

Line Value
-
Product Discount
-
Special Discount
-
Cash Discount
=
Taxable Value

Taxable Value
+
IGST / CGST / SGST
+
Other Charges
±
Rounding
=
Net Purchase Amount
```

The legacy receipt screen explicitly contains product/special/cash discount, taxable value, IGST, CGST, SGST, other +/- and rounding concepts.

The final tax and discount ownership must remain aligned with the separate Pricing module.

### Tasks

- TASK-206 — Define line-value calculation.
- TASK-207 — Define discount calculation.
- TASK-208 — Define taxable calculation.
- TASK-209 — Define tax calculation contract.
- TASK-210 — Define other charge handling.
- TASK-211 — Define rounding behavior.
- TASK-212 — Define net amount calculation.
- TASK-213 — Implement calculation service.
- TASK-214 — Implement backend recalculation.
- TASK-215 — Prevent client-side total tampering.
- TASK-216 — Add unit tests.
- TASK-217 — Add boundary tests.

---

## US-224 — Validate purchase financial values

### Tasks

- TASK-218 — Validate rate.
- TASK-219 — Validate quantity.
- TASK-220 — Validate discount.
- TASK-221 — Validate tax.
- TASK-222 — Validate taxable amount.
- TASK-223 — Validate net amount.
- TASK-224 — Validate rounding.
- TASK-225 — Detect inconsistent client totals.
- TASK-226 — Add tests.

---

# 14. FEAT-087 — Purchase Return Management

## US-225 — Create Purchase Return

The database defines PurchaseReturn and PurchaseReturnItem.

Legacy workflows include:

```text
Expiry / Breakage / Return / Shortage
Purchase Return Register
Supplier-wise Purchase Return
Direct Credit Note
Debit Note / Claim
Outward Invoice
```

The modern implementation should keep the core Purchase Return domain separate from reporting/financial posting.

### Acceptance Criteria

1. Supplier is identified.
2. Return source is identified where required.
3. Medicine/batch is identified.
4. Return quantity is validated.
5. Returned quantity cannot exceed eligible quantity.
6. Return reason is captured where required.
7. Inventory reduction is generated through Inventory services.
8. Stock movement is generated.
9. Return is auditable.
10. Return is idempotent.

### Tasks

- TASK-227 — Define Purchase Return lifecycle.
- TASK-228 — Define return reasons.
- TASK-229 — Define eligible stock rules.
- TASK-230 — Define source-document rules.
- TASK-231 — Define supplier return rules.
- TASK-232 — Define expiry/breakage/shortage handling.
- TASK-233 — Create PurchaseReturn DTO.
- TASK-234 — Create PurchaseReturnItem DTO.
- TASK-235 — Add validation.
- TASK-236 — Implement PurchaseReturnService.
- TASK-237 — Implement create API.
- TASK-238 — Add authorization.
- TASK-239 — Add audit.
- TASK-240 — Add Outbox event.
- TASK-241 — Add tests.

---

## US-226 — Return against received stock

### Tasks

- TASK-242 — Implement batch lookup.
- TASK-243 — Load eligible stock.
- TASK-244 — Calculate returnable quantity.
- TASK-245 — Validate return quantity.
- TASK-246 — Validate locked batch behavior.
- TASK-247 — Validate expired stock behavior.
- TASK-248 — Implement Inventory stock deduction.
- TASK-249 — Generate StockMovement.
- TASK-250 — Update Purchase Return.
- TASK-251 — Add transaction handling.
- TASK-252 — Add tests.

---

## US-227 — Handle expiry/breakage/shortage purchase return

### Tasks

- TASK-253 — Define reason catalog.
- TASK-254 — Define supplier claim behavior.
- TASK-255 — Define replacement behavior.
- TASK-256 — Define debit-note/claim integration boundary.
- TASK-257 — Implement reason validation.
- TASK-258 — Implement return workflow.
- TASK-259 — Add UI reason selection.
- TASK-260 — Add tests.

---

# 15. FEAT-088 — Purchase Document Lifecycle

## US-228 — Define Purchase statuses

Recommended lifecycle patterns must be validated against the finalized schema:

### Purchase Order

```text
Draft
   ↓
Submitted
   ↓
Partially Received
   ↓
Fully Received
   ↓
Closed
```

with controlled cancellation where permitted.

### Goods Receipt

```text
Draft
   ↓
Posted
   ↓
Cancelled / Reversed
```

### Purchase Invoice

```text
Draft
   ↓
Posted
   ↓
Cancelled
```

### Purchase Return

```text
Draft
   ↓
Posted
   ↓
Cancelled / Reversed
```

### Tasks

- TASK-261 — Finalize Purchase Order statuses.
- TASK-262 — Finalize Goods Receipt statuses.
- TASK-263 — Finalize Purchase Invoice statuses.
- TASK-264 — Finalize Purchase Return statuses.
- TASK-265 — Define valid transitions.
- TASK-266 — Define invalid transitions.
- TASK-267 — Implement lifecycle service.
- TASK-268 — Implement transition validation.
- TASK-269 — Add API guards.
- TASK-270 — Add tests.

---

## US-229 — Prevent invalid document modification

### Tasks

- TASK-271 — Define immutable states.
- TASK-272 — Define editable fields by status.
- TASK-273 — Define reversal strategy.
- TASK-274 — Prevent modification after stock posting where required.
- TASK-275 — Prevent modification after downstream financial posting where required.
- TASK-276 — Implement optimistic locking.
- TASK-277 — Add conflict response.
- TASK-278 — Add tests.

---

# 16. FEAT-089 — Purchase Search, History & Supplier Analysis

## US-230 — Purchase Order search

### Tasks

- TASK-279 — Implement order search.
- TASK-280 — Search by order number.
- TASK-281 — Search by supplier.
- TASK-282 — Search by date range.
- TASK-283 — Search by status.
- TASK-284 — Search by Medicine.
- TASK-285 — Add pagination.
- TASK-286 — Add sorting.
- TASK-287 — Implement API.
- TASK-288 — Implement UI.
- TASK-289 — Add tests.

---

## US-231 — Goods Receipt search

### Tasks

- TASK-290 — Implement receipt search.
- TASK-291 — Search by voucher number.
- TASK-292 — Search by supplier.
- TASK-293 — Search by date.
- TASK-294 — Search by Purchase Order.
- TASK-295 — Search by Medicine.
- TASK-296 — Search by Batch.
- TASK-297 — Search by receipt status.
- TASK-298 — Add pagination.
- TASK-299 — Implement API.
- TASK-300 — Implement UI.
- TASK-301 — Add tests.

---

## US-232 — Purchase Invoice history

### Tasks

- TASK-302 — Implement invoice search.
- TASK-303 — Search by supplier.
- TASK-304 — Search by supplier invoice number.
- TASK-305 — Search by ERP invoice number.
- TASK-306 — Search by date.
- TASK-307 — Search by Goods Receipt.
- TASK-308 — Search by status.
- TASK-309 — Add pagination.
- TASK-310 — Implement API.
- TASK-311 — Implement UI.
- TASK-312 — Add tests.

---

## US-233 — Purchase Return history

### Tasks

- TASK-313 — Implement return search.
- TASK-314 — Search by supplier.
- TASK-315 — Search by date.
- TASK-316 — Search by Batch.
- TASK-317 — Search by reason.
- TASK-318 — Search by source document.
- TASK-319 — Add pagination.
- TASK-320 — Implement API.
- TASK-321 — Implement UI.
- TASK-322 — Add tests.

---

## US-234 — Purchase history for Medicine/Batch

The legacy Product Received screen includes Purchase History showing:

```text
Voucher Date
Voucher No.
Bill No.
Batch No.
MRP
Purchase Rate
Pack
Quantity
Free
Supplier
```

### Tasks

- TASK-323 — Define purchase-history query.
- TASK-324 — Implement Medicine history.
- TASK-325 — Implement Batch history.
- TASK-326 — Add supplier filter.
- TASK-327 — Add date filter.
- TASK-328 — Add pagination.
- TASK-329 — Implement API.
- TASK-330 — Implement reusable UI component.
- TASK-331 — Add tests.

---

# 17. FEAT-090 — Purchase-to-Inventory Integration

## US-235 — Receive purchase into inventory

This is one of the most important integration stories.

### Required flow

```text
Goods Receipt
      ↓
Validate receipt
      ↓
Create/find Batch
      ↓
Increase Stock
      ↓
Create StockMovement
      ↓
Audit
      ↓
Outbox
```

### Acceptance Criteria

1. Purchase does not directly modify stock tables.
2. Inventory service owns stock mutation.
3. Batch creation is controlled by Inventory.
4. Stock and movement update occur atomically.
5. Duplicate receipt processing does not duplicate stock.
6. Failed inventory update rolls back the purchase transaction.
7. Audit event is generated.

### Tasks

- TASK-332 — Define Purchase → Inventory contract.
- TASK-333 — Define Batch creation contract.
- TASK-334 — Define stock-increase contract.
- TASK-335 — Define StockMovement contract.
- TASK-336 — Implement PurchaseInventoryService.
- TASK-337 — Integrate Inventory BatchService.
- TASK-338 — Integrate Inventory StockService.
- TASK-339 — Integrate Inventory StockMovementService.
- TASK-340 — Wrap operation in transaction.
- TASK-341 — Implement idempotency.
- TASK-342 — Add audit integration.
- TASK-343 — Add Outbox integration.
- TASK-344 — Add integration tests.
- TASK-345 — Add rollback tests.

---

## US-236 — Return purchase stock from inventory

### Required flow

```text
Purchase Return
      ↓
Validate eligible stock
      ↓
Decrease Stock
      ↓
Create StockMovement
      ↓
Audit
      ↓
Outbox
```

### Tasks

- TASK-346 — Define Purchase Return → Inventory contract.
- TASK-347 — Implement returnable-stock lookup.
- TASK-348 — Validate stock.
- TASK-349 — Integrate Inventory StockService.
- TASK-350 — Integrate StockMovementService.
- TASK-351 — Wrap transaction.
- TASK-352 — Implement idempotency.
- TASK-353 — Add audit.
- TASK-354 — Add Outbox event.
- TASK-355 — Add tests.

---

## US-237 — Prevent duplicate stock posting

### Acceptance Criteria

A Goods Receipt or Purchase Return must never cause duplicate inventory changes because of:

- double click
- retry
- application restart
- synchronization replay
- API retry
- duplicate message

### Tasks

- TASK-356 — Define posting idempotency key.
- TASK-357 — Store source transaction UUID.
- TASK-358 — Implement duplicate detection.
- TASK-359 — Implement safe replay.
- TASK-360 — Add UI duplicate-submit prevention.
- TASK-361 — Add backend duplicate-submit protection.
- TASK-362 — Add tests.

---

# 18. FEAT-091 — Purchase Authorization, Audit & Controls

## US-238 — Define Purchase permissions

Recommended permission catalog:

```text
Purchase.View

Purchase.Order.View
Purchase.Order.Create
Purchase.Order.Update
Purchase.Order.Submit
Purchase.Order.Cancel
Purchase.Order.Print

Purchase.GoodsReceipt.View
Purchase.GoodsReceipt.Create
Purchase.GoodsReceipt.Update
Purchase.GoodsReceipt.Post
Purchase.GoodsReceipt.Cancel

Purchase.Invoice.View
Purchase.Invoice.Create
Purchase.Invoice.Update
Purchase.Invoice.Post
Purchase.Invoice.Cancel

Purchase.Return.View
Purchase.Return.Create
Purchase.Return.Post
Purchase.Return.Cancel

Purchase.Import
Purchase.History.View
```

### Tasks

- TASK-363 — Finalize Purchase permission catalog.
- TASK-364 — Seed permissions.
- TASK-365 — Map permissions to roles.
- TASK-366 — Implement backend guards.
- TASK-367 — Implement frontend permission visibility.
- TASK-368 — Test unauthorized Purchase Order creation.
- TASK-369 — Test unauthorized receipt posting.
- TASK-370 — Test unauthorized invoice posting.
- TASK-371 — Test unauthorized return.
- TASK-372 — Test unauthorized cancellation.

---

## US-239 — Audit Purchase operations

### Audit events

```text
PurchaseOrderCreated
PurchaseOrderUpdated
PurchaseOrderSubmitted
PurchaseOrderCancelled

GoodsReceiptCreated
GoodsReceiptUpdated
GoodsReceiptPosted
GoodsReceiptCancelled

PurchaseInvoiceCreated
PurchaseInvoiceUpdated
PurchaseInvoicePosted
PurchaseInvoiceCancelled

PurchaseReturnCreated
PurchaseReturnPosted
PurchaseReturnCancelled

PurchaseInventoryPosted
PurchaseInventoryReversed
```

### Tasks

- TASK-373 — Define Purchase audit taxonomy.
- TASK-374 — Implement Purchase Order audit.
- TASK-375 — Implement Goods Receipt audit.
- TASK-376 — Implement Purchase Invoice audit.
- TASK-377 — Implement Purchase Return audit.
- TASK-378 — Audit stock-affecting Purchase operations.
- TASK-379 — Capture actor.
- TASK-380 — Capture source document.
- TASK-381 — Capture transaction UUID.
- TASK-382 — Add tests.

---

# 19. FEAT-092 — Purchase API & NestJS Services

## US-240 — Implement Purchase REST APIs

### Suggested API surface

```text
GET    /purchase/orders
POST   /purchase/orders
GET    /purchase/orders/{id}
PUT    /purchase/orders/{id}
POST   /purchase/orders/{id}/submit
POST   /purchase/orders/{id}/cancel

GET    /purchase/goods-receipts
POST   /purchase/goods-receipts
GET    /purchase/goods-receipts/{id}
PUT    /purchase/goods-receipts/{id}
POST   /purchase/goods-receipts/{id}/post
POST   /purchase/goods-receipts/{id}/cancel

GET    /purchase/invoices
POST   /purchase/invoices
GET    /purchase/invoices/{id}
PUT    /purchase/invoices/{id}
POST   /purchase/invoices/{id}/post
POST   /purchase/invoices/{id}/cancel

GET    /purchase/returns
POST   /purchase/returns
GET    /purchase/returns/{id}
POST   /purchase/returns/{id}/post
POST   /purchase/returns/{id}/cancel

GET    /purchase/history/medicine/{medicineId}
GET    /purchase/history/batch/{batchId}
```

### Tasks

- TASK-383 — Define Purchase API conventions.
- TASK-384 — Define request DTOs.
- TASK-385 — Define response DTOs.
- TASK-386 — Define pagination.
- TASK-387 — Define filtering.
- TASK-388 — Define sorting.
- TASK-389 — Define standard error responses.
- TASK-390 — Implement PurchaseOrderController.
- TASK-391 — Implement GoodsReceiptController.
- TASK-392 — Implement PurchaseInvoiceController.
- TASK-393 — Implement PurchaseReturnController.
- TASK-394 — Implement PurchaseHistoryController.
- TASK-395 — Add API documentation.
- TASK-396 — Add API integration tests.

---

## US-241 — Implement Purchase domain services

### Tasks

- TASK-397 — Implement PurchaseOrderService.
- TASK-398 — Implement GoodsReceiptService.
- TASK-399 — Implement PurchaseInvoiceService.
- TASK-400 — Implement PurchaseReturnService.
- TASK-401 — Implement PurchaseCalculationService.
- TASK-402 — Implement PurchaseValidationService.
- TASK-403 — Implement PurchaseInventoryService.
- TASK-404 — Implement PurchaseQueryService.
- TASK-405 — Implement PurchaseLifecycleService.
- TASK-406 — Implement PurchaseAuditService integration.
- TASK-407 — Add unit tests.

---

# 20. FEAT-093 — Purchase Angular UI & Keyboard Workflow

The architecture requires feature-oriented Angular modules and a workflow-driven, keyboard-friendly ERP.

Recommended module:

```text
purchase/
├── orders/
├── goods-receipts/
├── invoices/
├── returns/
├── history/
├── components/
└── services/
```

## US-242 — Purchase dashboard

### Dashboard

```text
Open Purchase Orders
Pending Receipts
Short Receipts
Recent Goods Receipts
Pending Purchase Invoices
Recent Purchase Returns
```

### Tasks

- TASK-408 — Create Purchase route.
- TASK-409 — Create Purchase dashboard.
- TASK-410 — Create summary cards.
- TASK-411 — Add pending-order count.
- TASK-412 — Add pending-receipt count.
- TASK-413 — Add recent receipt list.
- TASK-414 — Add permission-aware visibility.
- TASK-415 — Add loading/error states.
- TASK-416 — Add tests.

---

## US-243 — Purchase Order UI

### Screen structure

```text
Supplier
Order Date
Order Number
Status

Order Items Grid
----------------------------
Medicine
Pack
Current Stock
Suggested Qty
Order Qty
Supplier
Value

Totals

Save
Submit
Print
Close
```

### Tasks

- TASK-417 — Create Purchase Order list.
- TASK-418 — Create Purchase Order form.
- TASK-419 — Supplier lookup.
- TASK-420 — Medicine lookup.
- TASK-421 — Item grid.
- TASK-422 — Add item.
- TASK-423 — Edit item.
- TASK-424 — Delete item.
- TASK-425 — Suggested quantity support.
- TASK-426 — Total calculation display.
- TASK-427 — Draft save.
- TASK-428 — Submit workflow.
- TASK-429 — Cancel workflow.
- TASK-430 — Print workflow.
- TASK-431 — Add keyboard navigation.
- TASK-432 — Add tests.

---

## US-244 — Goods Receipt UI

### Screen structure

Based on the legacy workflow:

```text
Supplier
View Ledger
Add Temporary Purchase
Add Order

Voucher No.
Voucher Date
Supplier Document No./Date

Purchase Items
--------------------------------------
Product
Pack
Manufacturer
Batch
Expiry
Quantity
Free
MRP
Purchase Rate
Value
Discount
Tax

Summary
--------------------------------------
Gross
Discount
Tax
Other +/-
Rounding
Net Amount

Save
Cancel
```

### Tasks

- TASK-433 — Create Goods Receipt list.
- TASK-434 — Create Goods Receipt form.
- TASK-435 — Supplier lookup.
- TASK-436 — Purchase Order lookup.
- TASK-437 — Add order items.
- TASK-438 — Medicine lookup.
- TASK-439 — Batch lookup.
- TASK-440 — Batch creation workflow.
- TASK-441 — Expiry input.
- TASK-442 — Quantity input.
- TASK-443 — Free quantity input.
- TASK-444 — MRP input.
- TASK-445 — Purchase rate input.
- TASK-446 — Discount input.
- TASK-447 — Tax display/input according to Pricing contract.
- TASK-448 — Current stock display.
- TASK-449 — Purchase history display.
- TASK-450 — Summary calculation.
- TASK-451 — Save workflow.
- TASK-452 — Post workflow.
- TASK-453 — Cancel workflow.
- TASK-454 — Keyboard workflow.
- TASK-455 — Add tests.

---

## US-245 — Purchase Invoice UI

### Tasks

- TASK-456 — Create invoice list.
- TASK-457 — Create invoice form.
- TASK-458 — Supplier lookup.
- TASK-459 — Goods Receipt lookup.
- TASK-460 — Supplier invoice number input.
- TASK-461 — Invoice date input.
- TASK-462 — Invoice item grid.
- TASK-463 — Invoice matching view.
- TASK-464 — Mismatch indicators.
- TASK-465 — Tax/discount display.
- TASK-466 — Summary section.
- TASK-467 — Save.
- TASK-468 — Post.
- TASK-469 — Cancel.
- TASK-470 — Keyboard navigation.
- TASK-471 — Add tests.

---

## US-246 — Purchase Return UI

### Tasks

- TASK-472 — Create return list.
- TASK-473 — Create return form.
- TASK-474 — Supplier lookup.
- TASK-475 — Batch lookup.
- TASK-476 — Eligible-stock lookup.
- TASK-477 — Source document lookup.
- TASK-478 — Return reason selection.
- TASK-479 — Quantity input.
- TASK-480 — Return summary.
- TASK-481 — Save.
- TASK-482 — Post.
- TASK-483 — Cancel.
- TASK-484 — Keyboard navigation.
- TASK-485 — Add tests.

---

# 21. FEAT-094 — Offline-First Purchase & Synchronization

The architecture defines the local database as the source of truth during daily operation.

Purchase changes must therefore work without requiring internet connectivity.

## US-247 — Outbox integration

### Purchase mutation events

```text
PurchaseOrderCreated
PurchaseOrderUpdated
PurchaseOrderSubmitted

GoodsReceiptCreated
GoodsReceiptPosted

PurchaseInvoiceCreated
PurchaseInvoicePosted

PurchaseReturnCreated
PurchaseReturnPosted
```

### Tasks

- TASK-486 — Identify Purchase mutation events.
- TASK-487 — Define Purchase Order Outbox payload.
- TASK-488 — Define Goods Receipt Outbox payload.
- TASK-489 — Define Purchase Invoice Outbox payload.
- TASK-490 — Define Purchase Return Outbox payload.
- TASK-491 — Write Outbox record transactionally.
- TASK-492 — Implement retry behavior.
- TASK-493 — Implement failure tracking.
- TASK-494 — Add tests.

---

## US-248 — Purchase idempotency

### Acceptance Criteria

Repeated operations must not create:

- duplicate Purchase Orders
- duplicate Goods Receipts
- duplicate Purchase Invoices
- duplicate Purchase Returns
- duplicate stock receipts
- duplicate stock returns

### Tasks

- TASK-495 — Define Purchase transaction UUID.
- TASK-496 — Implement request idempotency.
- TASK-497 — Implement Goods Receipt deduplication.
- TASK-498 — Implement Purchase Return deduplication.
- TASK-499 — Implement Purchase Invoice deduplication.
- TASK-500 — Implement synchronization replay protection.
- TASK-501 — Add tests.

---

## US-249 — Purchase conflict handling

### Acceptance Criteria

1. Purchase documents use version/concurrency controls.
2. Conflicting edits are detected.
3. Stock conflicts are handled by Inventory transaction rules.
4. Purchase cannot silently overwrite another user's changes.
5. Conflict information is actionable.

### Tasks

- TASK-502 — Define Purchase conflict scenarios.
- TASK-503 — Define Purchase Order conflict.
- TASK-504 — Define Goods Receipt conflict.
- TASK-505 — Define Purchase Invoice conflict.
- TASK-506 — Define Purchase Return conflict.
- TASK-507 — Implement optimistic locking.
- TASK-508 — Implement conflict response.
- TASK-509 — Integrate SyncConflict where applicable.
- TASK-510 — Add conflict tests.

---

## US-250 — Event-driven Purchase integration

The architecture provides `PurchaseReceived` as an example event.

### Tasks

- TASK-511 — Define PurchaseReceived event.
- TASK-512 — Define PurchaseOrderSubmitted event.
- TASK-513 — Define PurchaseReturnPosted event.
- TASK-514 — Publish events after successful transaction.
- TASK-515 — Ensure event publishing is retry-safe.
- TASK-516 — Add consumers where required.
- TASK-517 — Add event tests.

---

# 22. FEAT-095 — Purchase Testing, Performance & Readiness

## US-251 — Unit tests

### Tasks

- TASK-518 — Purchase Order validation tests.
- TASK-519 — Purchase Order lifecycle tests.
- TASK-520 — Purchase Order item tests.
- TASK-521 — Goods Receipt validation tests.
- TASK-522 — Goods Receipt quantity tests.
- TASK-523 — Batch capture tests.
- TASK-524 — Purchase Invoice validation tests.
- TASK-525 — Purchase calculation tests.
- TASK-526 — Purchase Return validation tests.
- TASK-527 — Purchase lifecycle tests.
- TASK-528 — Inventory integration tests.
- TASK-529 — Idempotency tests.
- TASK-530 — Optimistic-lock tests.

---

## US-252 — API integration tests

### Tasks

- TASK-531 — Purchase Order API tests.
- TASK-532 — Goods Receipt API tests.
- TASK-533 — Purchase Invoice API tests.
- TASK-534 — Purchase Return API tests.
- TASK-535 — Purchase search API tests.
- TASK-536 — Purchase history API tests.
- TASK-537 — Authorization failure tests.
- TASK-538 — Validation failure tests.
- TASK-539 — Transaction rollback tests.
- TASK-540 — Duplicate request tests.

---

## US-253 — End-to-end Purchase workflows

### Workflow 1 — Purchase Order

```text
Supplier
 ↓
Purchase Order
 ↓
Items
 ↓
Submit
```

### Workflow 2 — Goods Receipt

```text
Purchase Order
 ↓
Goods Receipt
 ↓
Batch
 ↓
Stock Increase
 ↓
Stock Movement
```

### Workflow 3 — Purchase Invoice

```text
Goods Receipt
 ↓
Purchase Invoice
 ↓
Match
 ↓
Post
```

### Workflow 4 — Purchase Return

```text
Stock
 ↓
Purchase Return
 ↓
Stock Decrease
 ↓
Stock Movement
```

### Workflow 5 — Offline Purchase

```text
Local Purchase
 ↓
Local SQLite
 ↓
Outbox
 ↓
Sync
 ↓
Server
```

### Tasks

- TASK-541 — E2E Purchase Order workflow.
- TASK-542 — E2E partial receipt workflow.
- TASK-543 — E2E full receipt workflow.
- TASK-544 — E2E batch creation workflow.
- TASK-545 — E2E stock increase workflow.
- TASK-546 — E2E Purchase Invoice workflow.
- TASK-547 — E2E Purchase Return workflow.
- TASK-548 — E2E duplicate submission workflow.
- TASK-549 — E2E offline workflow.
- TASK-550 — E2E synchronization retry workflow.

---

## US-254 — Performance testing

The project design specifies performance-first behavior and fast workflow targets.

### Tasks

- TASK-551 — Define realistic supplier dataset.
- TASK-552 — Define realistic Purchase Order dataset.
- TASK-553 — Define realistic Goods Receipt dataset.
- TASK-554 — Define realistic Purchase Invoice dataset.
- TASK-555 — Define realistic Purchase Return dataset.
- TASK-556 — Benchmark supplier lookup.
- TASK-557 — Benchmark Medicine lookup.
- TASK-558 — Benchmark Purchase Order search.
- TASK-559 — Benchmark Goods Receipt search.
- TASK-560 — Benchmark Purchase history.
- TASK-561 — Benchmark purchase posting.
- TASK-562 — Inspect database query plans.
- TASK-563 — Add justified indexes.
- TASK-564 — Re-run benchmarks.

---

## US-255 — Database compatibility

### Tasks

- TASK-565 — Validate SQLite Purchase schema.
- TASK-566 — Validate PostgreSQL Purchase schema.
- TASK-567 — Validate foreign keys.
- TASK-568 — Validate unique constraints.
- TASK-569 — Validate indexes.
- TASK-570 — Validate transaction behavior.
- TASK-571 — Validate quantity precision.
- TASK-572 — Validate monetary precision.
- TASK-573 — Validate soft delete.
- TASK-574 — Validate optimistic locking.
- TASK-575 — Run SQLite integration suite.
- TASK-576 — Run PostgreSQL integration suite.

---

## US-256 — Purchase documentation

### Tasks

- TASK-577 — Document Purchase domain.
- TASK-578 — Document Purchase Order lifecycle.
- TASK-579 — Document Goods Receipt lifecycle.
- TASK-580 — Document Purchase Invoice lifecycle.
- TASK-581 — Document Purchase Return lifecycle.
- TASK-582 — Document Purchase → Inventory integration.
- TASK-583 — Document permissions.
- TASK-584 — Document audit events.
- TASK-585 — Document synchronization behavior.
- TASK-586 — Document idempotency.
- TASK-587 — Document API contracts.
- TASK-588 — Document Purchase calculations.

---

## US-257 — Phase readiness and sign-off

### Tasks

- TASK-589 — Complete database review.
- TASK-590 — Complete backend code review.
- TASK-591 — Complete Angular code review.
- TASK-592 — Complete authorization review.
- TASK-593 — Complete audit review.
- TASK-594 — Complete offline/sync review.
- TASK-595 — Complete Inventory integration review.
- TASK-596 — Complete QA review.
- TASK-597 — Validate all acceptance criteria.
- TASK-598 — Validate downstream Financial integration contracts.
- TASK-599 — Validate downstream Pricing integration contracts.
- TASK-600 — Validate downstream Reporting requirements.
- TASK-601 — Complete Phase 7 sign-off.

---

# 23. Purchase Permission Catalog

Recommended initial permissions:

```text
Purchase.View

Purchase.Order.View
Purchase.Order.Create
Purchase.Order.Update
Purchase.Order.Submit
Purchase.Order.Cancel
Purchase.Order.Print

Purchase.GoodsReceipt.View
Purchase.GoodsReceipt.Create
Purchase.GoodsReceipt.Update
Purchase.GoodsReceipt.Post
Purchase.GoodsReceipt.Cancel

Purchase.Invoice.View
Purchase.Invoice.Create
Purchase.Invoice.Update
Purchase.Invoice.Post
Purchase.Invoice.Cancel

Purchase.Return.View
Purchase.Return.Create
Purchase.Return.Post
Purchase.Return.Cancel

Purchase.Import
Purchase.History.View
```

These should be reconciled with the security model established in the earlier phase.

---

# 24. Core Purchase Business Rules

## 24.1 Purchase does not own stock

Purchase should never directly execute arbitrary:

```text
UPDATE Stock
```

Instead:

```text
Goods Receipt
      ↓
Purchase Service
      ↓
Inventory Service
      ↓
Stock + StockMovement
```

This keeps Inventory as the authoritative stock domain.

---

## 24.2 Goods Receipt is the inventory entry point

The documented relationship is:

```text
Purchase Order
      ↓
Goods Receipt
      ↓
Purchase Invoice
      ↓
Batch
      ↓
Stock
```

Therefore Goods Receipt should be the primary Purchase operation that drives physical inventory receipt.

---

## 24.3 Purchase Invoice should not blindly increase stock again

A common design mistake is:

```text
Goods Receipt
  → Increase Stock

Purchase Invoice
  → Increase Stock again
```

That would duplicate inventory.

Instead, the business flow should distinguish:

```text
Receipt of physical goods
        ↓
Inventory impact

Financial invoice/document
        ↓
Financial impact later
```

The exact accounting behavior belongs to the later Financial phase.

---

## 24.4 Purchase Return reverses inventory

Purchase Return should use Inventory services:

```text
Purchase Return
      ↓
Validate stock
      ↓
Decrease stock
      ↓
Stock Movement
```

It should not directly manipulate the Stock table.

---

## 24.5 Partial receipts must be first-class

Example:

```text
Purchase Order = 100 units

First receipt = 60
Pending = 40

Second receipt = 30
Pending = 10

Third receipt = 10
Pending = 0
```

The Purchase Order should transition accordingly.

---

## 24.6 Supplier invoice duplication must be controlled

The system should define the uniqueness scope for supplier invoice references.

For example:

```text
Supplier + Supplier Invoice Number
```

may be the business uniqueness key, but the exact rule must be finalized against the detailed schema and business requirements.

---

## 24.7 Purchase calculations must be server authoritative

Angular can calculate totals for UX.

But the backend must recalculate and validate:

```text
quantity
rate
discount
tax
other charges
rounding
net amount
```

Do not trust totals submitted by the UI.

---

## 24.8 Historical purchase documents should not be casually deleted

For posted documents:

```text
Incorrect document
       ↓
Controlled cancellation/reversal
       ↓
Audit trail
```

Do not silently delete purchase history.

---

# 25. Legacy Feature Mapping

| Legacy capability | Modern Purchase treatment |
|---|---|
| Order Placement | PurchaseOrder |
| Order Reprinting | PurchaseOrder UI/service |
| Order Short List | Purchase replenishment workflow |
| Pending/Short Receipt | PurchaseOrder + GoodsReceipt |
| Goods Receipt Purchase Bill | GoodsReceipt |
| Goods Receipt Purchase DM | GoodsReceipt variant if required |
| Goods Receipt Replacement | GoodsReceipt variant if required |
| Purchase Update | Controlled Purchase lifecycle |
| Purchase Import | Purchase import feature |
| Opening Stock | Inventory/Purchase boundary |
| Supplier Direct Credit Note | Purchase Return / later Financial boundary |
| Expiry/Breakage/Return/Shortage | Purchase Return + Inventory |
| Batch MRP/Expiry changes | Inventory Batch |
| Batch Lock/Unlock | Inventory Batch |
| Purchase Register | Reporting |
| Purchase Analysis | Reporting |
| Supplier-wise Purchase | Reporting |
| GST Purchase Reports | Reporting/Pricing/Financial |
| Debit Note / Claim | Purchase + later Financial integration |

The source material shows these legacy Purchase menus and reporting concepts.

---

# 26. Purchase Reports / Query Readiness

The legacy application contains Purchase-oriented reporting such as:

```text
Goods Receipt
Supplierwise Order
Purchase Register
Supplier-Wise Purchase Return
Purchase Return Detail
Supplier-Wise Input
Inventory Receipt Register Detail
Inventory Receipt Register Summary
Datewise Purchase Summary
Product-wise Batch-wise Purchase
Product Type-wise Receipt Register
```

Phase 7 should expose query services that make these possible.

However, the actual Reporting UI and complete statutory reporting should remain outside this phase.

---

# 27. Data Ownership

| Data | Owner |
|---|---|
| Supplier identity | Party/Supplier |
| Medicine identity | Medicine Master |
| Purchase Order | Purchase |
| Purchase Order Item | Purchase |
| Goods Receipt | Purchase |
| Goods Receipt Item | Purchase |
| Batch identity | Inventory |
| Stock balance | Inventory |
| Stock movement | Inventory |
| Purchase Invoice | Purchase |
| Purchase Invoice Item | Purchase |
| Purchase Return | Purchase |
| Purchase Return Item | Purchase |
| Tax definition | Pricing |
| Discount rules | Pricing |
| Financial posting | Financial |
| Payment | Financial |
| Audit | Audit |
| Synchronization | Sync |

---

# 28. Integration Architecture

```text
                    SUPPLIER
                       │
                       ▼
                PURCHASE ORDER
                       │
                       ▼
                 GOODS RECEIPT
                       │
              ┌────────┴─────────┐
              ▼                  ▼
            BATCH              STOCK
              │                  │
              └────────┬─────────┘
                       ▼
                 STOCK MOVEMENT

                 GOODS RECEIPT
                       │
                       ▼
                PURCHASE INVOICE
                       │
                       ▼
                  FINANCIAL
                 (Later Phase)

                 PURCHASE RETURN
                       │
                       ▼
                    STOCK
                       │
                       ▼
                 STOCK MOVEMENT
```

The database overview explicitly defines the Purchase → Goods Receipt → Purchase Invoice → Batch → Stock → Stock Movement relationship.

---

# 29. Testing Matrix

| Area | Coverage |
|---|---|
| Purchase Order | Create / Update / Submit / Cancel |
| Order Items | Add / Edit / Delete |
| Partial Receipt | Ordered vs received |
| Goods Receipt | Create / Update / Post |
| Batch | Create/find during receipt |
| Stock | Increase through Inventory |
| Stock Movement | Receipt movement |
| Purchase Invoice | Create / Match / Post |
| Purchase Return | Create / Post |
| Stock Return | Decrease through Inventory |
| Calculations | Discount / Tax / Rounding |
| Search | Supplier / Date / Medicine / Batch |
| Authorization | Allowed / Denied |
| Audit | Mutation coverage |
| Idempotency | Duplicate processing |
| Offline | Local operation |
| Sync | Retry / replay |
| Concurrency | Optimistic locking |
| Database | SQLite / PostgreSQL |
| UI | Forms / grids / workflows |
| Keyboard | Navigation / save / search |
| Performance | Large purchase dataset |

---

# 30. Definition of Done

Phase 7 is complete only when:

- [ ] Purchase schema is finalized.
- [ ] PurchaseOrder implemented.
- [ ] PurchaseOrderItem implemented.
- [ ] GoodsReceipt implemented.
- [ ] GoodsReceiptItem implemented.
- [ ] PurchaseInvoice implemented.
- [ ] PurchaseInvoiceItem implemented.
- [ ] PurchaseReturn implemented.
- [ ] PurchaseReturnItem implemented.
- [ ] Supplier integration is complete.
- [ ] Purchase Order lifecycle is implemented.
- [ ] Partial receipt is implemented.
- [ ] Short receipt tracking is implemented.
- [ ] Goods Receipt creates/uses Batch through Inventory.
- [ ] Goods Receipt increases stock through Inventory.
- [ ] StockMovement is generated.
- [ ] Purchase Invoice does not duplicate stock.
- [ ] Purchase Return decreases stock through Inventory.
- [ ] Purchase calculations are backend-authoritative.
- [ ] Purchase permissions are enforced.
- [ ] Audit is implemented.
- [ ] Outbox integration is implemented.
- [ ] Idempotency is implemented.
- [ ] Optimistic locking is implemented.
- [ ] Angular Purchase UI is complete.
- [ ] Keyboard workflow is complete.
- [ ] Unit tests pass.
- [ ] API integration tests pass.
- [ ] E2E workflows pass.
- [ ] Performance tests pass.
- [ ] SQLite compatibility is verified.
- [ ] PostgreSQL compatibility is verified.
- [ ] Documentation is complete.
- [ ] Financial integration contracts are ready.
- [ ] Pricing integration contracts are ready.
- [ ] Reporting query contracts are ready.
- [ ] QA sign-off is complete.

---

# 31. Phase 7 Work Item Summary

| Type | Count |
|---|---:|
| Epic | 1 |
| Features | 16 |
| User Stories | 51 |
| Tasks | 601 |
| **Total Work Items** | **669** |

The backlog is intentionally split across:

```text
Database
Backend
Business Rules
API
Angular UI
Inventory Integration
Security
Audit
Offline/Sync
Testing
Performance
Documentation
```

so the work can be created and tracked independently in Azure DevOps.

---

# 32. Phase 7 Boundary

At the end of Phase 7, the ERP should support:

```text
Supplier
   ↓
Purchase Order
   ↓
Goods Receipt
   ↓
Batch / Stock
   ↓
Purchase Invoice
```

and:

```text
Stock
   ↓
Purchase Return
   ↓
Supplier
```

The system should be able to answer:

```text
What did we order?
From whom?
What was received?
What was short?
Which batches were received?
How much stock was added?
What purchase invoice belongs to the receipt?
What was returned?
Why?
What supplier was involved?
Who performed the operation?
When?
```

But Phase 7 does NOT implement the complete:

```text
Sales
Financial Accounting
Payment
Pricing Master
Tax Master
Loyalty
Prescription
Reporting
```

Those remain separate domains/phases.

---

# 33. Final Phase Architecture

```text
                    SUPPLIER
                       │
                       ▼
                PURCHASE ORDER
                       │
                       ▼
                 GOODS RECEIPT
                       │
              ┌────────┴────────┐
              │                 │
              ▼                 ▼
            BATCH              STOCK
              │                 │
              └────────┬────────┘
                       ▼
                 STOCK MOVEMENT

                 GOODS RECEIPT
                       │
                       ▼
                PURCHASE INVOICE
                       │
                       ▼
                  FINANCIAL

                 PURCHASE RETURN
                       │
                       ▼
                    STOCK
                       │
                       ▼
                 STOCK MOVEMENT

All Purchase mutations
        ↓
      Audit
        ↓
     Outbox
        ↓
      Sync
```

## Critical Phase 7 principle

> **Purchase owns procurement documents; Inventory owns physical stock.**

The most important integration boundary is:

```text
Purchase → asks Inventory to change stock
Inventory → owns how stock changes
```

This keeps the domain separation from the database architecture intact and prevents Purchase, Sales and Inventory from independently manipulating stock.
