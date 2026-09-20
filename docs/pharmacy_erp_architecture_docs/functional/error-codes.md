# Error Codes — Functional Guide

**One-line purpose:** Understand what went wrong when an API call fails — grouped by business area with plain-English triggers.

**Parent:** [Functional overview](./functional-overview.md)

**Source of truth:** `backend/src/common/exceptions/error-code.ts`. API responses use shape `{ success: false, error: { code, message, details } }`.

---

## Common (all modules)

| Code | Typical trigger |
|------|-----------------|
| `VALIDATION_ERROR` | Request body or query failed class-validator rules |
| `BAD_REQUEST` | Business rule violation not covered by a specific code |
| `NOT_FOUND` | Generic missing resource |
| `CONFLICT` | Duplicate or state conflict |
| `UNAUTHORIZED` | Missing or invalid JWT |
| `FORBIDDEN` | Authenticated but not allowed |
| `ENTITY_VERSION_CONFLICT` | Optimistic lock — client `version` stale |
| `INVALID_DOCUMENT_STATUS` | Action not allowed in current document status |
| `DOCUMENT_HAS_NO_ITEMS` | Post/submit attempted with empty lines |

---

## Authentication and security

| Code | Typical trigger |
|------|-----------------|
| `AUTH_INVALID_CREDENTIALS` | Wrong username or password |
| `AUTH_ACCOUNT_LOCKED` | Too many failed logins |
| `AUTH_SESSION_EXPIRED` | Refresh token invalid or expired |
| `AUTH_PERMISSION_DENIED` | User lacks required permission |
| `AUTH_MUST_CHANGE_PASSWORD` | Login blocked until password changed |
| `INVALID_CURRENT_PASSWORD` | Change-password with wrong current password |
| `USER_NOT_FOUND` | Unknown user id |
| `USERNAME_ALREADY_EXISTS` | Duplicate username on create |

---

## Party management

| Code | Typical trigger |
|------|-----------------|
| `PARTY_NOT_FOUND` | Party id does not exist |
| `CUSTOMER_NOT_FOUND` | Customer role missing for party |
| `SUPPLIER_NOT_FOUND` | Supplier role missing |
| `DOCTOR_NOT_FOUND` | Doctor role missing |
| `EMPLOYEE_NOT_FOUND` | Employee role missing |
| `SUPPLIER_INACTIVE` | Purchase document references inactive supplier |

---

## Medicine master

| Code | Typical trigger |
|------|-----------------|
| `MEDICINE_NOT_FOUND` | Unknown medicine id |
| `MEDICINE_ALREADY_EXISTS` | Duplicate medicine identity |
| `MEDICINE_CODE_ALREADY_EXISTS` | Duplicate medicine code |
| `BATCH_NOT_FOUND` | Batch id invalid |
| `BATCH_ALREADY_EXISTS` | Duplicate batch number for medicine |
| `MEDICINE_SCHEDULE_NOT_FOUND` | Invalid schedule reference |
| `MANUFACTURER_NOT_FOUND` | Unknown manufacturer |

---

## Purchase

| Code | Typical trigger |
|------|-----------------|
| `PURCHASE_ORDER_NOT_FOUND` | Invalid PO id |
| `PURCHASE_ORDER_NOT_RECEIVABLE` | PO terminal or not approved |
| `GRN_PO_REQUIRED` | GRN without PO when setting disallows |
| `GRN_OVER_RECEIPT` | Received qty above tolerance |
| `GOODS_RECEIPT_NOT_FOUND` | Invalid GRN id |
| `PURCHASE_INVOICE_NOT_FOUND` | Invalid supplier invoice id |
| `PURCHASE_RETURN_NOT_FOUND` | Invalid purchase return id |
| `RETURN_QUANTITY_EXCEEDED` | Return qty > available |

---

## Sales

| Code | Typical trigger |
|------|-----------------|
| `SALES_INVOICE_NOT_FOUND` | Invalid invoice id |
| `SALES_INVOICE_HAS_PAYMENTS` | Cancel blocked — payments exist |
| `SALES_INVOICE_HAS_RETURNS` | Cancel blocked — returns exist |
| `SALES_PAYMENT_NOT_FOUND` | Invalid payment id |
| `SALES_RETURN_NOT_FOUND` | Invalid return id |
| `STOCK_INSUFFICIENT` | FEFO cannot fulfill requested qty |
| `BATCH_EXPIRED` | Selling expired batch when not allowed |
| `PRICE_LIST_NOT_FOUND` | No price list for branch/medicine |
| `PRICE_LIST_ITEM_NOT_FOUND` | Medicine not on price list |
| `INVOICE_NOT_POSTED` | Payment/return requires POSTED invoice |
| `CUSTOMER_REQUIRED_FOR_CREDIT` | Credit sale without customer |
| `PRESCRIPTION_NOT_FOUND` | Invalid prescriptionId on invoice |
| `PRESCRIPTION_NOT_DRAFT` | Edit prescription not in draft |

