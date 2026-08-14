# Phase 9 — Financial Management & Accounting

## 1. Purpose

Phase 9 implements the Pharmacy ERP Financial domain.

The approved database overview defines Financial as:

> Accounting and payment tracking.

The Financial module contains:

```text
Payment
Receipt
Ledger
LedgerEntry
```

The database relationship is:

```text
                 Ledger
                   │
          ┌────────┴────────┐
          ▼                 ▼
       Receipt           Payment
```



This phase therefore establishes the accounting foundation required by Purchase, Sales, Customer/Supplier outstanding, and future reporting.

The legacy application material shows a substantially broader accounting workflow including:

```text
Cash Receipt
Cash Payment
Bank Receipt
Bank Payment
Journal Voucher
Purchase Voucher
Adjust Outstanding — Debtors
Opening Bill Entry — Debtors
Adjust Outstanding — Creditors
Opening Bill Entry — Creditors
Voucher View / Modify
Voucher Reprint
Bank Slip Printing
Post Dated Cheques
Voucher Narration
Cash Book
Bank Book
Journal Register
Purchase Register
Cash Receipt Register
Bank Receipt Register
Cash Payment Register
Bank Payment Register
Day Book
Trial Balance
Profit & Loss
Balance Sheet
Customer Outstanding
Creditors Outstanding
Bank Reconciliation
```



Important: the approved modern database currently contains only four Financial tables. The legacy accounting menu contains more concepts than the approved schema. Therefore this phase explicitly includes **schema-finalization and boundary-analysis work** rather than silently inventing additional tables.

---

# 2. Phase 9 Scope

Phase 9 covers:

```text
Financial domain model
Payment
Receipt
Ledger
LedgerEntry
Double-entry accounting foundation
Debit/Credit rules
Journal posting
Sales integration
Purchase integration
Customer outstanding
Supplier outstanding
Cash transactions
Bank transactions
Journal transactions
Opening balances
Adjustments
Voucher lifecycle
Voucher cancellation/reversal
Financial year boundary
Ledger views
Cash Book
Bank Book
Day Book
Trial Balance
P&L / Balance Sheet boundary
Bank reconciliation boundary
Cheque / PDC boundary
Financial permissions
Financial audit
Backend services/API
Angular financial UI
Offline-first accounting
Outbox
Idempotency
Conflict handling
Testing
Performance
SQLite/PostgreSQL compatibility
Documentation
```

---

# 3. Domain Boundary

## Financial owns

```text
Payment
Receipt
Ledger
LedgerEntry

Accounting transaction lifecycle
Debit/Credit posting
Journal posting
Financial balances
Outstanding calculations
Financial validation
Financial audit events
Financial reporting query contracts
```

## Sales owns

```text
SalesInvoice
SalesInvoiceItem
SalesReturn
SalesReturnItem
SalesPayment
```

Sales creates the commercial transaction.

Financial owns the accounting settlement/posting boundary.

## Purchase owns

```text
PurchaseOrder
GoodsReceipt
PurchaseInvoice
PurchaseReturn
```

Purchase creates the procurement transaction.

Financial owns the accounting posting/settlement boundary.

## Party owns

```text
Customer
Supplier
```

Financial references Party identities for debtor/creditor accounting.

## Inventory owns

```text
Stock
StockMovement
```

Financial must not directly modify inventory.

---

# 4. Core Accounting Flow

## Sales

```text
Sales Invoice
      ↓
Financial Posting
      ↓
Customer / Cash / Bank
      ↓
LedgerEntry
```

## Purchase

```text
Purchase Invoice
      ↓
Financial Posting
      ↓
Supplier / Cash / Bank
      ↓
LedgerEntry
```

## Receipt

```text
Customer
   ↓
Receipt
   ↓
Cash / Bank
   ↓
LedgerEntry
```

## Payment

```text
Supplier / Expense / Other Party
   ↓
Payment
   ↓
Cash / Bank
   ↓
LedgerEntry
```

## Journal

```text
Journal Voucher
      ↓
Debit Account
      +
Credit Account
      ↓
LedgerEntry
```

---

# 5. ADO Hierarchy

```text
EPIC-009 — Financial Management & Accounting
│
├── FEAT-117 — Financial Domain & Data Model
├── FEAT-118 — Ledger & Chart-of-Accounts Boundary
├── FEAT-119 — LedgerEntry & Double-Entry Posting
├── FEAT-120 — Payment Management
├── FEAT-121 — Receipt Management
├── FEAT-122 — Journal Voucher
├── FEAT-123 — Sales Financial Integration
├── FEAT-124 — Purchase Financial Integration
├── FEAT-125 — Customer Outstanding
├── FEAT-126 — Supplier Outstanding
├── FEAT-127 — Cash Management
├── FEAT-128 — Bank Management
├── FEAT-129 — Opening Balance & Adjustments
├── FEAT-130 — Voucher Lifecycle & Reversal
├── FEAT-131 — Financial Year & Period Controls
├── FEAT-132 — Ledger & Accounting Views
├── FEAT-133 — Trial Balance & Financial Statement Boundary
├── FEAT-134 — Bank Reconciliation Boundary
├── FEAT-135 — Cheque & Post-Dated Payment Boundary
├── FEAT-136 — Financial Permissions & Audit
├── FEAT-137 — Financial REST API & NestJS Services
├── FEAT-138 — Angular Financial UI
├── FEAT-139 — Offline Financial Transactions & Synchronization
└── FEAT-140 — Financial Testing, Performance & Readiness
```

---

# 6. EPIC-009 — Financial Management & Accounting

## Objective

Create the accounting foundation that records monetary transactions consistently and provides reliable ledger/outstanding information.

## Epic completion criteria

- [ ] Financial schema finalized.
- [ ] Payment implemented.
- [ ] Receipt implemented.
- [ ] Ledger implemented.
- [ ] LedgerEntry implemented.
- [ ] Debit/Credit rules established.
- [ ] Double-entry validation implemented.
- [ ] Sales integration contract implemented.
- [ ] Purchase integration contract implemented.
- [ ] Customer outstanding supported.
- [ ] Supplier outstanding supported.
- [ ] Cash transaction workflow supported.
- [ ] Bank transaction workflow supported.
- [ ] Journal workflow supported if approved.
- [ ] Opening balances defined.
- [ ] Adjustments defined.
- [ ] Voucher lifecycle implemented.
- [ ] Cancellation/reversal implemented.
- [ ] Financial-year controls implemented.
- [ ] Ledger views implemented.
- [ ] Trial Balance boundary implemented.
- [ ] Financial statement boundary documented.
- [ ] Bank reconciliation boundary documented/implemented as approved.
- [ ] Cheque/PDC boundary documented/implemented as approved.
- [ ] Permissions implemented.
- [ ] Audit implemented.
- [ ] Offline/Outbox support implemented.
- [ ] Idempotency implemented.
- [ ] Tests completed.
- [ ] SQLite/PostgreSQL compatibility validated.

---

# 7. FEAT-117 — Financial Domain & Data Model

## US-314 — Finalize Financial schema

### Acceptance Criteria

1. `Payment` is represented.
2. `Receipt` is represented.
3. `Ledger` is represented.
4. `LedgerEntry` is represented.
5. Relationships between financial entities are explicit.
6. Party references are explicit.
7. Source transaction references are explicit.
8. UUID synchronization conventions are followed.
9. Soft-delete and versioning conventions are followed where appropriate.
10. Monetary precision is appropriate for accounting.

### Tasks

