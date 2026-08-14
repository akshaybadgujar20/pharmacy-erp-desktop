# Phase 8 — Sales & Billing Management

## 1. Purpose

Phase 8 implements the Pharmacy ERP Sales domain.

The database overview defines Sales as the module responsible for **customer billing** and specifies these tables:

- `SalesInvoice`
- `SalesInvoiceItem`
- `SalesReturn`
- `SalesReturnItem`
- `SalesPayment`

The database architecture shows the Sales flow as:

```text
Prescription
     ↓
Sales Invoice
     ↓
Sales Payment
```

Sales is therefore the main operational workflow for dispensing/billing medicines to customers.

The architecture handbook establishes that the ERP must be:

- Offline first
- Keyboard first
- Workflow driven
- Fast
- Modular
- Secure
- Synchronization aware

The architecture also gives the target billing performance expectations:

```text
Medicine Search < 200ms
Invoice Save    < 500ms
Barcode Scan    < 100ms
```

---

# 2. Phase 8 Scope

Phase 8 covers:

```text
Customer selection
Medicine search
Batch selection
Sales invoice
Sales invoice items
Quantity
Pricing integration
Discount integration
Tax integration
Prescription linkage
Stock deduction
Stock movement
Sales payment
Sales return
Stock return
Invoice printing
Barcode billing
Cashier workflow
Credit sales
Sales history
Invoice verification
Invoice cancellation/reversal
Permissions
Audit
Offline operation
Outbox
Idempotency
Synchronization
Testing
Performance
```

---

# 3. Important Domain Boundaries

## Sales owns

```text
Sales Invoice
Sales Invoice Items
Sales Return
Sales Return Items
Sales Payment
Sales document lifecycle
Sales validation
Sales workflow
Sales-specific queries
Sales audit events
Sales-to-Inventory orchestration
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

Sales must request stock changes through Inventory services.

## Pricing owns

```text
PriceList
PriceListItem
Tax
DiscountRule
```

Sales consumes pricing information; it must not duplicate pricing-rule ownership.

## Party/Customer owns

```text
Party
Customer
PartyAddress
PartyContact
```

## Prescription owns

```text
Prescription
PrescriptionItem
```

Sales may consume prescription information and link it to an invoice.

## Financial owns later

```text
Payment
Receipt
Ledger
LedgerEntry
```

`SalesPayment` is part of the Sales schema, while broader accounting/payment posting remains a Financial integration boundary.

---

# 4. Legacy Workflow Reference

The legacy application shows the following Sales capabilities:

```text
Sales
├── Invoicing
│   ├── New
│   ├── Change
│   ├── Delete
│   ├── Re-Print / View
│   ├── Print Non Printed
│   ├── Print in Range
│   ├── Invoice Verification
│   ├── Sale Updation
│   └── Cashier Window
│
├── Sales Delivery Challan
│   ├── New
│   ├── Change
│   ├── Delete
│   ├── DM Pending Report
│   └── Invoice Conversion
│
├── Customer Return Goods
│   ├── New
│   ├── Change
│   └── Re-Print / View
│
├── Pending Cash
│   ├── Pending Cash Entry
│   └── Pending Cash Receipt Entry
│
├── Stock Issue
│   ├── New
│   ├── Change
│   ├── Re-Print
│   ├── Datewise Issue Register
│   ├── Productwise Balance
│   └── Issue Transfer To Invoice
│
├── Quotation Entry
├── Sales Posting in Accounts
└── Sales Return Posting in Accounts
```

These are treated as workflow requirements/reference points, not as instructions to reproduce the legacy data model.

---

# 5. ADO Hierarchy

```text
EPIC-008 — Sales & Billing Management
│
├── FEAT-096 — Sales Domain & Data Model
├── FEAT-097 — Sales Invoice Creation
├── FEAT-098 — Sales Invoice Items & Medicine Selection
├── FEAT-099 — Batch Selection & Stock Availability
├── FEAT-100 — Pricing, Discount & Tax Integration
├── FEAT-101 — Sales Invoice Validation & Calculation
├── FEAT-102 — Sales Invoice Lifecycle
├── FEAT-103 — Sales Payment
├── FEAT-104 — Sales Return
├── FEAT-105 — Sales-to-Inventory Integration
├── FEAT-106 — Prescription Integration
├── FEAT-107 — Barcode & Fast Billing
├── FEAT-108 — Cashier Workflow
├── FEAT-109 — Invoice Printing & Reprinting
├── FEAT-110 — Sales Search & History
├── FEAT-111 — Delivery Challan / Temporary Sales Boundary
├── FEAT-112 — Sales Authorization & Audit
├── FEAT-113 — Sales REST API & NestJS Services
├── FEAT-114 — Angular Sales UI
├── FEAT-115 — Offline-First Sales & Synchronization
└── FEAT-116 — Sales Testing, Performance & Readiness
```

---

# 6. Epic — EPIC-008 Sales & Billing Management

## Objective

Build a fast, reliable, pharmacist-friendly Sales and Billing workflow:

```text
Customer
   ↓
Medicine Search
   ↓
Batch Selection
   ↓
Pricing / Discount / Tax
   ↓
Sales Invoice
   ↓
Stock Deduction
   ↓
Stock Movement
   ↓
Payment
   ↓
Print
```

Optional prescription flow:

```text
Prescription
   ↓
Sales Invoice
   ↓
Sales Invoice Items
   ↓
Stock Deduction
   ↓
