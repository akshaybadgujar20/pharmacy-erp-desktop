# Future Roadmap

## Already implemented (foundation)

These were handbook "future" items but are now part of the core architecture:

- **Offline-first** — local SQLite as operational database; HTTP to local NestJS
- **Multi-branch** — `Branch`, per-branch `Stock`, branch-scoped document numbers
- **JWT auth + RBAC** — `UserSession`, refresh tokens, `MODULE:RESOURCE:ACTION` permissions
- **Configuration-driven** — `AppSetting` + `SettingsService` (branch → company fallback)
- **Transactional outbox** — `Outbox` with `entityUuid` (sync worker not yet implemented)
- **Audit trail** — `AuditLog` + Winston `AppLogger`
- **Angular + Electron shell** — auth interceptors, secure token storage, i18n scaffold (`en-IN`)
- **Keyboard shortcuts** — global registry (handlers pending feature modules)

See [early-foundations](../architecture/early-foundations.md) for implementation detail.

## Near-term (next feature modules)

- Sales invoice posting service (atomic invoice + stock + outbox)
- Purchase GRN → Batch + Stock creation
- Inventory adjustment/transfer approval workflows
- Sync worker (outbox drain to cloud Postgres)
- Reports (sales, stock, GST, expiry)

## Medium-term

- Mobile companion app (read-only stock, orders)
- Customer loyalty UI (tables exist: `LoyaltyProgram`, `LoyaltyTransaction`)
- E-prescription import
- Payment gateway integration (UPI/card reconciliation)
- WhatsApp notifications (order ready, expiry alerts)

## Long-term

- Supplier portal
- AI inventory forecasting and purchase suggestions
- Cloud dashboards and consolidated multi-branch analytics
- Automated purchase suggestions from sales velocity

## Customer

Planned capabilities beyond current Party + Customer + loyalty integration. See [customer.md](../domain/customer.md) for current domain rules.

### Master data

- Customer segmentation tags for marketing and pricing cohorts
- Duplicate Party merge workflow
- `PARTY:PARTY:READ` permission for read-only clerks
- Branch-scoped customer visibility for multi-branch franchise
- Import/export CSV with validation report
- Split read model (`CustomerSummary` projection) for POS search
- Domain service for cross-role party merge

### Credit and finance

- Per-branch credit limits for corporate accounts
- Credit hold / suspend state (temporary block without deactivation)
- Automated dunning reminders
- Real-time outstanding from ledger only (remove denormalized cache)

### Loyalty

- Multi-program enrollment per customer
- Tiered membership (Silver/Gold)
- Points expiry batch job (`EXPIRY` transactions)
- `LOYALTY:TRANSACTION:CREATE` permission for manual adjustments
- Product/category-specific earn rules

### Compliance and privacy

- Consent tracking for marketing
- Right-to-erasure workflow (GDPR-style)
- PII field-level encryption at rest
- Field-level ACL (credit limit vs address edit)

### Integration

- External CRM webhook on `CustomerRegistered`
- SMS gateway on loyalty earn milestones
- HL7/FHIR patient link for hospital pharmacy
- Cloud webhook and event-sourcing read model for customer timeline UI

Planned events: `CustomerMerged`, `CustomerSegmentAssigned`, `LoyaltyPointsExpired`. Potential **Suspended** state between Active and Inactive.

Dependencies: [011_loyalty_customer_rewards.md](../ado/011_loyalty_customer_rewards.md); Finance receivable sub-ledger maturity.

## Product

Medicine Master deferred capabilities (see [product.md](../domain/product.md) for current scope).

### Near term

- Medicine search API — paginated filter by category, generic, manufacturer, barcode
- `MASTER:MEDICINE:READ` permission distinct from UPDATE in seed
- Composition UI — manage `MedicineSalt` in same form as medicine header
- Duplicate warning — barcode / name collision hints on save
- Alternate SKUs and search synonyms (`MedicineAlias`)

### Medium term

- Substitute mapping — therapeutic alternate mapping (`MedicineSubstitute`)
- Unit conversion — box → strip → tablet for purchasing vs dispensing UOM
- Category defaults — suggested schedule and storage flags by category
- External drug database import (RxNorm, CDSCO) with merge workflow
- Draft medicine workflow with pharmacist approval before ACTIVE
- Bulk import CSV with validation report and staged commit
- Split permissions: `MASTER:MEDICINE:CREATE`, `READ`, `UPDATE`, `DELETE`
- `MASTER:COMPOSITION:UPDATE` for pharmacist-only salt edits; `MASTER:SCHEDULE:ADMIN` for regulatory schedule maintenance
- Domain service for medicine merge (duplicate detection by barcode/generic)
- Rule engine for schedule ↔ prescription auto-alignment on save
- Automatic price list row creation when medicine is created on a branch
- Customer-segment price lists via `priceListType` string