- TASK-001 — Review Payment table specification.
- TASK-002 — Review Receipt table specification.
- TASK-003 — Review Ledger table specification.
- TASK-004 — Review LedgerEntry table specification.
- TASK-005 — Define Payment ownership.
- TASK-006 — Define Receipt ownership.
- TASK-007 — Define Ledger ownership.
- TASK-008 — Define LedgerEntry ownership.
- TASK-009 — Define Customer reference.
- TASK-010 — Define Supplier reference.
- TASK-011 — Define source transaction reference.
- TASK-012 — Define source module reference.
- TASK-013 — Define transaction UUID.
- TASK-014 — Define financial transaction status.
- TASK-015 — Define posting date.
- TASK-016 — Define accounting date.
- TASK-017 — Define fiscal-period relationship.
- TASK-018 — Define cancellation/reversal metadata.
- TASK-019 — Define versioning.
- TASK-020 — Define soft-delete behavior.
- TASK-021 — Implement Prisma Payment model.
- TASK-022 — Implement Prisma Receipt model.
- TASK-023 — Implement Prisma Ledger model.
- TASK-024 — Implement Prisma LedgerEntry model.
- TASK-025 — Add foreign keys.
- TASK-026 — Add unique constraints.
- TASK-027 — Add financial indexes.
- TASK-028 — Add timestamps.
- TASK-029 — Add UUID fields.
- TASK-030 — Add version fields where required.
- TASK-031 — Create Prisma migration.
- TASK-032 — Validate SQLite.
- TASK-033 — Validate PostgreSQL.
- TASK-034 — Review migration with accounting/business owner.

---

# 8. FEAT-118 — Ledger & Chart-of-Accounts Boundary

The approved database overview defines `Ledger`, but does not provide a separate Chart-of-Accounts table in the supplied schema overview. Therefore the exact account-master design must be finalized before implementing broad accounting functionality.

## US-315 — Finalize Ledger meaning

### Tasks

- TASK-035 — Define whether Ledger represents an account master.
- TASK-036 — Define whether Ledger represents a customer/supplier account.
- TASK-037 — Define account-code requirements.
- TASK-038 — Define account-name requirements.
- TASK-039 — Define account type.
- TASK-040 — Define account group.
- TASK-041 — Define parent-child account hierarchy.
- TASK-042 — Define active/inactive state.
- TASK-043 — Define system-generated accounts.
- TASK-044 — Define account uniqueness.
- TASK-045 — Define branch relationship.
- TASK-046 — Define financial-year behavior.
- TASK-047 — Document final Ledger semantics.

---

## US-316 — Determine whether a separate Chart-of-Accounts model is required

### Tasks

- TASK-048 — Compare legacy ledger structure with approved modern schema.
- TASK-049 — Identify required account hierarchy.
- TASK-050 — Identify required account groups.
- TASK-051 — Identify required system accounts.
- TASK-052 — Identify customer account behavior.
- TASK-053 — Identify supplier account behavior.
- TASK-054 — Determine whether Ledger alone is sufficient.
- TASK-055 — Create schema decision record.
- TASK-056 — Create follow-up schema story if additional table is required.

---

## US-317 — Ledger master UI/API boundary

### Tasks

- TASK-057 — Define account creation rules.
- TASK-058 — Define account modification rules.
- TASK-059 — Define account deactivation rules.
- TASK-060 — Define account search.
- TASK-061 — Define account hierarchy view.
- TASK-062 — Define API contract.
- TASK-063 — Define UI contract.
- TASK-064 — Add authorization requirements.
- TASK-065 — Add audit requirements.

---

# 9. FEAT-119 — LedgerEntry & Double-Entry Posting

## US-318 — Implement LedgerEntry

### Acceptance Criteria

Every posted accounting transaction must produce balanced debit and credit entries.

```text
Total Debit = Total Credit
```

### Tasks

- TASK-066 — Define LedgerEntry fields.
- TASK-067 — Define debit representation.
- TASK-068 — Define credit representation.
- TASK-069 — Define amount precision.
- TASK-070 — Define source transaction identity.
- TASK-071 — Define voucher identity.
- TASK-072 — Define narration.
- TASK-073 — Define posting timestamp.
- TASK-074 — Implement LedgerEntry Prisma model if not already covered.
- TASK-075 — Implement LedgerEntry repository.
- TASK-076 — Implement LedgerEntry service.
- TASK-077 — Add debit/credit validation.
- TASK-078 — Add balanced-entry validation.
- TASK-079 — Add database indexes.
- TASK-080 — Add tests.

---

## US-319 — Implement accounting posting engine

### Tasks

- TASK-081 — Define AccountingPostingService.
- TASK-082 — Define posting request.
- TASK-083 — Define posting response.
- TASK-084 — Define transaction boundary.
- TASK-085 — Validate source transaction.
- TASK-086 — Validate accounts.
- TASK-087 — Validate amounts.
- TASK-088 — Validate debit/credit balance.
- TASK-089 — Persist LedgerEntry rows atomically.
- TASK-090 — Prevent partial posting.
- TASK-091 — Add idempotency.
- TASK-092 — Add audit.
- TASK-093 — Add Outbox event.
- TASK-094 — Add tests.

---

## US-320 — Prevent unbalanced financial transactions

### Tasks

- TASK-095 — Reject debit-only transaction.
- TASK-096 — Reject credit-only transaction.
- TASK-097 — Reject unequal totals.
- TASK-098 — Reject zero-value invalid entries.
- TASK-099 — Reject duplicate source posting.
- TASK-100 — Add validation errors.
- TASK-101 — Add unit tests.
- TASK-102 — Add integration tests.

---

# 10. FEAT-120 — Payment Management

The database overview identifies Payment as a Financial table, while legacy accounting includes Cash Payment and Bank Payment. fileciteturn5file1turn5file3

## US-321 — Create Payment

### Acceptance Criteria

1. Authorized user can create a Payment.
2. Payment has a valid account/party.
3. Payment amount is positive.
4. Payment date is valid.
5. Payment method is valid.
6. Financial posting is balanced.
7. Duplicate transaction is prevented.
8. Payment is audited.

### Tasks

- TASK-103 — Define Payment lifecycle.
- TASK-104 — Define payment methods.
- TASK-105 — Define cash payment.
- TASK-106 — Define bank payment.
- TASK-107 — Define party payment.
- TASK-108 — Define expense payment.
- TASK-109 — Define payment date.
- TASK-110 — Define narration.
- TASK-111 — Create Payment DTO.
- TASK-112 — Implement PaymentService.
- TASK-113 — Implement payment validation.
- TASK-114 — Implement Payment API.
- TASK-115 — Integrate AccountingPostingService.
- TASK-116 — Add audit.
- TASK-117 — Add Outbox.
- TASK-118 — Add idempotency.
- TASK-119 — Add tests.

---

## US-322 — Cash Payment

### Tasks

- TASK-120 — Define cash account.
- TASK-121 — Validate available cash balance if required.
- TASK-122 — Create cash-payment posting.
- TASK-123 — Create LedgerEntry.
- TASK-124 — Add cash-book integration.
- TASK-125 — Add UI.
- TASK-126 — Add tests.

---

## US-323 — Bank Payment

### Tasks

- TASK-127 — Define bank-account relationship.
- TASK-128 — Define bank-payment fields.
- TASK-129 — Define cheque/reference details if approved.
- TASK-130 — Implement bank-payment posting.
- TASK-131 — Add bank-book integration.
- TASK-132 — Add UI.
- TASK-133 — Add tests.

---

# 11. FEAT-121 — Receipt Management