Payment
```

## Epic completion criteria

- Sales schema implemented.
- Invoice creation implemented.
- Invoice item workflow implemented.
- Batch selection implemented.
- Stock availability validated.
- Pricing integrated.
- Discounts integrated.
- Tax integrated.
- Invoice totals calculated server-side.
- Stock deduction is atomic.
- StockMovement is generated.
- SalesPayment implemented.
- Sales Return implemented.
- Returned stock is restored through Inventory.
- Prescription linkage is supported where required.
- Barcode billing supported.
- Keyboard-first cashier workflow supported.
- Invoice printing supported.
- Sales history supported.
- Permissions enforced by backend.
- Audit events implemented.
- Offline operation supported.
- Outbox integration implemented.
- Idempotency implemented.
- Synchronization conflict handling implemented.
- Unit/API/E2E tests completed.
- Performance targets verified.

---

# 7. FEAT-096 — Sales Domain & Data Model

## US-258 — Finalize Sales schema

### Acceptance Criteria

1. All five Sales tables are represented.
2. Invoice/header-to-item relationships are explicit.
3. Sales Return/header-to-item relationships are explicit.
4. Sales Payment relationship is explicit.
5. Customer relationship is explicit.
6. Medicine/Batch relationships are explicit where required.
7. Prescription linkage is explicit where required.
8. Inventory integration references are explicit.
9. Standard UUID/version/audit conventions are followed.

### Tasks

- TASK-001 — Review SalesInvoice specification.
- TASK-002 — Review SalesInvoiceItem specification.
- TASK-003 — Review SalesReturn specification.
- TASK-004 — Review SalesReturnItem specification.
- TASK-005 — Review SalesPayment specification.
- TASK-006 — Define invoice/header-item relationship.
- TASK-007 — Define return/header-item relationship.
- TASK-008 — Define invoice-payment relationship.
- TASK-009 — Define Customer relationship.
- TASK-010 — Define Medicine relationship.
- TASK-011 — Define Batch relationship.
- TASK-012 — Define Prescription relationship.
- TASK-013 — Define Inventory integration references.
- TASK-014 — Define invoice numbering.
- TASK-015 — Define return numbering.
- TASK-016 — Define document status.
- TASK-017 — Define cancellation/reversal rules.
- TASK-018 — Define soft-delete behavior.
- TASK-019 — Define optimistic-lock behavior.
- TASK-020 — Define synchronization UUID strategy.
- TASK-021 — Implement Prisma SalesInvoice model.
- TASK-022 — Implement Prisma SalesInvoiceItem model.
- TASK-023 — Implement Prisma SalesReturn model.
- TASK-024 — Implement Prisma SalesReturnItem model.
- TASK-025 — Implement Prisma SalesPayment model.
- TASK-026 — Add foreign keys.
- TASK-027 — Add unique constraints.
- TASK-028 — Add indexes.
- TASK-029 — Add timestamps.
- TASK-030 — Add version fields where required.
- TASK-031 — Create Prisma migration.
- TASK-032 — Validate SQLite schema.
- TASK-033 — Validate PostgreSQL compatibility.

---

# 8. FEAT-097 — Sales Invoice Creation

## US-259 — Create new Sales Invoice

### Acceptance Criteria

1. Authorized user can create a new invoice.
2. Customer can be selected or a walk-in customer flow can be used where permitted.
3. Invoice date/time is generated correctly.
4. Invoice number is unique.
5. At least one sale item is required.
6. Items are validated.
7. Pricing is calculated by the backend.
8. Stock is validated.
9. Tax/discount rules are applied through the appropriate domain.
10. Invoice total is server-authoritative.
11. Invoice creation is transaction-safe.
12. Invoice is audited.

### Tasks

- TASK-034 — Define Sales Invoice lifecycle.
- TASK-035 — Define walk-in customer behavior.
- TASK-036 — Define customer selection rules.
- TASK-037 — Define invoice numbering.
- TASK-038 — Define invoice date/time rules.
- TASK-039 — Define minimum item rules.
- TASK-040 — Define invoice status.
- TASK-041 — Define draft behavior.
- TASK-042 — Create SalesInvoice DTO.
- TASK-043 — Create SalesInvoiceItem DTO.
- TASK-044 — Implement DTO validation.
- TASK-045 — Implement SalesInvoiceService.
- TASK-046 — Implement create transaction.
- TASK-047 — Implement invoice number generation.
- TASK-048 — Implement customer validation.
- TASK-049 — Implement item validation.
- TASK-050 — Implement server-side calculation.
- TASK-051 — Implement create API.
- TASK-052 — Add authorization.
- TASK-053 — Add audit event.
- TASK-054 — Add Outbox event.
- TASK-055 — Add unit tests.
- TASK-056 — Add integration tests.

---

## US-260 — Support walk-in/cash customer billing

### Tasks

- TASK-057 — Define walk-in customer model/behavior.
- TASK-058 — Define mandatory customer information.
- TASK-059 — Define customer selection fallback.
- TASK-060 — Implement walk-in billing flow.
- TASK-061 — Prevent accidental duplicate customer creation.
- TASK-062 — Add UI flow.
- TASK-063 — Add tests.

---

# 9. FEAT-098 — Sales Invoice Items & Medicine Selection

## US-261 — Search and add Medicine

The architecture explicitly requires fast medicine search and a workflow-driven cashier experience.

### Acceptance Criteria

1. User can search by medicine name.
2. User can search by relevant identifiers supported by the Medicine schema.
3. Search is keyboard accessible.
4. Search is fast enough for the defined target.
5. Medicine selection adds a line to the invoice.
6. Duplicate item handling is defined.
7. Search does not directly manipulate inventory.

### Tasks

- TASK-064 — Define medicine-search contract.
- TASK-065 — Implement medicine search API.
- TASK-066 — Add name search.
- TASK-067 — Add identifier search where supported.
- TASK-068 — Add active medicine filter.
- TASK-069 — Add search pagination/limit.
- TASK-070 — Add query indexes.
- TASK-071 — Implement Angular medicine search.
- TASK-072 — Add keyboard shortcut.
- TASK-073 — Add item selection.
- TASK-074 — Add duplicate-line behavior.
- TASK-075 — Add tests.
- TASK-076 — Benchmark search performance.

---

## US-262 — Manage invoice items

### Acceptance Criteria

User can:

```text
Add
Edit quantity
Change batch where allowed
Remove
Recalculate
```

### Tasks

- TASK-077 — Implement add-item service.
- TASK-078 — Implement update-item service.
- TASK-079 — Implement remove-item service.
- TASK-080 — Implement quantity validation.
- TASK-081 — Implement line recalculation.
- TASK-082 — Implement duplicate-line handling.
- TASK-083 — Implement UI item grid.
- TASK-084 — Add keyboard navigation.
- TASK-085 — Add delete-line shortcut.
- TASK-086 — Add tests.

---

# 10. FEAT-099 — Batch Selection & Stock Availability

## US-263 — Select appropriate Batch

### Acceptance Criteria

1. User can see available batches.
2. Expired batches are excluded or explicitly controlled.
3. Locked batches are handled according to Inventory rules.
4. Available quantity is displayed.
5. Batch selection is validated on the backend.
6. Sales cannot sell more than available stock unless an explicitly approved business rule exists.
7. Batch selection is not trusted from the UI.

### Tasks

- TASK-087 — Define batch-selection contract.
- TASK-088 — Define expiry rules.
- TASK-089 — Define locked-batch rules.
- TASK-090 — Define stock-availability rules.
- TASK-091 — Implement available-batch query.
- TASK-092 — Implement expiry filtering.
- TASK-093 — Implement stock filtering.
- TASK-094 — Implement batch lookup API.
- TASK-095 — Implement batch selector UI.
- TASK-096 — Display available quantity.
- TASK-097 — Add batch selection keyboard flow.
- TASK-098 — Add tests.

---

## US-264 — Validate stock at invoice posting

### Acceptance Criteria

Stock must be revalidated at the moment of posting because stock may have changed after the invoice was created.

### Tasks

- TASK-099 — Implement final stock validation.
- TASK-100 — Validate batch availability.
- TASK-101 — Validate requested quantity.
- TASK-102 — Handle insufficient-stock error.
- TASK-103 — Handle concurrent sale.
- TASK-104 — Add transaction boundary.
- TASK-105 — Add concurrency tests.

---

# 11. FEAT-100 — Pricing, Discount & Tax Integration

## US-265 — Retrieve selling price

### Tasks

- TASK-106 — Define Pricing service contract.
- TASK-107 — Define price lookup inputs.
- TASK-108 — Implement price lookup integration.
- TASK-109 — Resolve price based on applicable PriceList.
- TASK-110 — Handle missing price.
- TASK-111 — Display price in UI.
- TASK-112 — Add tests.

---

## US-266 — Apply DiscountRule

### Tasks

- TASK-113 — Define DiscountRule integration.
- TASK-114 — Determine applicable discount.
- TASK-115 — Apply item-level discount.
- TASK-116 — Apply invoice-level discount if supported.
- TASK-117 — Validate discount limits.
- TASK-118 — Prevent client-side discount tampering.
- TASK-119 — Display discount.
- TASK-120 — Add tests.

---

## US-267 — Calculate Tax

### Tasks

- TASK-121 — Define Tax service contract.
- TASK-122 — Determine applicable Tax.
- TASK-123 — Calculate taxable value.
- TASK-124 — Calculate tax amount.
- TASK-125 — Support applicable tax components.
- TASK-126 — Validate tax result.
- TASK-127 — Display tax.
- TASK-128 — Add tests.

---

# 12. FEAT-101 — Sales Invoice Validation & Calculation

## US-268 — Calculate invoice totals

### Calculation boundary

The backend should calculate:

```text
Item Quantity
×
Selling Price
=
Gross Line Value