### Long term

- Multi-language names — regional display names for labels and receipts
- Attachment store — leaflets, images, compliance documents (`MedicineImage`)
- Formulary tiers — hospital formulary inclusion/exclusion lists
- AI-assisted classification — suggest category/schedule from salt composition (human approval required)
- Explicit `medicineStatus` string column with approval workflow (Draft → Review → Active) — requires ADR
- Event-sourced composition history for regulatory audit of formula changes
- Cloud webhook on `MedicineUpdated` for external PIM integration
- Many-to-many supplier–manufacturer authorization (which distributor can supply which brands)
- FTS5 full-text search on `medicineName`, `brandName`, generic names
- Materialized view for POS autocomplete (medicine + default branch price)
- Planned events: `MedicineSubstituteMapped`, `MedicineImportCompleted`, `MedicineMerged`

Deferred features must still obey current invariants: no sale pricing on `Medicine` or `Batch`; UUID sync + soft delete + `version` on all new master tables; Medicine terminology — no `Product` table without ADR.

## Sales

Future features must preserve branch-scoped document numbers, price/tax snapshot on post, FEFO at branch stock, and atomic post with outbox + audit.

### Near term

- Additional permissions: cancel posted (`SALES:SALES_INVOICE:CANCEL`), approve return (`SALES:SALES_RETURN:APPROVE`), export GST (`SALES:SALES_INVOICE:EXPORT`)
- Manager price override with audit reason
- Stock reservation on draft invoice (setting-gated)
- Manager override for non-FEFO batch selection with mandatory reason
- Barcode scan-to-add with real-time stock hint
- Dedicated payment permission (`SALES:SALES_PAYMENT:CREATE`)
- Align seed `permissionCode` strings with canonical `MODULE:RESOURCE:ACTION` display

### Medium term

- Sales order and quotation tables and workflows (see Deferred below)
- Credit note document type separate from cash refund
- Customer portal: view invoices and pay online
- E-invoice / GST portal integration
- Quotation → invoice conversion workflow
- Mobile queue for prescription pickup
- Integrated POS terminal capture
- Customer wallet / store credit balance
- Auto-reconcile UPI merchant settlement files
- QR scan of original invoice to pre-fill return lines
- Restocking fee deduction from refund
- Link to product recall campaigns by batch
- Customer-segment price lists (loyalty tier)
- Time-of-day pricing
- Bundled SKU pricing
- Field-level permissions for discount override
- Shift-based temporary elevation with audit trail

### Long term

- Multi-branch transfer sale (dispatch from another branch)
- Subscription / repeat Rx auto-refill
- AI-assisted interaction checks at line add (CDSS)
- Event sourcing read models for counter shift summaries
- Hold invoice in `DRAFT` with stock reservation
- Split billing: insurance vs patient payable portions
- Digital signature on posted invoice PDF
- Webhook notifications for `SalesInvoicePosted` to external ERP
- Event catalog versioning for schema evolution
- JSON rule engine for state-specific pharmacy regulations
- Async validation for credit limit check against customer account
- High-volume chains: read replicas for invoice search; write path stays on primary SQLite per branch device
- Archival of invoices older than retention period to cold storage

### Integration initiatives

| Initiative | Integration touchpoints |
|------------|-------------------------|
| Sales order | Inventory reservation, invoice conversion |
| Quotation | PDF/email, price list read-only |
| E-invoice | External GST API, new payload tables |
| Delivery | Address, rider app, invoice link |
| Loyalty | Customer domain, discount on post |
| Insurance | Split tender, third-party payer lines |

New permissions per resource when implemented: `SALES:SALES_ORDER:*`, `SALES:QUOTATION:*`. E-invoice credentials in secure settings vault.

## Inventory

Planned capabilities beyond the current schema and `InventoryLedgerService` implementation. See [inventory.md](../domain/inventory.md) for current domain rules.

### Near term