Legacy accounting includes Cash Receipt and Bank Receipt. 

## US-324 — Create Receipt

### Tasks

- TASK-134 — Define Receipt lifecycle.
- TASK-135 — Define cash receipt.
- TASK-136 — Define bank receipt.
- TASK-137 — Define customer receipt.
- TASK-138 — Define receipt amount.
- TASK-139 — Define receipt date.
- TASK-140 — Define narration.
- TASK-141 — Create Receipt DTO.
- TASK-142 — Implement ReceiptService.
- TASK-143 — Implement receipt validation.
- TASK-144 — Implement Receipt API.
- TASK-145 — Integrate AccountingPostingService.
- TASK-146 — Add audit.
- TASK-147 — Add Outbox.
- TASK-148 — Add idempotency.
- TASK-149 — Add tests.

---

## US-325 — Cash Receipt

### Tasks

- TASK-150 — Define cash receipt posting.
- TASK-151 — Validate customer/party.
- TASK-152 — Create cash LedgerEntry.
- TASK-153 — Add Cash Book integration.
- TASK-154 — Add receipt UI.
- TASK-155 — Add tests.

---

## US-326 — Bank Receipt

### Tasks

- TASK-156 — Define bank receipt posting.
- TASK-157 — Define cheque/deposit reference if approved.
- TASK-158 — Create bank LedgerEntry.
- TASK-159 — Add Bank Book integration.
- TASK-160 — Add UI.
- TASK-161 — Add tests.

---

# 12. FEAT-122 — Journal Voucher

Legacy accounting explicitly includes Journal Voucher. 

Because Journal Voucher is not separately represented in the approved Financial table list, the modern implementation must determine whether it is represented by `Payment`, `Receipt`, or a future/general voucher model.

## US-327 — Finalize Journal Voucher data model

### Tasks

- TASK-162 — Review legacy Journal Voucher requirements.
- TASK-163 — Identify journal-specific fields.
- TASK-164 — Identify multi-line debit/credit requirement.
- TASK-165 — Determine whether LedgerEntry can represent journal vouchers.
- TASK-166 — Determine whether a Journal/Voucher header is required.
- TASK-167 — Define source transaction reference.
- TASK-168 — Define narration.
- TASK-169 — Define posting status.
- TASK-170 — Create schema decision record.

---

## US-328 — Create Journal Voucher

### Tasks

- TASK-171 — Create Journal DTO.
- TASK-172 — Validate minimum two-sided entry.
- TASK-173 — Validate debit total.
- TASK-174 — Validate credit total.
- TASK-175 — Implement posting.
- TASK-176 — Implement transaction rollback.
- TASK-177 — Add authorization.
- TASK-178 — Add audit.
- TASK-179 — Add Outbox.
- TASK-180 — Add tests.

---

# 13. FEAT-123 — Sales Financial Integration

## US-329 — Post Sales Invoice to Financial

### Recommended accounting boundary

```text
Sales Invoice
       ↓
Sales completes commercial transaction
       ↓
Financial posting request
       ↓
LedgerEntry
```

Exact account mapping must be finalized with accounting requirements.

### Tasks

- TASK-181 — Define Sales → Financial contract.
- TASK-182 — Define source transaction UUID.
- TASK-183 — Define posting date.
- TASK-184 — Define customer/debtor account.
- TASK-185 — Define cash account mapping.
- TASK-186 — Define bank account mapping.
- TASK-187 — Define sales/revenue account mapping.
- TASK-188 — Define tax account mapping.
- TASK-189 — Define discount account treatment.
- TASK-190 — Define rounding account treatment.
- TASK-191 — Implement SalesPostingService.
- TASK-192 — Implement posting request.
- TASK-193 — Validate source invoice.
- TASK-194 — Validate posting amount.
- TASK-195 — Post LedgerEntry.
- TASK-196 — Prevent duplicate posting.
- TASK-197 — Add audit.
- TASK-198 — Add Outbox.
- TASK-199 — Add integration tests.

---

## US-330 — Post Sales Return to Financial

### Tasks

- TASK-200 — Define Sales Return → Financial contract.
- TASK-201 — Define return account mapping.
- TASK-202 — Define tax reversal behavior.
- TASK-203 — Define discount reversal behavior.
- TASK-204 — Implement return posting.
- TASK-205 — Validate source return.
- TASK-206 — Prevent duplicate posting.
- TASK-207 — Add audit.
- TASK-208 — Add tests.

---

# 14. FEAT-124 — Purchase Financial Integration

## US-331 — Post Purchase Invoice to Financial

### Tasks

- TASK-209 — Define Purchase → Financial contract.
- TASK-210 — Define supplier/creditor account.
- TASK-211 — Define purchase/expense account.
- TASK-212 — Define tax input account.
- TASK-213 — Define discount treatment.
- TASK-214 — Define rounding treatment.
- TASK-215 — Implement PurchasePostingService.
- TASK-216 — Validate Purchase Invoice.
- TASK-217 — Post LedgerEntry.
- TASK-218 — Prevent duplicate posting.
- TASK-219 — Add audit.
- TASK-220 — Add Outbox.
- TASK-221 — Add integration tests.

---

## US-332 — Post Purchase Return to Financial

### Tasks

- TASK-222 — Define Purchase Return → Financial contract.
- TASK-223 — Define supplier reversal.
- TASK-224 — Define tax reversal.
- TASK-225 — Define discount reversal.
- TASK-226 — Implement return posting.
- TASK-227 — Add idempotency.
- TASK-228 — Add audit.
- TASK-229 — Add tests.

---

# 15. FEAT-125 — Customer Outstanding

Legacy accounting explicitly contains Customer Outstanding Report and debtor adjustments/opening bills. 

## US-333 — Calculate customer outstanding

### Tasks

- TASK-230 — Define outstanding formula.
- TASK-231 — Identify customer ledger.
- TASK-232 — Include sales invoices.
- TASK-233 — Include customer receipts.
- TASK-234 — Include sales returns.
- TASK-235 — Include adjustments.
- TASK-236 — Define opening balance treatment.
- TASK-237 — Implement outstanding query.
- TASK-238 — Add date filtering.
- TASK-239 — Add customer filtering.
- TASK-240 — Add aging support if approved.
- TASK-241 — Add tests.

---

## US-334 — Customer outstanding screen

### Tasks

- TASK-242 — Create customer outstanding API.
- TASK-243 — Create customer outstanding UI.
- TASK-244 — Add customer search.
- TASK-245 — Add date range.
- TASK-246 — Show opening balance.
- TASK-247 — Show invoices.
- TASK-248 — Show receipts.
- TASK-249 — Show returns.
- TASK-250 — Show adjustments.
- TASK-251 — Show closing balance.
- TASK-252 — Add print/export boundary.
- TASK-253 — Add tests.

---

## US-335 — Adjust customer outstanding

### Tasks

- TASK-254 — Define debtor adjustment rules.
- TASK-255 — Define authorization.
- TASK-256 — Define adjustment narration.
- TASK-257 — Define source/reference.
- TASK-258 — Implement adjustment service.
- TASK-259 — Post LedgerEntry.
- TASK-260 — Add audit.
- TASK-261 — Add UI.
- TASK-262 — Add tests.

---

# 16. FEAT-126 — Supplier Outstanding

## US-336 — Calculate supplier outstanding

### Tasks