Gross
-
Discount
=
Taxable

Taxable
+
Tax
+
Other Charges
-
Other Discounts
±
Rounding
=
Net Invoice Amount
```

Exact fields must follow the finalized schema and Pricing contract.

### Tasks

- TASK-129 — Define line-value calculation.
- TASK-130 — Define discount calculation.
- TASK-131 — Define taxable calculation.
- TASK-132 — Define tax calculation contract.
- TASK-133 — Define other charges.
- TASK-134 — Define other discounts.
- TASK-135 — Define rounding.
- TASK-136 — Define net amount.
- TASK-137 — Implement SalesCalculationService.
- TASK-138 — Recalculate server-side.
- TASK-139 — Compare client/server totals.
- TASK-140 — Reject inconsistent totals.
- TASK-141 — Add unit tests.
- TASK-142 — Add boundary tests.

---

## US-269 — Validate invoice before posting

### Tasks

- TASK-143 — Validate customer.
- TASK-144 — Validate invoice date.
- TASK-145 — Validate item count.
- TASK-146 — Validate Medicine.
- TASK-147 — Validate Batch.
- TASK-148 — Validate quantity.
- TASK-149 — Validate price.
- TASK-150 — Validate discount.
- TASK-151 — Validate tax.
- TASK-152 — Validate total.
- TASK-153 — Validate payment state.
- TASK-154 — Add validation error structure.
- TASK-155 — Add tests.

---

# 13. FEAT-102 — Sales Invoice Lifecycle

## US-270 — Define invoice status lifecycle

Recommended controlled lifecycle:

```text
Draft
  ↓
Ready / Confirmed
  ↓
Posted
  ↓
Printed
```

Controlled exception paths:

```text
Draft → Cancelled

Posted → Reversed / Cancelled
```

The exact status set must be finalized against the approved Sales schema.

### Tasks

- TASK-156 — Finalize status values.
- TASK-157 — Define valid transitions.
- TASK-158 — Define invalid transitions.
- TASK-159 — Define cancellation rules.
- TASK-160 — Define reversal rules.
- TASK-161 — Implement lifecycle service.
- TASK-162 — Implement transition validation.
- TASK-163 — Add tests.

---

## US-271 — Post Sales Invoice

### Critical transaction

```text
Validate invoice
      ↓
Validate stock
      ↓
Calculate authoritative totals
      ↓
Deduct stock
      ↓
Create StockMovement
      ↓
Post invoice
      ↓
Create audit
      ↓
Create Outbox event
```

### Tasks

- TASK-164 — Define posting transaction.
- TASK-165 — Integrate Inventory StockService.
- TASK-166 — Integrate Inventory StockMovementService.
- TASK-167 — Deduct stock atomically.
- TASK-168 — Create sale stock movement.
- TASK-169 — Persist invoice posting.
- TASK-170 — Implement rollback on failure.
- TASK-171 — Add idempotency.
- TASK-172 — Add audit.
- TASK-173 — Add Outbox.
- TASK-174 — Add integration tests.
- TASK-175 — Add rollback tests.

---

## US-272 — Invoice correction/reversal

### Tasks

- TASK-176 — Define correction rules.
- TASK-177 — Define posted invoice immutability.
- TASK-178 — Define reversal process.
- TASK-179 — Reverse stock movement through Inventory.
- TASK-180 — Create reversal audit event.
- TASK-181 — Create synchronization event.
- TASK-182 — Add authorization.
- TASK-183 — Add tests.

---

# 14. FEAT-103 — Sales Payment

## US-273 — Record Sales Payment

Sales schema explicitly includes `SalesPayment`.

### Acceptance Criteria

1. Payment can be recorded against a Sales Invoice.
2. Payment amount is validated.
3. Payment state is visible.
4. Duplicate payment posting is prevented.
5. Payment remains distinct from broader Financial accounting.

### Tasks

- TASK-184 — Define SalesPayment lifecycle.
- TASK-185 — Define payment methods supported by Sales.
- TASK-186 — Define payment amount validation.
- TASK-187 — Define invoice-payment relationship.
- TASK-188 — Create SalesPayment DTO.
- TASK-189 — Implement SalesPaymentService.
- TASK-190 — Implement payment API.
- TASK-191 — Add authorization.
- TASK-192 — Add audit.
- TASK-193 — Add idempotency.
- TASK-194 — Add tests.

---

## US-274 — Support split payments

Only implement if supported by the finalized SalesPayment schema.

Example:

```text
Cash     ₹500
Card     ₹300
UPI      ₹200
----------------
Total   ₹1000
```

### Tasks

- TASK-195 — Confirm split-payment schema support.
- TASK-196 — Define payment allocation.
- TASK-197 — Validate total allocation.
- TASK-198 — Implement split-payment service.
- TASK-199 — Implement UI.
- TASK-200 — Add tests.

---

## US-275 — Handle credit sales

Customer credit behavior must respect Customer/Financial rules.

### Tasks

- TASK-201 — Define credit-sale eligibility.
- TASK-202 — Read customer credit configuration.
- TASK-203 — Validate credit limit.
- TASK-204 — Validate credit days where applicable.
- TASK-205 — Define outstanding integration boundary.
- TASK-206 — Implement credit-sale workflow.
- TASK-207 — Add authorization.
- TASK-208 — Add tests.

---

# 15. FEAT-104 — Sales Return

## US-276 — Create Sales Return

### Acceptance Criteria

1. Customer can be identified.
2. Original invoice can be selected where required.
3. Return items can be selected.
4. Batch is identified.
5. Return quantity is validated.
6. Return cannot exceed eligible quantity.
7. Return reason is captured where required.
8. Inventory is restored through Inventory services.
9. StockMovement is created.
10. Return is audited.

### Tasks

- TASK-209 — Define Sales Return lifecycle.
- TASK-210 — Define return reasons.
- TASK-211 — Define eligible-return rules.
- TASK-212 — Define source invoice rules.
- TASK-213 — Create SalesReturn DTO.
- TASK-214 — Create SalesReturnItem DTO.
- TASK-215 — Implement validation.
- TASK-216 — Implement SalesReturnService.
- TASK-217 — Implement return API.
- TASK-218 — Add authorization.
- TASK-219 — Add audit.
- TASK-220 — Add Outbox.
- TASK-221 — Add tests.

---

## US-277 — Return against original invoice

### Tasks

- TASK-222 — Load original invoice.
- TASK-223 — Load original invoice items.
- TASK-224 — Calculate sold quantity.
- TASK-225 — Calculate previously returned quantity.
- TASK-226 — Calculate returnable quantity.
- TASK-227 — Validate return quantity.
- TASK-228 — Validate batch.
- TASK-229 — Add return UI.
- TASK-230 — Add tests.

---

## US-278 — Restore returned stock

### Required flow

```text
Sales Return
      ↓