- **Stock reservation service** — formal API to reserve/release `reservedQuantity` tied to sales order UUID with TTL
- **Transfer application service** — full DISPATCHED → IN_TRANSIT → RECEIVED with inTransitQuantity updates
- **Stock take reconciliation service** — auto StockAdjustment from StockTakeItem variances
- **Additional permissions** — `INVENTORY:STOCK_TRANSFER:*`, `INVENTORY:STOCK_TAKE:*`, approve actions
- **Negative stock policy flag** per branch in Settings
- Barcode-driven cycle counting and blind count mode
- Automated near-expiry alerts and markdown workflows
- Full reservation service with TTL and sales-order linkage
- Weighted-average costing option (today: lot cost from `purchaseRate` + movement snapshots)
- Central `InventoryValidationService` shared by modules
- JSON schema export for Electron offline validation parity
- Configurable validation severity (warn vs block) per branch in Settings
- In-app notifications when transfer arrives at destination
- Mobile receive with barcode scan per StockTransferItem line
- Reason code master with mandatory attachment for high-value write-offs
- Dual approval threshold when total variance value exceeds limit
- Automatic expiry adjustment job from expiredQuantity bucket
- Bulk CSV import for opening stock with validation preview

### Medium term

- **Weighted average costing** — optional per medicine per branch cost layer alongside lot cost
- **Bin / aisle location** — sub-location on Stock or new StockLocation table
- **Barcode-driven operations** — scan-to-adjust, scan-to-transfer line confirmation
- **Near-expiry automation** — scheduled jobs + notifications + optional markdown hooks to Sales
- **Blind count mode** — StockTake hides systemQuantity until COUNTED
- Landed cost add-ons (freight, duty) allocated at GRN to purchaseRate
- Standard cost vs actual variance reporting
- Multi-currency purchaseRate with exchange rate snapshot
- Weighted average valuation option per branch
- Mark-to-market near-expiry provision (accounting policy)
- Export to Excel with batch-level drill-down
- Materialized view: stock by medicine (sum across batches) per branch
- Batch-level min/max reorder linked to Stock alerts
- Real-time WebSocket push on balance change for POS displays
- Reservation table with referenceType/referenceId, expiry timestamp, and createdBy
- POS optimistic UI with reservation heartbeat
- Medicine-level reservation with automatic FEFO batch allocation on confirm
- Auto markdown / promotion workflow near expiry (Sales integration)
- SMS alerts to branch manager for batches expiring in N days
- Auto-complete PARTIALLY_RECEIVED after timeout with variance adjustment
- Workflow engine for configurable approval chains by transferType
- Machine-readable rule export for compliance documentation
- Configurable rule overrides per branch (negative stock, reservation strictness)
- Rule violation dashboard from audit log
- CloudEvents-compatible envelope with correlationId from RequestContext
- Event replay API for branch disaster recovery
- Webhook subscriptions for transfer COMPLETED to destination branch POS
- Explicit `InventoryAggregateRepository` facade per root instead of raw Prisma in feature modules
- Saga/outbox pattern for long-running transfers with offline branch sync

### Long term

- **Serialization** — unit-level serial tracking for high-value medicines
- **Recall management** — batch recall flag, block sales/transfer, trace forward from GRN
- **Multi-warehouse central inventory** — HQ view with branch allocation rules
- **Event sourcing projection** — rebuild Stock from StockMovement replay for audit disputes
- **Cold chain telemetry** — temperature log linkage to batch quarantine
- **AI demand forecasting** — reorder suggestions from movement history (read-only analytics first)
- Manufacturer recall flag linking affected batch numbers
- Multi-MRP packs (inner/outer) — secondary MRP fields if regulatory need arises
- Batch merge/split workflows with movement audit trail
- Cold chain temperature breach flag affecting expiry (COLD_CHAIN_AUDIT linkage)
- Multi-level expiry (inner/outer pack) for hospital packs

### Technical debt

- Feature modules for Adjustment / Transfer / StockTake instead of raw Prisma in controllers
- Central movement type registry constant file shared with docs
- Integration test coverage for full transfer and stock-take happy paths
- Nightly materialized valuation table by branch/medicine

### Integration initiatives

| Initiative | Integration touchpoints |
|------------|-------------------------|
| WMS / bin locations | Stock sub-location dimension |
| Supplier EDI | Auto Batch create on ASN |
| Finance GL | Auto journal from movement types |
| Mobile cycle count | StockTake offline sync |

## Supplier

Planned capabilities beyond current Party + Supplier + Payment integration. See [supplier.md](../domain/supplier.md) for current domain rules.

### Master data

