# Sales — Validation

## Purpose

Consolidate validation rules applied when creating, editing, posting, paying, and returning sales documents. Validation runs at DTO (API), domain service, and database constraint layers.

**Database reference:** [Sales overview](../../database/tables/sales/sales.md)

## Responsibilities

- Define field-level and cross-field rules
- Separate draft validation (lenient) from post validation (strict)
- Align domain rules with CHECK constraints and FK integrity

## Scope

### In Scope

- Invoice header and line validation
- Payment amount and method validation
- Return quantity vs original sale validation
- Stock, batch expiry, and pricing checks on post

### Out of Scope

- JSON schema for API DTOs (implementation)
- Database migration definitions

## Related Entities

- All sales tables per [sales.md](../../database/tables/sales/sales.md)
- `Stock`, `Batch`, `PriceListItem` for cross-domain checks

## Business Rules

### SalesInvoice (draft)

- `branchId` required; user authorized for branch.
- `invoiceDate` required; not more than N days in future (setting).
- At least one line before post (warn on empty draft save if allowed).

### SalesInvoice (post)

- `status` must be `DRAFT`.
- Each line: `medicineId`, `soldQuantity > 0`, `unitId` valid.
- FEFO: allocated `batchId` has `Stock.availableQuantity >= soldQuantity` at `branchId`.
- Batch not expired unless `ALLOW_EXPIRED_SALE` true.
- Price resolved; `unitPrice >= 0`; MRP cap if enforced.
- Schedule H: `prescriptionId` required when medicine schedule demands it.
- `invoiceNumber` assigned and unique per branch.

### SalesPayment

- `paymentAmount > 0` for collections.
- `salesInvoiceId` exists and invoice not `CANCELLED`.
- Sum completed payments + new payment ≤ `netAmount` (unless overpay allowed).
- Cheque payments require `chequeNumber`, `chequeDate` when method = `CHEQUE`.

### SalesReturn

- Linked invoice `status` in (`POSTED`, `PARTIALLY_RETURNED`).
- `returnQuantity > 0` per line.
- Cumulative return ≤ sold per invoice line.
- `returnReason` required non-empty.
- Expired return rejection unless policy override with approver.

### Totals integrity

- Header `netAmount` = sum of line `lineAmount` ± header discount (within rounding tolerance).
- `balanceAmount` = `netAmount` - `paidAmount` after returns/refunds applied.

## Domain Events

Validation failures do not emit events; successful post emits `SalesInvoicePosted`.

## State Model

Validators gate transitions — e.g. only `DRAFT` accepts line edits; only `POSTED` accepts returns.

## Integrations

- **class-validator** on API DTOs for shape and type
- **Prisma** FK and CHECK on persist
- **SettingsService** for policy flags (`FEFO_ENABLED`, `ENFORCE_MRP_CAP`, etc.)

## Security

- Validation cannot bypass branch scope — inject `branchId` from context, not client body alone.

## Performance

- Run expensive stock/FEFO checks only on post, not every keystroke.
- Debounce draft save validation in UI; server validates fully on post.

## Future

- JSON rule engine for state-specific pharmacy regulations
- Async validation for credit limit check against customer account