Validate return
      ↓
Inventory StockService
      ↓
Increase Stock
      ↓
StockMovement
```

### Tasks

- TASK-231 — Define Sales Return → Inventory contract.
- TASK-232 — Validate returned batch.
- TASK-233 — Integrate Inventory StockService.
- TASK-234 — Integrate StockMovementService.
- TASK-235 — Make stock restoration atomic.
- TASK-236 — Implement idempotency.
- TASK-237 — Add audit.
- TASK-238 — Add tests.

---

# 16. FEAT-105 — Sales-to-Inventory Integration

## US-279 — Deduct stock atomically during sale

### Rules

Sales must never execute arbitrary direct stock updates.

### Tasks

- TASK-239 — Define Sales → Inventory contract.
- TASK-240 — Define stock deduction request.
- TASK-241 — Define movement type for Sales.
- TASK-242 — Implement SalesInventoryService.
- TASK-243 — Call Inventory StockService.
- TASK-244 — Call Inventory StockMovementService.
- TASK-245 — Wrap invoice and stock mutation in transaction.
- TASK-246 — Handle insufficient stock.
- TASK-247 — Handle concurrent sale.
- TASK-248 — Add tests.

---

## US-280 — Prevent duplicate stock deduction

### Scenarios

```text
Double click
API retry
App restart
Sync replay
Network retry
Duplicate event
```

### Tasks

- TASK-249 — Define sale transaction UUID.
- TASK-250 — Store source transaction identity.
- TASK-251 — Implement duplicate detection.
- TASK-252 — Implement safe retry.
- TASK-253 — Implement UI submit guard.
- TASK-254 — Implement backend idempotency.
- TASK-255 — Add duplicate-post tests.

---

# 17. FEAT-106 — Prescription Integration

## US-281 — Link Prescription to Sales Invoice

The database architecture explicitly shows:

```text
Prescription
    ↓
Sales Invoice
```

### Tasks

- TASK-256 — Define Prescription → Sales contract.
- TASK-257 — Allow prescription lookup.
- TASK-258 — Display prescription information.
- TASK-259 — Link prescription to invoice.
- TASK-260 — Validate prescription items where applicable.
- TASK-261 — Preserve prescription reference.
- TASK-262 — Add audit.
- TASK-263 — Add tests.

---

## US-282 — Validate prescription-controlled medicines

Only implement the exact controls supported by the finalized Prescription/Medicine schema and business requirements.

### Tasks

- TASK-264 — Identify prescription-controlled categories.
- TASK-265 — Define validation rules.
- TASK-266 — Validate prescription presence.
- TASK-267 — Validate medicine against prescription.
- TASK-268 — Handle mismatch.
- TASK-269 — Add authorization override if required.
- TASK-270 — Audit override.
- TASK-271 — Add tests.

---

# 18. FEAT-107 — Barcode & Fast Billing

## US-283 — Barcode-based medicine selection

The architecture explicitly includes barcode integration and a fast cashier workflow.

### Tasks

- TASK-272 — Define barcode lookup contract.
- TASK-273 — Implement barcode-to-medicine lookup.
- TASK-274 — Implement barcode-to-batch lookup where supported.
- TASK-275 — Add barcode input handling.
- TASK-276 — Add scanner-compatible keyboard handling.
- TASK-277 — Add duplicate scan handling.
- TASK-278 — Add quantity behavior.
- TASK-279 — Add tests.
- TASK-280 — Benchmark scan response.

---

## US-284 — Fast cashier billing flow

### Target workflow

```text
Scan/Search
    ↓
Select
    ↓
Quantity
    ↓
Next Item
    ↓
Payment
    ↓
Print
    ↓