- Supplier contracts module (not modeled — conceptual design in supplier.md)
- Vendor qualification and document expiry alerts (drug license renewal)
- Multi-currency supplier support
- Supplier bank account sub-entity for payment files
- `PARTY:PARTY:READ` and branch-scoped vendor lists
- Vendor qualification workflow before Active (samples, certificates)
- Onboard from scanned drug license OCR
- Online GSTIN verification API integration
- Sub-aggregate for supplier bank accounts when payment file export added
- Possible **Qualified** pre-Active state for new vendors

### Payments and finance

- `FINANCE:PAYMENT:*` permission seeding
- Payment approval workflow above threshold
- TDS/GST withholding on payments
- Supplier statement PDF from Payment + PurchaseInvoice
- Advance adjustment automation against invoices
- Bank file export (NEFT/RTGS) from Payment batch
- TDS deduction on supplier payments
- Segregation of duties: user who creates supplier should not approve own first payment

### Procurement integration

- Vendor scorecard (on-time delivery, rejection rate)
- Auto-suggest preferred supplier by medicine
- Block PO when drug license expired
- Contract price list rules when contracts module exists
- `creditLimit` may cap concurrent open PO value

### Compliance

- e-Invoice integration for purchase
- State-wise drug license format validation
- Audit pack export for statutory inspection
- Encrypt supplier bank details at rest

### Planned events

`SupplierContractActivated`, `SupplierContractExpired`, `SupplierContractTerminated`, `DrugLicenseExpiring`, `PaymentApprovalRequired`.

### Dependencies

- Phase 09 financial ADO: [009_financial_management_accounting.md](../ado/009_financial_management_accounting.md)
- Purchasing domain maturity for contract price default

Future rules must not break payable invariants — outstanding ≥ 0, ledger as source of truth.

## Purchasing

Planned capabilities beyond the current PO → GRN → invoice → return implementation. See [purchasing.md](../domain/purchasing.md) for current domain rules.

Future work must preserve: GRN as sole inbound stock creation path (unless explicit ADR for consignment); branch-scoped document numbers; atomic post with outbox + audit.

### Near term

- Full permission matrix in security seed: `PURCHASE:GOODS_RECEIPT:POST`, `PURCHASE:PURCHASE_ORDER:APPROVE`, `PURCHASE:PURCHASE_INVOICE:CREATE`, `PURCHASE:PURCHASE_RETURN:APPROVE`
- PO approval threshold and segregation of duties setting (`PO_APPROVAL_THRESHOLD` — auto-approve below amount)
- GRN–invoice qty/cost variance report
- Three-way match automation PO ↔ GRN ↔ invoice
- PO templates from reorder rules
- Barcode scan intake with duplicate batch detection
- OCR ingest of supplier PDF invoices
- Debit note auto-generation from return post
- Notifications: email/in-app queue for pending approvals
- Async validation against external drug code directory (HSN/GST)

### Medium term

- Approved vendor list (AVL) per medicine with rank
- Auto-suggest supplier from last GRN cost and lead time
- Auto-match GRN lines by batch number
- Multi-GRN single invoice consolidation
- Landed cost allocation on GRN (freight to batch cost)
- Cold chain temperature capture on receipt
- QC hold status before stock available for sale
- Return shipment tracking number
- Multi-level approval chains by amount band
- Mobile push for approvers
- Delegation when approver on leave
- Threshold-based dual approval for high-value POs
- Supplier domain: read supplier credit limit for PO block
- Schedule X / controlled procurement supplier list restriction
- Event schema registry with version field
- Real-time HO dashboard on `GoodsReceiptPosted`

### Long term

- EDI / supplier portal PO acknowledgment
- Reorder suggestions from min/max stock
- Automated PO from reorder point
- Supplier EDI inbound ASN before GRN
- RFQ and comparative quote tables
- Import shipment with customs landed cost
- Direct distributor catalog sync (API ordering)
- Multi-currency PO for imported medicines
- Single aggregate spanning PO+GRN for simplified mobile UX (still two tables)
- Consignment stock without PO (policy exception aggregate)
- Automated PO generation from min/max stock rules
- Contract pricing enforcement on PO lines
- Integration with distributor API catalog
- HO consolidation: nightly sync of posted GRNs vs real-time outbox
- Archive completed POs older than retention window

### Integration initiatives