- TASK-263 — Define creditor outstanding formula.
- TASK-264 — Include purchase invoices.
- TASK-265 — Include supplier payments.
- TASK-266 — Include purchase returns.
- TASK-267 — Include adjustments.
- TASK-268 — Define opening balance.
- TASK-269 — Implement outstanding query.
- TASK-270 — Add date filtering.
- TASK-271 — Add supplier filtering.
- TASK-272 — Add aging support if approved.
- TASK-273 — Add tests.

---

## US-337 — Supplier outstanding screen

### Tasks

- TASK-274 — Create supplier outstanding API.
- TASK-275 — Create supplier outstanding UI.
- TASK-276 — Add supplier search.
- TASK-277 — Add date range.
- TASK-278 — Show opening balance.
- TASK-279 — Show purchase invoices.
- TASK-280 — Show payments.
- TASK-281 — Show purchase returns.
- TASK-282 — Show adjustments.
- TASK-283 — Show closing balance.
- TASK-284 — Add print/export boundary.
- TASK-285 — Add tests.

---

## US-338 — Adjust supplier outstanding

### Tasks

- TASK-286 — Define creditor adjustment.
- TASK-287 — Define authorization.
- TASK-288 — Implement adjustment service.
- TASK-289 — Post LedgerEntry.
- TASK-290 — Add audit.
- TASK-291 — Add UI.
- TASK-292 — Add tests.

---

# 17. FEAT-127 — Cash Management

## US-339 — Cash Book

Legacy accounting explicitly includes Cash Book and Datewise Cash Balance. 

### Tasks

- TASK-293 — Define cash account.
- TASK-294 — Define opening cash balance.
- TASK-295 — Query cash receipts.
- TASK-296 — Query cash payments.
- TASK-297 — Query cash adjustments.
- TASK-298 — Calculate running balance.
- TASK-299 — Implement Cash Book API.
- TASK-300 — Implement Cash Book UI.
- TASK-301 — Add date range.
- TASK-302 — Add opening/closing balance.
- TASK-303 — Add print/export boundary.
- TASK-304 — Add tests.

---

## US-340 — Datewise Cash Balance

### Tasks

- TASK-305 — Define daily balance calculation.
- TASK-306 — Implement daily aggregation.
- TASK-307 — Add date-range query.
- TASK-308 — Add UI.
- TASK-309 — Add tests.

---

# 18. FEAT-128 — Bank Management

## US-341 — Bank Book

### Tasks

- TASK-310 — Define bank account boundary.
- TASK-311 — Query bank receipts.
- TASK-312 — Query bank payments.
- TASK-313 — Query bank adjustments.
- TASK-314 — Calculate running balance.
- TASK-315 — Implement Bank Book API.
- TASK-316 — Implement Bank Book UI.
- TASK-317 — Add date filtering.
- TASK-318 — Add print/export boundary.
- TASK-319 — Add tests.

---

## US-342 — Bank account configuration boundary

### Tasks

- TASK-320 — Determine bank-account master location.
- TASK-321 — Determine whether Configuration owns bank accounts.
- TASK-322 — Determine Ledger relationship.
- TASK-323 — Define account number handling.
- TASK-324 — Define bank name.
- TASK-325 — Define branch/IFSC requirements if applicable.
- TASK-326 — Document schema decision.

---

# 19. FEAT-129 — Opening Balance & Adjustments

Legacy accounting includes Opening Bill Entry for both Debtors and Creditors. 

## US-343 — Opening customer balance

### Tasks

- TASK-327 — Define opening debtor balance.
- TASK-328 — Define opening bill behavior.
- TASK-329 — Define opening date.
- TASK-330 — Define source/reference.
- TASK-331 — Implement opening balance posting.
- TASK-332 — Prevent duplicate opening entry.
- TASK-333 — Add audit.
- TASK-334 — Add UI.
- TASK-335 — Add tests.

---

## US-344 — Opening supplier balance

### Tasks

- TASK-336 — Define opening creditor balance.
- TASK-337 — Define opening bill behavior.
- TASK-338 — Implement opening balance posting.
- TASK-339 — Prevent duplicate opening entry.
- TASK-340 — Add audit.
- TASK-341 — Add UI.
- TASK-342 — Add tests.

---

## US-345 — Financial adjustments

### Tasks

- TASK-343 — Define adjustment types.
- TASK-344 — Define allowable source accounts.
- TASK-345 — Define narration.
- TASK-346 — Define authorization.
- TASK-347 — Implement adjustment service.
- TASK-348 — Post LedgerEntry.
- TASK-349 — Add audit.
- TASK-350 — Add tests.

---

# 20. FEAT-130 — Voucher Lifecycle & Reversal

The legacy application provides Voucher View/Modify, Voucher Reprint and voucher cancellation/change registers. 

## US-346 — Financial transaction lifecycle

Recommended controlled lifecycle:

```text
Draft
  ↓
Confirmed
  ↓
Posted
  ↓
Reconciled (where applicable)
```

Exception paths:

```text
Draft → Cancelled
Posted → Reversed
```

### Tasks

- TASK-351 — Define financial status values.
- TASK-352 — Define valid transitions.
- TASK-353 — Define invalid transitions.
- TASK-354 — Implement lifecycle service.
- TASK-355 — Add transition validation.
- TASK-356 — Add tests.

---

## US-347 — Cancel financial transaction

### Tasks

- TASK-357 — Define cancellation rules.
- TASK-358 — Restrict cancellation of posted entries.
- TASK-359 — Define cancellation authorization.
- TASK-360 — Implement cancellation.
- TASK-361 — Add audit.
- TASK-362 — Add tests.

---

## US-348 — Reverse posted transaction

### Tasks

- TASK-363 — Define reversal rules.
- TASK-364 — Generate reversing LedgerEntry.
- TASK-365 — Link reversal to original.
- TASK-366 — Prevent multiple invalid reversals.
- TASK-367 — Add audit.
- TASK-368 — Add Outbox.
- TASK-369 — Add tests.

---

# 21. FEAT-131 — Financial Year & Period Controls

The legacy utility menu explicitly includes Change Financial Year and Year End Procedure. 

The approved database overview also defines `FinancialYear` under Configuration. 

## US-349 — Financial year integration

### Tasks

- TASK-370 — Define FinancialYear → Financial integration.
- TASK-371 — Determine active financial year.
- TASK-372 — Validate posting date.
- TASK-373 — Reject posting outside permitted period.
- TASK-374 — Implement financial-year context service.
- TASK-375 — Add tests.

---

## US-350 — Period locking

### Tasks

- TASK-376 — Define period-close requirements.
- TASK-377 — Define locked-period behavior.
- TASK-378 — Prevent transaction posting into locked period.
- TASK-379 — Prevent unauthorized changes.
- TASK-380 — Define reopen authorization.
- TASK-381 — Add audit.
- TASK-382 — Add tests.

---

## US-351 — Year-end boundary

### Tasks

- TASK-383 — Review legacy year-end process.
- TASK-384 — Define closing balance treatment.
- TASK-385 — Define opening balance carry-forward.
- TASK-386 — Define retained profit treatment.
- TASK-387 — Determine automation scope.
- TASK-388 — Document year-end procedure.
- TASK-389 — Create implementation story if required.

---

# 22. FEAT-132 — Ledger & Accounting Views

## US-352 — Ledger view

Legacy accounting provides Ledger View/Print, Full Ledger View/Print, Typewise and Area Wise ledger views. 

### Tasks

- TASK-390 — Define ledger query.
- TASK-391 — Define opening balance.
- TASK-392 — Define transaction rows.
- TASK-393 — Define running balance.
- TASK-394 — Define closing balance.
- TASK-395 — Implement ledger API.
- TASK-396 — Implement ledger UI.
- TASK-397 — Add date filter.
- TASK-398 — Add account filter.
- TASK-399 — Add transaction-type filter.
- TASK-400 — Add print boundary.
- TASK-401 — Add tests.