Next Customer
```

### Tasks

- TASK-281 — Design cashier workflow.
- TASK-282 — Implement focused item-entry state.
- TASK-283 — Implement fast item addition.
- TASK-284 — Implement quantity shortcut.
- TASK-285 — Implement payment shortcut.
- TASK-286 — Implement save/post shortcut.
- TASK-287 — Implement print shortcut.
- TASK-288 — Implement next-customer shortcut.
- TASK-289 — Add keyboard-only test.
- TASK-290 — Benchmark complete workflow.

---

# 19. FEAT-108 — Cashier Workflow

## US-285 — Cashier Window

The legacy application explicitly contains a Cashier Window.

### Tasks

- TASK-291 — Define cashier screen requirements.
- TASK-292 — Create cashier route.
- TASK-293 — Create invoice workspace.
- TASK-294 — Create customer header.
- TASK-295 — Create item grid.
- TASK-296 — Create totals panel.
- TASK-297 — Create payment panel.
- TASK-298 — Create status panel.
- TASK-299 — Add keyboard navigation.
- TASK-300 — Add permission control.
- TASK-301 — Add tests.

---

## US-286 — Minimize cashier clicks

### Tasks

- TASK-302 — Map complete keyboard flow.
- TASK-303 — Remove unnecessary dialogs.
- TASK-304 — Keep medicine search focused.
- TASK-305 — Auto-focus next item.
- TASK-306 — Auto-focus payment when appropriate.
- TASK-307 — Add configurable shortcuts.
- TASK-308 — Add workflow usability test.
- TASK-309 — Validate against pharmacist workflow.

---

# 20. FEAT-109 — Invoice Printing & Reprinting

## US-287 — Print Sales Invoice

The architecture includes Printing Architecture, and legacy Sales contains:

```text
Re-Print / View
Print Non Printed
Print in Range
Print in Range (10 x 12 inch Paper)
```

### Tasks

- TASK-310 — Define invoice print model.
- TASK-311 — Define print template contract.
- TASK-312 — Implement print-ready invoice DTO.
- TASK-313 — Implement invoice print view.
- TASK-314 — Integrate PrinterService.
- TASK-315 — Implement print action.
- TASK-316 — Add print audit.
- TASK-317 — Add tests.

---

## US-288 — Reprint/view invoice

### Tasks

- TASK-318 — Implement invoice lookup.
- TASK-319 — Implement invoice preview.
- TASK-320 — Implement reprint permission.
- TASK-321 — Implement reprint.
- TASK-322 — Track print status if supported by schema.
- TASK-323 — Add audit.
- TASK-324 — Add tests.

---

## US-289 — Print non-printed invoices

### Tasks

- TASK-325 — Define print-status query.
- TASK-326 — Implement non-printed invoice list.
- TASK-327 — Implement bulk print workflow.
- TASK-328 — Handle print failures.
- TASK-329 — Add UI.
- TASK-330 — Add tests.

---

# 21. FEAT-110 — Sales Search & History

## US-290 — Sales Invoice search

### Tasks

- TASK-331 — Search by invoice number.
- TASK-332 — Search by customer.
- TASK-333 — Search by date range.
- TASK-334 — Search by Medicine.
- TASK-335 — Search by Batch.
- TASK-336 — Search by cashier/user.
- TASK-337 — Search by payment state.
- TASK-338 — Search by status.
- TASK-339 — Add pagination.
- TASK-340 — Add sorting.
- TASK-341 — Implement API.
- TASK-342 — Implement UI.
- TASK-343 — Add tests.

---

## US-291 — Customer Sales History

### Tasks

- TASK-344 — Define customer history query.
- TASK-345 — Implement customer sales history.
- TASK-346 — Filter by date.
- TASK-347 — Filter by Medicine.
- TASK-348 — Show invoice details.
- TASK-349 — Show return information.
- TASK-350 — Add pagination.
- TASK-351 — Implement API.
- TASK-352 — Implement UI.
- TASK-353 — Add tests.

---

## US-292 — Medicine/Batch sales history

### Tasks

- TASK-354 — Define Medicine sales-history query.
- TASK-355 — Define Batch sales-history query.
- TASK-356 — Implement Medicine history.
- TASK-357 — Implement Batch history.
- TASK-358 — Add date filtering.
- TASK-359 — Add customer filtering.
- TASK-360 — Add pagination.
- TASK-361 — Implement API.
- TASK-362 — Add tests.

---

# 22. FEAT-111 — Delivery Challan / Temporary Sales Boundary

The legacy application has a Sales Delivery Challan (DM) workflow:

```text
New
Change
Delete
DM Pending Report
Invoice Conversion
```

## US-293 — Define Delivery Challan scope

### Tasks

- TASK-363 — Determine whether Delivery Challan is required in modern scope.
- TASK-364 — Determine whether it requires a separate table.
- TASK-365 — Determine conversion rules.
- TASK-366 — Determine pending-DM behavior.
- TASK-367 — Define inventory impact.
- TASK-368 — Define invoice conversion behavior.
- TASK-369 — Document decision.
- TASK-370 — Create schema-finalization task if required.

---

## US-294 — Define temporary/stock issue boundary

Legacy Sales includes:

```text
Stock Issue
Issue Transfer To Invoice
```

### Tasks

- TASK-371 — Determine modern requirement.
- TASK-372 — Determine whether StockTransfer/StockAdjustment covers it.
- TASK-373 — Define temporary issue lifecycle.
- TASK-374 — Define invoice conversion behavior.
- TASK-375 — Define Inventory integration.
- TASK-376 — Document decision.
- TASK-377 — Create future feature if not included in Phase 8.

---

# 23. FEAT-112 — Sales Authorization & Audit

## US-295 — Sales permission model

Recommended permission catalog:

```text
Sales.View

Sales.Invoice.View
Sales.Invoice.Create
Sales.Invoice.Update
Sales.Invoice.Post
Sales.Invoice.Cancel
Sales.Invoice.Reprint

Sales.Payment.View
Sales.Payment.Create
Sales.Payment.Update
Sales.Payment.Cancel

Sales.Return.View
Sales.Return.Create
Sales.Return.Post
Sales.Return.Cancel

Sales.Cashier.Access
Sales.BarcodeBilling
Sales.CreditSale

Sales.Prescription.View
Sales.Prescription.Override
```

### Tasks

- TASK-378 — Finalize Sales permissions.
- TASK-379 — Seed permissions.
- TASK-380 — Map permissions to roles.
- TASK-381 — Implement backend guards.
- TASK-382 — Implement frontend visibility.
- TASK-383 — Test invoice permission.
- TASK-384 — Test payment permission.
- TASK-385 — Test return permission.
- TASK-386 — Test cancellation permission.
- TASK-387 — Test prescription override permission.

---

## US-296 — Audit Sales operations

### Events

```text
SalesInvoiceCreated
SalesInvoiceUpdated
SalesInvoicePosted
SalesInvoiceCancelled
SalesInvoiceReversed

SalesPaymentCreated
SalesPaymentUpdated

SalesReturnCreated
SalesReturnPosted
SalesReturnCancelled

SalesStockDeducted
SalesStockRestored

SalesInvoicePrinted
SalesInvoiceReprinted
PrescriptionOverrideUsed
```

### Tasks

- TASK-388 — Define Sales audit taxonomy.
- TASK-389 — Audit invoice creation.
- TASK-390 — Audit invoice update.
- TASK-391 — Audit invoice posting.
- TASK-392 — Audit invoice cancellation.
- TASK-393 — Audit payment.
- TASK-394 — Audit return.
- TASK-395 — Audit stock deduction.
- TASK-396 — Audit stock restoration.
- TASK-397 — Audit print/reprint.
- TASK-398 — Capture actor.
- TASK-399 — Capture transaction UUID.
- TASK-400 — Add tests.

---

# 24. FEAT-113 — Sales REST API & NestJS Services

## US-297 — Sales REST APIs

Suggested API surface:

```text
GET    /sales/invoices
POST   /sales/invoices
GET    /sales/invoices/{id}
PUT    /sales/invoices/{id}
POST   /sales/invoices/{id}/post
POST   /sales/invoices/{id}/cancel
POST   /sales/invoices/{id}/reverse

GET    /sales/invoices/{id}/print

GET    /sales/payments
POST   /sales/payments
GET    /sales/payments/{id}

GET    /sales/returns
POST   /sales/returns
GET    /sales/returns/{id}
POST   /sales/returns/{id}/post
POST   /sales/returns/{id}/cancel

GET    /sales/history/customer/{customerId}
GET    /sales/history/medicine/{medicineId}
GET    /sales/history/batch/{batchId}