---

## Inventory

| Code | Typical trigger |
|------|-----------------|
| `STOCK_NOT_FOUND` | No stock row for branch+batch |
| `STOCK_INSUFFICIENT` | OUT would drive available below zero |
| `STOCK_ADJUSTMENT_NOT_FOUND` | Invalid adjustment id |
| `STOCK_TRANSFER_NOT_FOUND` | Invalid transfer id |
| `STOCK_TAKE_NOT_FOUND` | Invalid stock take id |
| `STOCK_MOVEMENT_NOT_FOUND` | Invalid movement reference |

---

## Finance

| Code | Typical trigger |
|------|-----------------|
| `LEDGER_NOT_FOUND` | Unknown account |
| `LEDGER_INACTIVE` | Posting to inactive account |
| `VOUCHER_UNBALANCED` | Debits ≠ credits |
| `PAYMENT_NOT_FOUND` | Invalid payment id |
| `RECEIPT_NOT_FOUND` | Invalid receipt id |
| `PAYMENT_ALLOCATION_EXCEEDED` | Payment amount > invoice balance |
| `FINANCIAL_YEAR_CLOSED` | Mutation in closed FY (where guarded) |
| `PURCHASE_INVOICE_HAS_PAYMENTS` | Cancel invoice with payments |

---

## Pricing

| Code | Typical trigger |
|------|-----------------|
| `TAX_NOT_FOUND` | Invalid tax id |
| `TAX_IN_USE` | Delete tax referenced on posted docs |
| `DISCOUNT_RULE_NOT_FOUND` | Invalid discount rule |
| `PRICE_LIST_IN_USE` | Delete list still referenced |

---

## Prescription

| Code | Typical trigger |
|------|-----------------|
| `PRESCRIPTION_NOT_FOUND` | Invalid prescription id |
| `PRESCRIPTION_NUMBER_ALREADY_EXISTS` | Duplicate Rx number |
| `PRESCRIPTION_CONFLICT` | Concurrent edit conflict |
| `PRESCRIPTION_ITEM_NOT_FOUND` | Invalid line id |

---

## Reporting

| Code | Typical trigger |
|------|-----------------|
| `REPORT_NOT_FOUND` | Unknown report id |
| `REPORT_INVALID_DATE_RANGE` | fromDate after toDate |
| `REPORT_UNSUPPORTED_FORMAT` | Invalid export format |

---

## Configuration

| Code | Typical trigger |
|------|-----------------|
| `COMPANY_NOT_FOUND` / `BRANCH_NOT_FOUND` | Invalid org ids |
| `FINANCIAL_YEAR_NOT_FOUND` | Invalid FY id |
| `FINANCIAL_YEAR_CLOSED` | Edit in closed year |
| `APP_SETTING_NOT_FOUND` | Unknown setting key |
| `APP_SETTING_NOT_EDITABLE` | System-locked setting |
| `PRINTER_CONFIGURATION_NOT_FOUND` | Invalid printer config |

---

## Synchronization

| Code | Typical trigger |
|------|-----------------|
| `OUTBOX_NOT_FOUND` | Invalid outbox row |
| `SYNC_CONFLICT_NOT_FOUND` | Unknown conflict id |
| `SYNC_CONFLICT_ALREADY_RESOLVED` | Double-resolve attempt |

---

## Geographic masters

| Code | Typical trigger |
|------|-----------------|
| `COUNTRY_NOT_FOUND` | Invalid country |
| `STATE_NOT_FOUND` | Invalid state |
| `CITY_NOT_FOUND` | Invalid city |
| `AREA_NOT_FOUND` | Invalid area |
| `*_IN_USE` | Delete blocked — referenced elsewhere |

---

## Persistence

| Code | Typical trigger |
|------|-----------------|
| `SEQUENCE_NOT_FOUND` | No active sequence for document type |
| `TRANSACTION_FAILED` | UnitOfWork rollback |
| `OUTBOX_DUPLICATE_OPERATION` | Idempotent outbox replay |

---

## How clients should handle errors

1. Show `error.message` to the user.
2. Use `error.code` for i18n or retry logic (`ENTITY_VERSION_CONFLICT` → refresh and retry).
3. Log `details` for support; do not expose raw details to end users unless safe.

---

## References

- [Error code registry](../../../backend/src/common/exceptions/error-code.ts)
- [User & Security](./user-security.md)
- [Backend developer guide](../architecture/backend-developer-guide.md)