---

## US-353 — Full ledger view

### Tasks

- TASK-402 — Define full-ledger query.
- TASK-403 — Implement pagination.
- TASK-404 — Implement sorting.
- TASK-405 — Add date filtering.
- TASK-406 — Add account filtering.
- TASK-407 — Add UI.
- TASK-408 — Add tests.

---

## US-354 — Typewise ledger view

### Tasks

- TASK-409 — Define transaction-type classification.
- TASK-410 — Implement typewise query.
- TASK-411 — Add filters.
- TASK-412 — Add UI.
- TASK-413 — Add tests.

---

## US-355 — Area-wise ledger view

### Tasks

- TASK-414 — Determine Area → Ledger relationship.
- TASK-415 — Define area-wise query.
- TASK-416 — Implement API.
- TASK-417 — Implement UI.
- TASK-418 — Add tests.

---

# 23. FEAT-133 — Trial Balance & Financial Statement Boundary

Legacy accounting contains Trial Balance, Group Wise Trial Balance, Periodic Trial Balance, Profit & Loss and Balance Sheet. 

## US-356 — Trial Balance

### Acceptance Criteria

```text
Total Debit = Total Credit
```

### Tasks

- TASK-419 — Define Trial Balance query.
- TASK-420 — Aggregate LedgerEntry by account.
- TASK-421 — Calculate debit balance.
- TASK-422 — Calculate credit balance.
- TASK-423 — Implement as-of-date query.
- TASK-424 — Implement periodic query.
- TASK-425 — Implement API.
- TASK-426 — Implement UI.
- TASK-427 — Add difference check.
- TASK-428 — Add tests.

---

## US-357 — Trial Balance difference check

### Tasks

- TASK-429 — Define difference calculation.
- TASK-430 — Identify unbalanced transactions.
- TASK-431 — Identify orphan LedgerEntries.
- TASK-432 — Identify duplicate postings.
- TASK-433 — Create diagnostic query.
- TASK-434 — Create UI/report.
- TASK-435 — Add tests.

---

## US-358 — Profit & Loss boundary

### Tasks

- TASK-436 — Identify revenue accounts.
- TASK-437 — Identify expense accounts.
- TASK-438 — Define reporting-period logic.
- TASK-439 — Define gross profit relationship.
- TASK-440 — Determine required account hierarchy.
- TASK-441 — Determine whether P&L is Phase 9 or Reporting phase.
- TASK-442 — Document decision.
- TASK-443 — Create follow-up implementation story if required.

---

## US-359 — Balance Sheet boundary

### Tasks

- TASK-444 — Identify asset accounts.
- TASK-445 — Identify liability accounts.
- TASK-446 — Identify equity accounts.
- TASK-447 — Define financial-year treatment.
- TASK-448 — Determine whether Balance Sheet is Phase 9 or Reporting phase.
- TASK-449 — Document decision.
- TASK-450 — Create follow-up implementation story if required.

---

# 24. FEAT-134 — Bank Reconciliation Boundary

Legacy accounting explicitly includes Bank Reconciliation Entry and Bank Reconciliation Ledger. 

No dedicated reconciliation table is present in the supplied approved Financial table list.

## US-360 — Finalize Bank Reconciliation model

### Tasks

- TASK-451 — Review legacy reconciliation workflow.
- TASK-452 — Identify bank statement fields.
- TASK-453 — Identify transaction matching fields.
- TASK-454 — Define reconciliation status.
- TASK-455 — Define reconciliation date.
- TASK-456 — Determine required additional table(s).
- TASK-457 — Determine whether reconciliation belongs in Financial.
- TASK-458 — Document schema decision.

---

## US-361 — Bank reconciliation implementation boundary

### Tasks

- TASK-459 — Define reconciliation API.
- TASK-460 — Define reconciliation UI.
- TASK-461 — Define matching workflow.
- TASK-462 — Define unmatched transaction workflow.
- TASK-463 — Define adjustment workflow.
- TASK-464 — Define audit behavior.
- TASK-465 — Determine implementation scope.
- TASK-466 — Create follow-up story if outside current schema.

---

# 25. FEAT-135 — Cheque & Post-Dated Payment Boundary

Legacy accounting includes Post Dated Cheques Entry, Cheque Status Report and Cheque Book Register. 

## US-362 — Finalize cheque model

### Tasks

- TASK-467 — Identify cheque fields.
- TASK-468 — Identify cheque number.
- TASK-469 — Identify bank.
- TASK-470 — Identify cheque date.
- TASK-471 — Identify clearing date.
- TASK-472 — Define cheque status.
- TASK-473 — Determine whether Payment/Receipt can represent cheque lifecycle.
- TASK-474 — Determine whether separate cheque table is required.
- TASK-475 — Document schema decision.

---

## US-363 — Post-dated payment boundary

### Tasks

- TASK-476 — Define PDC lifecycle.
- TASK-477 — Define future-date validation.
- TASK-478 — Define due-date workflow.
- TASK-479 — Define posting behavior.
- TASK-480 — Define cancellation behavior.
- TASK-481 — Define audit behavior.
- TASK-482 — Create implementation story if approved.

---

# 26. FEAT-136 — Financial Permissions & Audit

## US-364 — Financial permission catalog

Recommended initial permissions:

```text
Financial.View

Financial.Ledger.View
Financial.Ledger.Create
Financial.Ledger.Update
Financial.Ledger.Deactivate

Financial.Payment.View
Financial.Payment.Create
Financial.Payment.Update
Financial.Payment.Cancel
Financial.Payment.Reverse

Financial.Receipt.View
Financial.Receipt.Create
Financial.Receipt.Update
Financial.Receipt.Cancel
Financial.Receipt.Reverse

Financial.Journal.View
Financial.Journal.Create
Financial.Journal.Post
Financial.Journal.Cancel
Financial.Journal.Reverse

Financial.Outstanding.View
Financial.Outstanding.Adjust

Financial.TrialBalance.View
Financial.CashBook.View
Financial.BankBook.View

Financial.Period.Close
Financial.Period.Reopen
Financial.YearEnd.Execute

Financial.BankReconciliation.View
Financial.BankReconciliation.Reconcile
```

### Tasks

- TASK-483 — Finalize permission catalog.
- TASK-484 — Seed permissions.
- TASK-485 — Map permissions to roles.
- TASK-486 — Implement backend guards.
- TASK-487 — Implement UI permission visibility.
- TASK-488 — Test denied operations.
- TASK-489 — Test privileged operations.

---

## US-365 — Financial audit events

### Events

```text
PaymentCreated
PaymentPosted
PaymentCancelled
PaymentReversed

ReceiptCreated
ReceiptPosted
ReceiptCancelled
ReceiptReversed

JournalCreated
JournalPosted
JournalCancelled
JournalReversed

LedgerEntryCreated
FinancialAdjustmentCreated

OpeningBalanceCreated
PeriodClosed
PeriodReopened
FinancialYearClosed
```

### Tasks

- TASK-490 — Define Financial audit taxonomy.
- TASK-491 — Audit Payment creation.
- TASK-492 — Audit Payment posting.
- TASK-493 — Audit Payment cancellation.
- TASK-494 — Audit Receipt creation.
- TASK-495 — Audit Receipt posting.
- TASK-496 — Audit Receipt cancellation.
- TASK-497 — Audit Journal posting.
- TASK-498 — Audit Ledger adjustments.
- TASK-499 — Audit opening balances.
- TASK-500 — Audit period operations.
- TASK-501 — Capture actor.
- TASK-502 — Capture source transaction.
- TASK-503 — Capture transaction UUID.
- TASK-504 — Add tests.