GET    /sales/medicine-search
GET    /sales/batch-availability
GET    /sales/barcode/{barcode}
```

### Tasks

- TASK-401 — Define Sales API conventions.
- TASK-402 — Define request DTOs.
- TASK-403 — Define response DTOs.
- TASK-404 — Define pagination.
- TASK-405 — Define filtering.
- TASK-406 — Define sorting.
- TASK-407 — Define standard errors.
- TASK-408 — Implement SalesInvoiceController.
- TASK-409 — Implement SalesPaymentController.
- TASK-410 — Implement SalesReturnController.
- TASK-411 — Implement SalesHistoryController.
- TASK-412 — Implement SalesLookupController.
- TASK-413 — Add API documentation.
- TASK-414 — Add API tests.

---

## US-298 — Sales domain services

### Tasks

- TASK-415 — Implement SalesInvoiceService.
- TASK-416 — Implement SalesInvoiceItemService.
- TASK-417 — Implement SalesCalculationService.
- TASK-418 — Implement SalesValidationService.
- TASK-419 — Implement SalesPaymentService.
- TASK-420 — Implement SalesReturnService.
- TASK-421 — Implement SalesInventoryService.
- TASK-422 — Implement SalesPricingService integration.
- TASK-423 — Implement SalesTaxService integration.
- TASK-424 — Implement SalesQueryService.
- TASK-425 — Implement SalesLifecycleService.
- TASK-426 — Implement SalesAudit integration.
- TASK-427 — Add unit tests.

---

# 25. FEAT-114 — Angular Sales UI

## US-299 — Sales module structure

Recommended structure:

```text
sales/
├── invoices/
├── payments/
├── returns/
├── cashier/
├── history/
├── components/
└── services/
```

### Tasks

- TASK-428 — Create Sales route.
- TASK-429 — Create Sales feature module/standalone feature structure.
- TASK-430 — Create Sales service layer.
- TASK-431 — Create reusable item-grid component.
- TASK-432 — Create reusable customer selector.
- TASK-433 — Create reusable medicine selector.
- TASK-434 — Create reusable batch selector.
- TASK-435 — Create reusable totals component.
- TASK-436 — Add route guards.
- TASK-437 — Add tests.

---

## US-300 — Sales Invoice UI

### Screen

```text
Customer
Invoice No / Date

Medicine Search / Barcode
        ↓
Invoice Items
----------------------------------
Medicine
Batch
Expiry
Qty
Rate
Discount
Tax
Amount
----------------------------------

Gross
Discount
Tax
Rounding
Net Total

Payment

[Save/Post] [Print] [Cancel]
```

### Tasks

- TASK-438 — Create invoice screen.
- TASK-439 — Customer selector.
- TASK-440 — Medicine search.
- TASK-441 — Barcode input.
- TASK-442 — Batch selector.
- TASK-443 — Quantity editor.
- TASK-444 — Discount display.
- TASK-445 — Tax display.
- TASK-446 — Item totals.
- TASK-447 — Invoice totals.
- TASK-448 — Payment panel.
- TASK-449 — Save/post action.
- TASK-450 — Print action.
- TASK-451 — Cancel action.
- TASK-452 — Keyboard navigation.
- TASK-453 — Loading states.
- TASK-454 — Validation errors.
- TASK-455 — Tests.

---

## US-301 — Sales Return UI

### Tasks

- TASK-456 — Create return list.
- TASK-457 — Create return form.
- TASK-458 — Invoice lookup.
- TASK-459 — Customer lookup.
- TASK-460 — Returnable-item display.
- TASK-461 — Batch display.
- TASK-462 — Return quantity editor.
- TASK-463 — Return reason selector.
- TASK-464 — Return total.
- TASK-465 — Post return.
- TASK-466 — Print/view return.
- TASK-467 — Keyboard navigation.
- TASK-468 — Tests.

---

## US-302 — Payment UI

### Tasks

- TASK-469 — Create payment panel.
- TASK-470 — Add payment method.
- TASK-471 — Add payment amount.
- TASK-472 — Add split-payment UI if supported.
- TASK-473 — Add change/due calculation.
- TASK-474 — Add credit-sale UI if permitted.
- TASK-475 — Add validation.
- TASK-476 — Add keyboard shortcuts.
- TASK-477 — Add tests.

---

# 26. FEAT-115 — Offline-First Sales & Synchronization

## US-303 — Sales Outbox integration

### Events

```text
SalesInvoiceCreated
SalesInvoicePosted
SalesInvoiceCancelled
SalesInvoiceReversed

SalesPaymentCreated

SalesReturnCreated
SalesReturnPosted
SalesReturnCancelled
```

### Tasks

- TASK-478 — Define Sales mutation events.
- TASK-479 — Define invoice Outbox payload.
- TASK-480 — Define payment Outbox payload.
- TASK-481 — Define return Outbox payload.
- TASK-482 — Write Outbox transactionally.
- TASK-483 — Implement retry.
- TASK-484 — Implement failure tracking.
- TASK-485 — Add tests.

---

## US-304 — Sales idempotency

### Required protection

Repeated requests must not create:

```text
Duplicate invoice
Duplicate payment
Duplicate return
Duplicate stock deduction
Duplicate stock restoration
```

### Tasks

- TASK-486 — Define transaction UUID.
- TASK-487 — Store transaction identity.
- TASK-488 — Implement invoice deduplication.
- TASK-489 — Implement payment deduplication.
- TASK-490 — Implement return deduplication.
- TASK-491 — Implement stock-posting deduplication.
- TASK-492 — Implement sync replay protection.
- TASK-493 — Add tests.

---

## US-305 — Sales conflict handling

### Tasks

- TASK-494 — Define invoice edit conflict.
- TASK-495 — Define payment conflict.
- TASK-496 — Define return conflict.
- TASK-497 — Define stock concurrency conflict.
- TASK-498 — Implement optimistic locking.
- TASK-499 — Return actionable conflict errors.
- TASK-500 — Integrate SyncConflict where applicable.
- TASK-501 — Add tests.

---

## US-306 — Sales event-driven integration

### Events

```text
SaleCompleted
StockUpdated
InvoicePrinted
```

The architecture explicitly gives `SaleCompleted` and `StockUpdated` as event examples.

### Tasks

- TASK-502 — Define SaleCompleted event.
- TASK-503 — Define StockUpdated interaction.
- TASK-504 — Publish SaleCompleted after successful transaction.
- TASK-505 — Publish invoice-printed event if required.
- TASK-506 — Ensure event retry safety.
- TASK-507 — Add consumers where required.
- TASK-508 — Add event tests.

---

# 27. FEAT-116 — Sales Testing, Performance & Readiness

## US-307 — Unit tests

### Tasks

- TASK-509 — Invoice validation tests.
- TASK-510 — Invoice item tests.
- TASK-511 — Quantity validation tests.
- TASK-512 — Batch validation tests.
- TASK-513 — Pricing integration tests.
- TASK-514 — Discount tests.
- TASK-515 — Tax tests.
- TASK-516 — Calculation tests.
- TASK-517 — Payment tests.
- TASK-518 — Return tests.
- TASK-519 — Lifecycle tests.
- TASK-520 — Inventory integration tests.
- TASK-521 — Idempotency tests.
- TASK-522 — Concurrency tests.

---

## US-308 — API integration tests

### Tasks

- TASK-523 — Invoice API tests.
- TASK-524 — Payment API tests.
- TASK-525 — Return API tests.
- TASK-526 — Medicine-search API tests.
- TASK-527 — Batch-availability API tests.
- TASK-528 — Barcode API tests.
- TASK-529 — History API tests.
- TASK-530 — Authorization failure tests.
- TASK-531 — Validation failure tests.
- TASK-532 — Rollback tests.
- TASK-533 — Duplicate-request tests.

---

## US-309 — End-to-end billing workflows

### Workflow A — Cash Sale

```text
Open Cashier
 ↓