| Initiative | Touchpoints |
|------------|-------------|
| Three-way match | PO, GRN, invoice lines |
| Supplier portal | PO send, ASN inbound |
| Reorder automation | Inventory min/max, PO generate |
| Landed cost | GRN freight allocation to batch cost |
| EDI | External message maps to PO/GRN |
| Quality hold | GRN post to quarantine stock status |

Expand seed permissions per resource when implemented. API keys for supplier portal scoped per supplier.

## Finance

Planned capabilities beyond current `Ledger`, `LedgerEntry`, `Payment`, `Receipt`, and `Tax` implementation. See [finance.md](../domain/finance.md) for current domain rules.

### Known gaps

| Gap | Status |
|-----|--------|
| **Expense** table | Referenced in Payment types and LedgerEntry voucher examples; **no Prisma model yet** |
| `FINANCE:*` permissions | Not seeded; only `REPORT:REPORT:READ` exists |
| Bank reconciliation | Not implemented |
| Period close | Not implemented |
| Manual journal UI | Posting service only via integrations |

### Near term

- Dedicated `Expense` aggregate: header + lines, approval workflow; link Payment `paymentType = EXPENSE` to Expense document
- Category ledgers for rent, utilities, consumables; BR-F51 approval before post
- Seed permissions: `FINANCE:PAYMENT:*`, `FINANCE:RECEIPT:*`, `FINANCE:LEDGER:*`, `FINANCE:JOURNAL:CREATE`
- Financial period lock — reject posts before close date
- Period lock validation on `transactionDate`
- Idempotent posting via `operationId` on voucher

### Medium term

- GSTR exports from invoice snapshots + GST ledgers
- TDS on supplier payments
- Financial period lock and year-end close journal
- Budget vs actual by expense ledger
- Bank statement import (REC-04 reconciliation)
- UPI/cardless reconciliation via reference id
- Multi-bank account support per branch
- Automated month-end close and retained earnings transfer journal
- `PeriodClosed` event blocking backdated posts
- Read models for trial balance / aging snapshots
- Reconciliation dashboard with drift trends
- Tie payment UTR to gateway webhook

### Long term

- HSN/SAC code mapping per medicine
- GSTR-1 / GSTR-3B export from ledger + invoice snapshots
- CESS and compensation cess rules
- Parallel accounting standards (Ind AS) mapping layers
- Branch-specific ledger segments
- Multi-currency ledger columns
- Event-sourced projection optional for high-volume chains
- Move trial balance to materialized view when entry count > 1M
- SOX-style segregation: creator ≠ approver ≠ poster for expenses

### Integration initiatives

| Initiative | Integration touchpoints |
|------------|-------------------------|
| Expense module | Payment, COA expense ledgers, approval workflow |
| Bank feed | Payment/Receipt `transactionReference`, REC-04 |
| HR payroll | Payment (salary — out of pharmacy scope v1) |
| Inventory valuation | Auto journal from movement types |

Planned events: `PeriodClosed`, `ExpenseApproved`, `BankStatementImported`. Expense document state: DRAFT → APPROVED → PAID. Future period close must preserve BR-F13 immutability of posted entries.

Dependencies: [009_financial_management_accounting.md](../ado/009_financial_management_accounting.md); Customer/Supplier outstanding cache maturity from reconciliation workflows in [finance.md](../domain/finance.md).

When Expense is modeled, update [ANCHOR_FACTS.md](../domain/ANCHOR_FACTS.md) and [supplier.md](../domain/supplier.md#supplier-payments).

## Deferred / not modeled

- **`SalesOrder` / `SalesOrderItem`** — Planned for customer orders placed before dispensing/billing (phone order, delivery request, reserved medicines). Would hold requested quantities optionally via stock reservation and convert to `SalesInvoice` on fulfillment. Status flow: `DRAFT` → `CONFIRMED` → `PARTIALLY_FULFILLED` → `FULFILLED` | `CANCELLED`. Not in current Prisma schema; use `SalesInvoice` in `DRAFT` as informal hold (no stock reservation).
- **`Quotation` / `QuotationItem`** — Planned for non-binding price estimates with validity period, convertible to invoice or sales order. No stock allocation on quote save. Status flow: `DRAFT` → `SENT` → `ACCEPTED` → `CONVERTED` | `EXPIRED` | `CANCELLED`. Not in current schema; `SalesInvoice` `DRAFT` may serve as informal estimate.
- **Supplier contracts** — Not in current schema; see Contracts section in [supplier.md](../domain/supplier.md)
- Full expense module UI (`Expense` table exists in schema)