---

# 27. FEAT-137 — Financial REST API & NestJS Services

## US-366 — Financial REST APIs

Suggested API surface:

```text
GET    /financial/payments
POST   /financial/payments
GET    /financial/payments/{id}
POST   /financial/payments/{id}/post
POST   /financial/payments/{id}/cancel
POST   /financial/payments/{id}/reverse

GET    /financial/receipts
POST   /financial/receipts
GET    /financial/receipts/{id}
POST   /financial/receipts/{id}/post
POST   /financial/receipts/{id}/cancel
POST   /financial/receipts/{id}/reverse

GET    /financial/ledger
GET    /financial/ledger/{ledgerId}
GET    /financial/ledger-entries

GET    /financial/outstanding/customers
GET    /financial/outstanding/customers/{customerId}
GET    /financial/outstanding/suppliers
GET    /financial/outstanding/suppliers/{supplierId}

GET    /financial/cash-book
GET    /financial/bank-book
GET    /financial/trial-balance
```

### Tasks

- TASK-505 — Define Financial API standards.
- TASK-506 — Define request DTOs.
- TASK-507 — Define response DTOs.
- TASK-508 — Define pagination.
- TASK-509 — Define filtering.
- TASK-510 — Define sorting.
- TASK-511 — Define standard financial errors.
- TASK-512 — Implement PaymentController.
- TASK-513 — Implement ReceiptController.
- TASK-514 — Implement LedgerController.
- TASK-515 — Implement OutstandingController.
- TASK-516 — Implement CashBookController.
- TASK-517 — Implement BankBookController.
- TASK-518 — Implement TrialBalanceController.
- TASK-519 — Add API documentation.
- TASK-520 — Add API tests.

---

## US-367 — Financial domain services

### Tasks

- TASK-521 — Implement PaymentService.
- TASK-522 — Implement ReceiptService.
- TASK-523 — Implement LedgerService.
- TASK-524 — Implement LedgerEntryService.
- TASK-525 — Implement AccountingPostingService.
- TASK-526 — Implement OutstandingService.
- TASK-527 — Implement CashBookService.
- TASK-528 — Implement BankBookService.
- TASK-529 — Implement TrialBalanceService.
- TASK-530 — Implement FinancialPeriodService.
- TASK-531 — Implement FinancialAuditService.
- TASK-532 — Implement FinancialQueryService.
- TASK-533 — Add unit tests.

---

# 28. FEAT-138 — Angular Financial UI

## US-368 — Financial module structure

Recommended:

```text
financial/
├── payments/
├── receipts/
├── journal/
├── ledger/
├── outstanding/
├── cash-book/
├── bank-book/
├── trial-balance/
└── services/
```

### Tasks

- TASK-534 — Create Financial route.
- TASK-535 — Create feature structure.
- TASK-536 — Create Financial service layer.
- TASK-537 — Create reusable party selector.
- TASK-538 — Create reusable ledger selector.
- TASK-539 — Create reusable amount input.
- TASK-540 — Create reusable date filter.
- TASK-541 — Add route guards.
- TASK-542 — Add tests.

---

## US-369 — Payment UI

### Tasks

- TASK-543 — Create payment list.
- TASK-544 — Create payment form.
- TASK-545 — Party selector.
- TASK-546 — Payment method selector.
- TASK-547 — Amount input.
- TASK-548 — Payment date.
- TASK-549 — Narration.
- TASK-550 — Account selection.
- TASK-551 — Post action.
- TASK-552 — Cancel action.
- TASK-553 — Reversal action.
- TASK-554 — Keyboard navigation.
- TASK-555 — Validation errors.
- TASK-556 — Tests.

---

## US-370 — Receipt UI

### Tasks

- TASK-557 — Create receipt list.
- TASK-558 — Create receipt form.
- TASK-559 — Customer selector.
- TASK-560 — Receipt method selector.
- TASK-561 — Amount input.
- TASK-562 — Receipt date.
- TASK-563 — Narration.
- TASK-564 — Post action.
- TASK-565 — Cancel action.
- TASK-566 — Reversal action.
- TASK-567 — Keyboard navigation.
- TASK-568 — Tests.

---

## US-371 — Ledger UI

### Tasks

- TASK-569 — Create ledger search.
- TASK-570 — Account selector.
- TASK-571 — Date range.
- TASK-572 — Opening balance.
- TASK-573 — Transaction grid.
- TASK-574 — Running balance.
- TASK-575 — Closing balance.
- TASK-576 — Transaction detail.
- TASK-577 — Print boundary.
- TASK-578 — Tests.

---

## US-372 — Outstanding UI

### Tasks

- TASK-579 — Create customer outstanding screen.
- TASK-580 — Create supplier outstanding screen.
- TASK-581 — Customer/supplier search.
- TASK-582 — Date filtering.
- TASK-583 — Show opening balance.
- TASK-584 — Show invoices.
- TASK-585 — Show receipts/payments.
- TASK-586 — Show returns.
- TASK-587 — Show adjustments.
- TASK-588 — Show closing outstanding.
- TASK-589 — Add adjustment action.
- TASK-590 — Add tests.

---

# 29. FEAT-139 — Offline Financial Transactions & Synchronization

The architecture specifies that every change is recorded in an Outbox and processed by a background worker, and that every transaction receives a unique UUID for idempotency. 

## US-373 — Offline Payment/Receipt

### Tasks

- TASK-591 — Define offline Payment behavior.
- TASK-592 — Define offline Receipt behavior.
- TASK-593 — Persist local transaction.
- TASK-594 — Persist Outbox entry transactionally.
- TASK-595 — Show pending sync state.
- TASK-596 — Implement retry.
- TASK-597 — Handle application restart.
- TASK-598 — Add tests.

---

## US-374 — Financial Outbox events

### Events

```text
PaymentCreated
PaymentPosted
PaymentCancelled
PaymentReversed

ReceiptCreated
ReceiptPosted
ReceiptCancelled
ReceiptReversed

LedgerEntryPosted
```

### Tasks

- TASK-599 — Define Payment event payload.
- TASK-600 — Define Receipt event payload.
- TASK-601 — Define LedgerEntry event payload.
- TASK-602 — Write Outbox transactionally.
- TASK-603 — Implement retry.
- TASK-604 — Implement failure tracking.
- TASK-605 — Implement replay safety.
- TASK-606 — Add tests.

---

## US-375 — Financial idempotency

### Tasks

- TASK-607 — Define transaction UUID.
- TASK-608 — Store source transaction identity.
- TASK-609 — Detect duplicate Payment.
- TASK-610 — Detect duplicate Receipt.
- TASK-611 — Detect duplicate Ledger posting.
- TASK-612 — Detect duplicate Sales posting.
- TASK-613 — Detect duplicate Purchase posting.
- TASK-614 — Handle retry safely.
- TASK-615 — Add tests.

---

## US-376 — Financial synchronization conflicts

Financial transactions should not be blindly overwritten.

### Tasks

- TASK-616 — Define posted transaction immutability.
- TASK-617 — Define draft conflict behavior.
- TASK-618 — Define duplicate-post behavior.
- TASK-619 — Define reversal conflict.
- TASK-620 — Define financial-year conflict.
- TASK-621 — Integrate SyncConflict where applicable.
- TASK-622 — Add tests.