Search/Scan Medicine
 ↓
Select Batch
 ↓
Enter Quantity
 ↓
Calculate Total
 ↓
Payment
 ↓
Post Invoice
 ↓
Deduct Stock
 ↓
Create StockMovement
 ↓
Print
```

### Workflow B — Prescription Sale

```text
Prescription
 ↓
Customer
 ↓
Medicine
 ↓
Batch
 ↓
Sales Invoice
 ↓
Stock
 ↓
Payment
 ↓
Print
```

### Workflow C — Sales Return

```text
Original Invoice
 ↓
Select Item
 ↓
Return Quantity
 ↓
Validate
 ↓
Increase Stock
 ↓
StockMovement
 ↓
Return Complete
```

### Workflow D — Offline Sale

```text
Local Sale
 ↓
SQLite
 ↓
Outbox
 ↓
Later Sync
 ↓
Cloud
```

### Tasks

- TASK-534 — E2E cash-sale workflow.
- TASK-535 — E2E multi-item sale.
- TASK-536 — E2E barcode sale.
- TASK-537 — E2E prescription sale.
- TASK-538 — E2E credit sale if enabled.
- TASK-539 — E2E split payment if enabled.
- TASK-540 — E2E sales return.
- TASK-541 — E2E stock restoration.
- TASK-542 — E2E duplicate submission.
- TASK-543 — E2E offline sale.
- TASK-544 — E2E synchronization retry.
- TASK-545 — E2E concurrent-sale scenario.

---

## US-310 — Performance testing

Architecture targets:

```text
Medicine Search < 200ms
Invoice Save    < 500ms
Barcode Scan    < 100ms
```

### Tasks

- TASK-546 — Define realistic Medicine dataset.
- TASK-547 — Define realistic Batch dataset.
- TASK-548 — Define realistic Sales dataset.
- TASK-549 — Benchmark Medicine search.
- TASK-550 — Benchmark Batch availability.
- TASK-551 — Benchmark barcode lookup.
- TASK-552 — Benchmark invoice save.
- TASK-553 — Benchmark invoice posting.
- TASK-554 — Benchmark stock deduction.
- TASK-555 — Benchmark customer history.
- TASK-556 — Inspect query plans.
- TASK-557 — Add justified indexes.
- TASK-558 — Repeat benchmarks.
- TASK-559 — Document performance results.

---

## US-311 — SQLite/PostgreSQL compatibility

### Tasks

- TASK-560 — Validate SQLite Sales schema.
- TASK-561 — Validate PostgreSQL Sales schema.
- TASK-562 — Validate foreign keys.
- TASK-563 — Validate unique constraints.
- TASK-564 — Validate indexes.
- TASK-565 — Validate transactions.
- TASK-566 — Validate monetary precision.
- TASK-567 — Validate quantity precision.
- TASK-568 — Validate optimistic locking.
- TASK-569 — Validate soft delete.
- TASK-570 — Run SQLite integration suite.
- TASK-571 — Run PostgreSQL integration suite.

---

## US-312 — Sales documentation

### Tasks

- TASK-572 — Document Sales domain.
- TASK-573 — Document invoice lifecycle.
- TASK-574 — Document payment lifecycle.
- TASK-575 — Document return lifecycle.
- TASK-576 — Document Sales → Inventory contract.
- TASK-577 — Document Pricing integration.
- TASK-578 — Document Tax integration.
- TASK-579 — Document Prescription integration.
- TASK-580 — Document barcode workflow.
- TASK-581 — Document cashier workflow.
- TASK-582 — Document permissions.
- TASK-583 — Document audit events.
- TASK-584 — Document synchronization.
- TASK-585 — Document idempotency.
- TASK-586 — Document API contracts.

---

## US-313 — Phase readiness and sign-off

### Tasks

- TASK-587 — Complete Sales database review.
- TASK-588 — Complete backend code review.
- TASK-589 — Complete Angular code review.
- TASK-590 — Complete Inventory integration review.
- TASK-591 — Complete Pricing integration review.
- TASK-592 — Complete Prescription integration review.
- TASK-593 — Complete security review.
- TASK-594 — Complete audit review.
- TASK-595 — Complete synchronization review.
- TASK-596 — Complete performance review.
- TASK-597 — Complete QA review.
- TASK-598 — Validate all acceptance criteria.
- TASK-599 — Validate Financial integration contract.
- TASK-600 — Validate Reporting integration requirements.
- TASK-601 — Complete Phase 8 sign-off.

---

# 28. Sales Permission Catalog

Recommended initial permissions:

```text
Sales.View

Sales.Invoice.View
Sales.Invoice.Create
Sales.Invoice.Update
Sales.Invoice.Post
Sales.Invoice.Cancel
Sales.Invoice.Reverse
Sales.Invoice.Reprint

Sales.Payment.View
Sales.Payment.Create
Sales.Payment.Update
Sales.Payment.Cancel

Sales.Return.View
Sales.Return.Create
Sales.Return.Post
Sales.Return.Cancel

Sales.Cashier.Access
Sales.BarcodeBilling
Sales.CreditSale

Sales.Prescription.View
Sales.Prescription.Override
```

All backend authorization must be enforced in NestJS. UI permission checks are for usability only and must not be treated as security.

---

# 29. Core Sales Business Rules

## Rule 1 — Sales does not own stock

Never:

```text
SalesService
   ↓
UPDATE Stock
```

Instead:

```text
SalesService
   ↓
Inventory StockService
   ↓
Stock
   +
StockMovement
```

---

## Rule 2 — Revalidate stock at posting

A user may open an invoice when:

```text
Stock = 10
```

but another cashier can sell:

```text
8 units
```

before the first invoice is posted.

Therefore the final operation must revalidate:

```text
Available Stock >= Requested Quantity
```

inside the transaction.

---

## Rule 3 — Invoice calculation is server authoritative

Angular may show provisional totals.

NestJS must recalculate:

```text
Quantity
Price
Discount
Tax
Rounding
Net Amount
```

and reject manipulated totals.

---

## Rule 4 — Posted invoices are not casually edited

For a posted invoice:

```text
Incorrect invoice
      ↓
Controlled reversal/correction
      ↓
Inventory reversal
      ↓
Audit
```

Do not silently mutate historical posted transactions.

---

## Rule 5 — Sales Return restores stock through Inventory

Never directly modify stock from Sales Return.

```text
SalesReturn
    ↓
Inventory StockService
    ↓
Stock increase
    ↓
