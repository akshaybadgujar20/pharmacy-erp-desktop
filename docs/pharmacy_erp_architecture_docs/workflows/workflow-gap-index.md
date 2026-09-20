# Workflow GAP Index

Consolidated list of known gaps from L1 workflow diagram generators. Update when code or diagrams change.

## Resolved

| ID | Module | Resolution |
|----|--------|------------|
| GAP-1 | Sales | Round-off applied at post when `sales.apply_round_off` is true |
| GAP-4 | Sales | Return refund `SalesPayment` on approve; reversed on cancel |
| GAP-5 | Sales | Prescription quantities validated and dispensed on post |
| GAP-6 | Sales | Schedule H / controlled-drug prescription check at post |
| GAP-RET-3 | Return | Return window + Schedule H pharmacist approval enforced |
| GAP-RET-4 | Return | Supplier ledger voucher on purchase return approve |
| GAP-PAY-1 | Payment | Overpayment posts excess to `CUSTOMER_ADVANCE` ledger |
| GAP-XFER-2 | Inventory | Dispatch sets `IN_TRANSIT` status |
| GAP-XFER-3 | Inventory | `POST /stock-transfers/:id/cancel` reverses source OUT |
| GAP-XFER-4 | Inventory | Dispatch accepts DRAFT only (no orphan PENDING_APPROVAL path) |
| GAP-TAKE-2 | Inventory | [stock-take.md](./stock-take.md) workflow prose added |
| GAP-ME-1 | Month-end | `ClosingService.getPreCloseChecklist` + `GET /closing/pre-close-checklist` |
| GAP-ME-2 | Month-end | Incomplete stock takes included in pre-close checklist |
| GAP-ME-6 | Month-end | FY posting guard checks date-range FY `status === OPEN` |
| GAP-ME-8 | Month-end | `FinancialYear.close` gated by checklist (optional `force`) |
| GAP-RX-1 | Prescription | Dispensing hook on sales invoice post |
| GAP-RX-2 | Prescription | `PARTIALLY_DISPENSED` / `DISPENSED` set from sales post |
| GAP-RX-3 | Prescription | Qty ≤ prescription remaining validated at post |
| Follow-up | Sales | FY date guard on inventory and purchase stock paths |

## Open / Accepted / Deferred

| ID | Module | Diagram | Gap summary | Severity | Status |
|----|--------|---------|-------------|----------|--------|
| GAP-2 | Sales | sales-invoice-flow | Payment not captured at finalise — separate payment-flow | Low | Accepted v1 |
| GAP-3 | Sales | sales-invoice-flow | Return: only RESTOCK supported | Medium | Accepted v1 |
| GAP-7 | Sales | sales-invoice-flow | Limited unit tests added; full module coverage partial | Medium | Open |
| GAP-8 | Sales | sales-invoice-flow | No end-to-end tests for sales invoice workflow | Medium | Open |
| GAP-GRN | Purchase | purchase-invoice-flow | GRN without PO gated by setting only | Low | Accepted v1 |
| GAP-INV | Purchase | purchase-invoice-flow | Invoice post does not move stock | Info | By design |
| GAP-7-P | Purchase | purchase-invoice-flow | No automated tests for Purchase module | Medium | Open |
| GAP-8-P | Purchase | purchase-invoice-flow | No end-to-end tests for purchase workflow | Medium | Open |
| GAP-ADJ-1 | Inventory | stock-adjustment-flow | No submit step — DRAFT → approve directly | Low | Accepted v1 |
| GAP-ADJ-2 | Inventory | stock-adjustment-flow | No cancel — reversals via new adjustment | Medium | Accepted v1 |
| GAP-ADJ-3 | Inventory | stock-adjustment-flow | No finance valuation posting | Low | Open |
| GAP-XFER-1 | Inventory | stock-transfer-flow | inTransitQuantity bucket not implemented | Medium | Deferred v2 |
| GAP-PAY-2 | Payment | payment-flow | Dual settlement: SalesPayment + Receipt | Info | By design |
| GAP-RET-2 | Return | return-flow | RESTOCK only — no quarantine/expired | Medium | Accepted v1 |
| GAP-ME-3 | Month-end | month-end-flow | Trial balance — no report | Medium | Deferred |
| GAP-ME-4 | Month-end | month-end-flow | GST summary — no report | Medium | Deferred |
| GAP-ME-7 | Month-end | month-end-flow | Archive reports at close — no pipeline | Medium | Deferred |
| GAP-ME-9 | Month-end | month-end-flow | No reopen-period API | Low | Deferred |

**CI:** `npm run test:workflows` (repo root or `backend/`) runs `test_generators.py`.