---

# 30. FEAT-140 — Financial Testing, Performance & Readiness

## US-377 — Unit tests

### Tasks

- TASK-623 — Payment validation tests.
- TASK-624 — Receipt validation tests.
- TASK-625 — Ledger tests.
- TASK-626 — LedgerEntry tests.
- TASK-627 — Debit/Credit tests.
- TASK-628 — Double-entry balancing tests.
- TASK-629 — Outstanding tests.
- TASK-630 — Cash Book tests.
- TASK-631 — Bank Book tests.
- TASK-632 — Trial Balance tests.
- TASK-633 — Financial year tests.
- TASK-634 — Period-lock tests.
- TASK-635 — Reversal tests.
- TASK-636 — Idempotency tests.
- TASK-637 — Audit tests.

---

## US-378 — Integration tests

### Tasks

- TASK-638 — Payment API tests.
- TASK-639 — Receipt API tests.
- TASK-640 — Ledger API tests.
- TASK-641 — Outstanding API tests.
- TASK-642 — Cash Book API tests.
- TASK-643 — Bank Book API tests.
- TASK-644 — Trial Balance API tests.
- TASK-645 — Sales → Financial posting tests.
- TASK-646 — Purchase → Financial posting tests.
- TASK-647 — Return reversal tests.
- TASK-648 — Duplicate posting tests.
- TASK-649 — Transaction rollback tests.
- TASK-650 — Authorization tests.

---

## US-379 — End-to-end financial workflows

### Workflow A — Customer Receipt

```text
Customer
   ↓
Receipt
   ↓
Cash/Bank
   ↓
LedgerEntry
   ↓
Outstanding Reduced
```

### Workflow B — Supplier Payment

```text
Supplier
   ↓
Payment
   ↓
Cash/Bank
   ↓
LedgerEntry
   ↓
Outstanding Reduced
```

### Workflow C — Sales on Credit

```text
Sales Invoice
   ↓
Customer Ledger
   ↓
Outstanding Increased
   ↓
Customer Receipt
   ↓
Outstanding Reduced
```

### Workflow D — Purchase on Credit

```text
Purchase Invoice
   ↓
Supplier Ledger
   ↓
Outstanding Increased
   ↓
Supplier Payment
   ↓
Outstanding Reduced
```

### Workflow E — Offline Financial Transaction

```text
Local Transaction
   ↓
SQLite
   ↓
Outbox
   ↓
Sync
   ↓
Cloud
```

### Tasks

- TASK-651 — E2E customer receipt.
- TASK-652 — E2E supplier payment.
- TASK-653 — E2E cash payment.
- TASK-654 — E2E bank payment.
- TASK-655 — E2E bank receipt.
- TASK-656 — E2E credit sales posting.
- TASK-657 — E2E purchase posting.
- TASK-658 — E2E customer outstanding.
- TASK-659 — E2E supplier outstanding.
- TASK-660 — E2E reversal.
- TASK-661 — E2E offline transaction.
- TASK-662 — E2E synchronization retry.
- TASK-663 — E2E duplicate transaction.

---

## US-380 — Accounting integrity tests

### Invariants

```text
Total Debit = Total Credit
```

and:

```text
Ledger Balance
=
Opening Balance
+
Debits
-
Credits
```

### Tasks

- TASK-664 — Validate every posted transaction balances.
- TASK-665 — Validate no orphan LedgerEntry.
- TASK-666 — Validate no duplicate source posting.
- TASK-667 — Validate reversal balances.
- TASK-668 — Validate outstanding calculations.
- TASK-669 — Validate cash balance.
- TASK-670 — Validate bank balance.
- TASK-671 — Validate Trial Balance.
- TASK-672 — Add automated integrity test suite.

---

## US-381 — Performance testing

### Tasks

- TASK-673 — Create realistic LedgerEntry dataset.
- TASK-674 — Create realistic Sales/Purchase transaction dataset.
- TASK-675 — Benchmark ledger query.
- TASK-676 — Benchmark customer outstanding.
- TASK-677 — Benchmark supplier outstanding.
- TASK-678 — Benchmark Cash Book.
- TASK-679 — Benchmark Bank Book.
- TASK-680 — Benchmark Trial Balance.
- TASK-681 — Inspect query plans.
- TASK-682 — Add justified indexes.
- TASK-683 — Repeat benchmarks.
- TASK-684 — Document results.

---

## US-382 — SQLite/PostgreSQL compatibility

### Tasks

- TASK-685 — Validate Financial schema on SQLite.
- TASK-686 — Validate Financial schema on PostgreSQL.
- TASK-687 — Validate monetary precision.
- TASK-688 — Validate transaction semantics.
- TASK-689 — Validate foreign keys.
- TASK-690 — Validate unique constraints.
- TASK-691 — Validate indexes.
- TASK-692 — Validate date handling.
- TASK-693 — Validate financial-year filtering.
- TASK-694 — Run SQLite suite.
- TASK-695 — Run PostgreSQL suite.

---

## US-383 — Financial documentation

### Tasks

- TASK-696 — Document Financial domain.
- TASK-697 — Document Payment lifecycle.
- TASK-698 — Document Receipt lifecycle.
- TASK-699 — Document Ledger semantics.
- TASK-700 — Document LedgerEntry.
- TASK-701 — Document double-entry rules.
- TASK-702 — Document Sales → Financial integration.
- TASK-703 — Document Purchase → Financial integration.
- TASK-704 — Document Customer Outstanding.
- TASK-705 — Document Supplier Outstanding.
- TASK-706 — Document Cash Book.
- TASK-707 — Document Bank Book.
- TASK-708 — Document Trial Balance.
- TASK-709 — Document financial-year controls.
- TASK-710 — Document permissions.
- TASK-711 — Document audit.
- TASK-712 — Document synchronization.
- TASK-713 — Document idempotency.

---

## US-384 — Phase readiness and sign-off

### Tasks

- TASK-714 — Complete database review.
- TASK-715 — Complete accounting/business-rule review.
- TASK-716 — Complete backend review.
- TASK-717 — Complete Angular review.
- TASK-718 — Complete Sales integration review.
- TASK-719 — Complete Purchase integration review.
- TASK-720 — Complete Party integration review.
- TASK-721 — Complete security review.
- TASK-722 — Complete audit review.
- TASK-723 — Complete synchronization review.
- TASK-724 — Complete performance review.
- TASK-725 — Complete financial integrity review.
- TASK-726 — Complete QA review.
- TASK-727 — Validate all acceptance criteria.
- TASK-728 — Validate schema decisions for Journal/Bank Reconciliation/Cheque.
- TASK-729 — Validate Reporting integration contract.
- TASK-730 — Complete Phase 9 sign-off.

---

# 31. Core Financial Business Rules

## Rule 1 — Double-entry must balance

Every posted accounting transaction must satisfy:

```text
SUM(Debit) = SUM(Credit)
```

A transaction that does not balance must never be posted.

---

## Rule 2 — Posted financial transactions are immutable

Do not silently modify posted accounting history.

Use:

```text
Original Transaction
        ↓
Reversal / Correction
        ↓
New LedgerEntry
```

---

## Rule 3 — Financial does not directly manipulate Inventory

Financial:

```text
LedgerEntry
```

Inventory:

```text
Stock
StockMovement
```

These remain separate domains.

---

## Rule 4 — Sales and Purchase remain source domains

Financial should consume source transactions through a defined service/event contract.

```text
Sales → Financial
Purchase → Financial
```