StockMovement
```

---

## Rule 6 — Payment is separate from invoice

The invoice establishes the sale.

Payment establishes settlement.

Do not combine these into one uncontrolled service.

---

## Rule 7 — Duplicate posting must be harmless

The same transaction UUID arriving twice must not:

```text
Create two invoices
Deduct stock twice
Create two payments
Create two returns
```

---

# 30. Data Ownership

| Data | Owner |
|---|---|
| Customer | Party |
| Medicine | Medicine Master |
| Batch | Inventory |
| Stock | Inventory |
| StockMovement | Inventory |
| SalesInvoice | Sales |
| SalesInvoiceItem | Sales |
| SalesReturn | Sales |
| SalesReturnItem | Sales |
| SalesPayment | Sales |
| PriceList | Pricing |
| Tax | Pricing |
| DiscountRule | Pricing |
| Prescription | Prescription |
| Payment/Accounting | Financial |
| Audit | Audit |
| Sync | Synchronization |

---

# 31. Integration Architecture

```text
                 CUSTOMER
                    │
                    ▼
             SALES INVOICE
                    │
         ┌──────────┼───────────┐
         ▼          ▼           ▼
     PRESCRIPTION PRICING     TAX
                    │
                    ▼
                 PAYMENT
                    │
                    ▼
              STOCK DEDUCTION
                    │
                    ▼
              STOCK MOVEMENT
                    │
                    ▼
                  AUDIT
                    │
                    ▼
                 OUTBOX
                    │
                    ▼
                  SYNC
```

Return flow:

```text
Sales Return
     ↓
Validate original sale
     ↓
Validate return quantity
     ↓
Inventory StockService
     ↓
Stock increase
     ↓
StockMovement
     ↓
Audit
     ↓
Outbox
```

---

# 32. Legacy Feature Mapping

| Legacy Sales capability | Modern Phase 8 treatment |
|---|---|
| Invoicing New | SalesInvoice |
| Invoicing Change | Controlled invoice editing |
| Delete | Controlled cancellation/reversal |
| Re-Print/View | Invoice viewing/reprinting |
| Print Non Printed | Print-status workflow |
| Print in Range | Printing/query feature |
| Invoice Verification | Invoice validation/verification |
| Sale Updation | Controlled correction workflow |
| Cashier Window | Fast cashier UI |
| Sales Delivery Challan | Boundary analysis + optional implementation |
| DM Pending Report | Boundary analysis/reporting |
| Invoice Conversion | Boundary analysis |
| Customer Return Goods | SalesReturn |
| Pending Cash | SalesPayment/Financial boundary |
| Stock Issue | Boundary with Inventory |
| Issue Transfer To Invoice | Boundary analysis |
| Quotation Entry | Future/controlled scope unless explicitly required |
| Sales Posting in Accounts | Financial integration |
| Sales Return Posting in Accounts | Financial integration |

---

# 33. Reporting Readiness

The legacy material contains Sales reporting concepts including:

```text
Sales Register
    - Both
    - Cash
    - Credit
    - Card
    - Free

Billwise Sale Register
User Wise Sale Register
Companywise Sales Register
Gross Profit Productwise
Gross Profit Billwise
Gross Profit Doctor-Wise
Gross Profit Date-Wise
Customer Return Goods Register
Customer Return Goods Summary
```

Phase 8 should expose clean query services so these reports can later be built.

Complete reporting is not part of the core Sales implementation.

---

# 34. Testing Matrix

| Area | Required coverage |
|---|---|
| Invoice | Create / Update / Post / Cancel / Reverse |
| Items | Add / Edit / Remove |
| Medicine | Search / Selection |
| Barcode | Lookup / Scan |
| Batch | Selection / Availability |
| Pricing | Price resolution |
| Discount | Rule application |
| Tax | Calculation |
| Payment | Cash / configured methods |
| Credit | Eligibility / limit |
| Return | Create / Post / Cancel |
| Stock | Deduction / restoration |
| StockMovement | Sale / Return |
| Prescription | Link / validation |
| Printing | Print / reprint |
| Authorization | Allowed / denied |
| Audit | All mutations |
| Idempotency | Duplicate requests |
| Offline | Local sale |
| Sync | Retry / replay |
| Concurrency | Two sales against same stock |
| Performance | Search / barcode / posting |
| Database | SQLite / PostgreSQL |

---

# 35. Definition of Done

Phase 8 is complete only when:

- [ ] Sales schema finalized.
- [ ] SalesInvoice implemented.
- [ ] SalesInvoiceItem implemented.
- [ ] SalesReturn implemented.
- [ ] SalesReturnItem implemented.
- [ ] SalesPayment implemented.
- [ ] Customer selection implemented.
- [ ] Medicine search implemented.
- [ ] Batch selection implemented.
- [ ] Stock availability validation implemented.
- [ ] Pricing integration implemented.
- [ ] Discount integration implemented.
- [ ] Tax integration implemented.
- [ ] Server-side calculations implemented.
- [ ] Sales Invoice lifecycle implemented.
- [ ] Stock deduction implemented through Inventory.
- [ ] StockMovement generated for sales.
- [ ] Sales Return implemented.
- [ ] Stock restored through Inventory.
- [ ] Prescription linkage implemented where required.
- [ ] Barcode billing implemented.
- [ ] Cashier workflow implemented.
- [ ] Keyboard-first workflow implemented.
- [ ] Invoice printing implemented.
- [ ] Invoice reprinting implemented.
- [ ] Sales history implemented.
- [ ] Permissions implemented.
- [ ] Audit implemented.
- [ ] Outbox implemented.
- [ ] Idempotency implemented.
- [ ] Conflict handling implemented.
- [ ] Unit tests pass.
- [ ] API tests pass.
- [ ] E2E tests pass.
- [ ] Performance targets verified.
- [ ] SQLite verified.
- [ ] PostgreSQL verified.
- [ ] Documentation complete.
- [ ] Financial integration contract ready.
- [ ] Reporting query contract ready.
- [ ] QA sign-off complete.

---

# 36. Phase 8 Summary

| Type | Count |
|---|---:|
| Epic | 1 |
| Features | 21 |
| User Stories | 56 |
| Tasks | 601 |
| **Total Work Items** | **679** |

The backlog is deliberately separated across:

```text
Database
Backend
Business Rules
API
Angular UI
Inventory Integration
Pricing Integration
Prescription Integration
Payment
Barcode
Printing
Security
Audit
Offline/Sync
Testing
Performance
Documentation
```

---

# 37. Final Phase Architecture

```text
                      CUSTOMER
                         │
                         ▼
                 ┌───────────────┐
                 │ SALES INVOICE │
                 └───────┬───────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
 Prescription         Pricing            Tax
        │                │                │
        └────────────────┼────────────────┘
                         ▼
                    Sales Items
                         │
                         ▼
                   Batch Selection
                         │
                         ▼
                Inventory Validation
                         │
                         ▼
                    Stock Deduct
                         │
                         ▼
                   StockMovement
                         │
                         ▼
                     Payment
                         │
                         ▼
                      Print
                         │
                         ▼
                       Audit
                         │
                         ▼
                      Outbox
                         │
                         ▼
                        Sync


Return:

Sales Return
     │
     ▼
Original Invoice
     │
     ▼
Batch / Quantity Validation
     │
     ▼
Inventory StockService
     │
     ▼
Stock Increase
     │
     ▼
StockMovement
     │
     ▼
Audit
     │
     ▼
Outbox
```

## Critical Phase 8 principle

> **Sales owns the billing transaction; Inventory owns the physical stock transaction.**

The cashier should experience this as one fast operation, but internally the domains remain cleanly separated.