Do not duplicate Sales/Purchase business logic in Financial.

---

## Rule 5 — Outstanding is derived from financial transactions

Conceptually:

```text
Customer Outstanding
=
Opening Balance
+
Sales / Debits
-
Receipts / Credits
± Adjustments
-
Eligible Returns
```

The exact accounting treatment must follow the finalized account mapping.

---

## Rule 6 — Every financial transaction is idempotent

The architecture requires unique transaction UUIDs and safe duplicate handling. 

Therefore:

```text
Same transaction UUID
        ↓
Already posted?
        ↓
YES → return existing result
NO  → post transaction
```

---

# 32. Financial Data Ownership

| Data | Owner |
|---|---|
| Payment | Financial |
| Receipt | Financial |
| Ledger | Financial |
| LedgerEntry | Financial |
| Customer | Party |
| Supplier | Party |
| SalesInvoice | Sales |
| SalesPayment | Sales |
| PurchaseInvoice | Purchase |
| PurchasePayment/settlement | Financial boundary |
| Stock | Inventory |
| StockMovement | Inventory |
| FinancialYear | Configuration |
| AuditLog | Audit |
| ChangeHistory | Audit |
| Outbox | Synchronization |
| SyncLog | Synchronization |
| SyncConflict | Synchronization |

The approved database overview explicitly places Financial, Pricing, Loyalty, Prescription, Synchronization, Audit, Configuration and Lookup as separate functional modules. 

---

# 33. Legacy-to-Modern Mapping

| Legacy capability | Phase 9 treatment |
|---|---|
| Cash Receipt | Receipt |
| Cash Payment | Payment |
| Bank Receipt | Receipt |
| Bank Payment | Payment |
| Journal Voucher | Journal boundary + schema decision |
| Purchase Voucher | Purchase → Financial integration |
| Adjust Outstanding — Debtors | Customer outstanding adjustment |
| Opening Bill Entry — Debtors | Opening customer balance |
| Outstanding Bill Narration | Outstanding metadata/boundary |
| Adjust Outstanding — Creditors | Supplier outstanding adjustment |
| Opening Bill Entry — Creditors | Opening supplier balance |
| Voucher View / Modify | Financial transaction view |
| Voucher Reprint | Print boundary |
| Bank Slip Printing | Bank/printing boundary |
| Post Dated Cheques | Cheque/PDC boundary |
| Voucher Narration | Financial narration |
| Cash Book | Cash Book |
| Bank Book | Bank Book |
| Journal Register | Journal/Ledger query |
| Purchase Register | Purchase reporting boundary |
| Cash Receipt Register | Receipt query/report |
| Bank Receipt Register | Receipt query/report |
| Cash Payment Register | Payment query/report |
| Bank Payment Register | Payment query/report |
| Day Book | Financial transaction query |
| Voucher Cancellation Register | Reversal/cancellation history |
| Voucher Changes Log | Audit |
| Trial Balance | Trial Balance |
| Group-wise Trial Balance | Account hierarchy boundary |
| Periodic Trial Balance | Trial Balance date filtering |
| Profit & Loss | Financial statement boundary |
| Balance Sheet | Financial statement boundary |
| ReUpdate A/c Balance | Recalculation/integrity boundary |
| Trial Balance Difference Check | Accounting integrity |
| Customer Outstanding | Customer Outstanding |
| Creditors Outstanding | Supplier Outstanding |
| Bank Reconciliation | Reconciliation boundary |

The mapping above preserves the legacy concepts but does **not** assume every legacy menu item must become a separate modern table. That is important because the current approved schema has only four Financial tables. 

---

# 34. Testing Matrix

| Area | Required coverage |
|---|---|
| Payment | Create / Post / Cancel / Reverse |
| Receipt | Create / Post / Cancel / Reverse |
| Ledger | Create / View / Search |
| LedgerEntry | Debit / Credit / Balance |
| Accounting | Double-entry integrity |
| Sales | Financial posting |
| Purchase | Financial posting |
| Customer | Outstanding |
| Supplier | Outstanding |
| Cash | Cash Book |
| Bank | Bank Book |
| Journal | If approved |
| Trial Balance | As-of / periodic |
| Financial Year | Posting restrictions |
| Reversal | Balanced reversal |
| Offline | Local transaction |
| Sync | Retry / replay |
| Idempotency | Duplicate transaction |
| Security | Allowed / denied |
| Audit | All mutations |
| Database | SQLite / PostgreSQL |

---

# 35. Definition of Done

- [ ] Financial schema finalized.
- [ ] Payment implemented.
- [ ] Receipt implemented.
- [ ] Ledger implemented.
- [ ] LedgerEntry implemented.
- [ ] Debit/Credit rules implemented.
- [ ] Double-entry integrity enforced.
- [ ] Sales financial integration implemented.
- [ ] Purchase financial integration implemented.
- [ ] Customer outstanding implemented.
- [ ] Supplier outstanding implemented.
- [ ] Cash Book implemented.
- [ ] Bank Book implemented.
- [ ] Opening balances defined.
- [ ] Adjustments defined.
- [ ] Voucher lifecycle defined.
- [ ] Cancellation/reversal implemented.
- [ ] Financial-year integration implemented.
- [ ] Trial Balance implemented.
- [ ] P&L/Balance Sheet boundary finalized.
- [ ] Bank reconciliation boundary finalized.
- [ ] Cheque/PDC boundary finalized.
- [ ] Permissions implemented.
- [ ] Audit implemented.
- [ ] Outbox implemented.
- [ ] Idempotency implemented.
- [ ] Conflict behavior defined.
- [ ] Unit tests pass.
- [ ] API tests pass.
- [ ] E2E tests pass.
- [ ] Accounting integrity tests pass.
- [ ] SQLite verified.
- [ ] PostgreSQL verified.
- [ ] Documentation complete.
- [ ] QA sign-off complete.

---

# 36. Phase 9 Summary

| Type | Count |
|---|---:|
| Epic | 1 |
| Features | 24 |
| User Stories | 71 |
| Tasks | 730 |
| **Total Work Items** | **826** |

This phase deliberately contains more **schema-finalization/boundary work** than a normal CRUD module because the legacy accounting functionality is considerably larger than the currently approved Financial schema.

The four approved Financial tables are:

```text
Payment
Receipt
Ledger
LedgerEntry
```



Therefore, before adding tables such as Journal, BankAccount, Cheque, or BankReconciliation, the ADO backlog requires an explicit design decision.

---

# 37. Final Architecture

```text
                    SALES
                      │
                      ▼
                Sales Invoice
                      │
                      ▼
                 FINANCIAL
                      │
                      ▼
                 LedgerEntry
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
      Customer                 Cash/Bank
    Outstanding                 Balance


                   PURCHASE
                      │
                      ▼
               Purchase Invoice
                      │
                      ▼
                 FINANCIAL
                      │
                      ▼
                 LedgerEntry
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
       Supplier                Cash/Bank
     Outstanding                 Balance


                 CUSTOMER
                    │
                    ▼
                 RECEIPT
                    │
                    ▼
               LedgerEntry
                    │
                    ▼
             Outstanding ↓


                 SUPPLIER
                    │
                    ▼
                 PAYMENT
                    │
                    ▼
               LedgerEntry
                    │
                    ▼
             Outstanding ↓
```

## Critical Phase 9 principle

> **Financial owns accounting truth; Sales and Purchase own the business transactions that create the financial events.**

The architecture remains modular: the supplied architecture explicitly says business domains should live independently and communicate through services/events rather than sharing internal business logic. 
