# ADR Review — Plain-English Assessment and Recommendations

**Scope:** All ADR files in [`adrs/`](./) (ADR-001 through ADR-260; 175 records — numbering is not contiguous)  
**Review date:** 2026-09-20  
**Judgment lens:** Simplicity over sophistication, offline-first (local SQLite is source of truth), UnitOfWork + Outbox + Audit for writes, honest v1 deferrals  
**Verdict scale:** `GOOD` = sound decision, no change needed. `NEEDS IMPROVEMENT` = defensible but carries a real risk worth revisiting.

---

## 1. Statistics

| Metric | Count | Share |
|---|---|---|
| **Total ADRs reviewed** | 175 | 100% |
| **Good / sound** | 163 | ~93% |
| **Needs improvement** | 12 | ~7% |

**Overall read:** This is a healthy, disciplined ADR set. The architecture is internally consistent — one Prisma schema, string statuses, a single write path (UnitOfWork), transactional outbox + audit, one stock mutation choke-point, and derived ledger balances. Almost every deferral is honestly documented. The 12 flagged items cluster into five themes; none are architectural mistakes, but a few could quietly corrupt data or mislead users if left as-is.

### Flagged ADRs by theme

| Theme | ADRs | Core risk |
|---|---|---|
| Deferred tests on money/stock/security code | 173, 180, 190, 198 | Highest-risk modules ship with zero automated tests |
| Financial-period / reversal integrity | 065, 239, 256 | "Closed" year still accepts postings; reversal state in a string suffix; per-branch "current year" |
| Referential-integrity guard gaps | 127, 193 | Deleting an Area / system Permission can orphan data or break RBAC |
| Domain correctness / patient safety | 184, 187 | Two unlinked payment paths (double-count); all returns re-shelved incl. damaged goods |
| Offline-sync consistency | 208 | Hard-deleting salt rows leaves no tombstone for sync |

### Priority recommendations (top 5)

1. **ADR-256** — Enforce a `FINANCIAL_YEAR_CLOSED` guard in the ledger posting path, or relabel Close as non-enforcing until cross-module gates ship.
2. **ADR-187** — Add a `DAMAGED` return disposition that does **not** restock. Re-shelving damaged/expired medicine is a patient-safety issue.
3. **ADR-184** — Guard that combined SalesPayment + Finance Receipt allocations cannot exceed invoice outstanding; document which path is authoritative.
4. **ADR-173 / 180 / 190 / 198** — Add minimal persistence tests for stock, ledger, reversal, and permission-deny paths before production trust.
5. **ADR-065 / 208** — On next Prisma migration: explicit reversal columns (`reversedVoucherId` / `isReversed`); add `deletedAt` on MedicineSalt for sync tombstones.

---

## 2. Per-ADR Analysis

### Foundations and persistence (ADR-001–026)

- **ADR-001 — SQLite local + PostgreSQL cloud from one schema · GOOD** — One schema switched by env is the least-complex way to keep local and cloud structurally identical for future sync.
- **ADR-002 — String status columns instead of enums · GOOD** — Forced by SQLite; per-module `*.constants.ts` + `@IsIn` validation is simple and readable.
- **ADR-003 — Stock per (branch, batch) · GOOD** — Correct data model for multi-branch; `@@unique([branchId, batchId])` fixes a real bug.
- **ADR-004 — Outbox/sync keyed by entityUuid · GOOD** — Local BigInt PKs collide across devices; UUID + deviceId + idempotent operationId is the right offline-first contract.
- **ADR-005 — Document numbers unique per branch · GOOD** — Global uniqueness would guarantee offline sync collisions; branch-scoped composite uniqueness is correct.
- **ADR-006 — All writes via UnitOfWorkService.run · GOOD** — Centralizes transaction boundary, error mapping, and retry; reads correctly bypass it.
- **ADR-007 — Outbox enqueue in same transaction · GOOD** — Textbook transactional-outbox; rollback removes both rows atomically.
- **ADR-008 — InventoryLedgerService is the only stock path · GOOD** — Single choke-point for FEFO, negative-stock guards, and the immutable movement trail.
- **ADR-009 — Prisma extension for BIGINT PKs on SQLite · GOOD** — Per-row allocation from the `IdSequence` table keeps the Prisma hook simple; `bootstrapIdSequence()` heals legacy DBs via a one-time `MAX(id)` scan on startup (not the normal allocation path). Id gaps after a failed insert are acceptable.
- **ADR-010 — RequestContext via AsyncLocalStorage · GOOD** — Idiomatic NestJS; avoids threading tenant params everywhere.
- **ADR-011 — LedgerPostingService in persistence module · GOOD** — Shares debit=credit + open-FY checks in one primitive; persistence-vs-finance placement rationale is a minor doc nit.
- **ADR-012 — Global JWT auth + PermissionsGuard, @Public opt-out · GOOD** — Secure-by-default eliminates "forgot to protect this route" bugs.
- **ADR-013 — JWT-enriched RequestContext, headers as dev fallback · GOOD** — Closes tenant-spoofing hole; confirm dev header fallback is disabled in production builds.
- **ADR-014 — SettingsService with ~60s cache · GOOD** — Simple TTL avoids per-write DB reads; safety-critical gates could later invalidate-on-write.
- **ADR-015 — Party module as CRUD reference template · GOOD** — One documented reference beats a code generator.
- **ADR-016 — Winston logs vs AuditService · GOOD** — Correct split by retention/consumer; track and close the `party-contact` audit gap.
- **ADR-017 — AuditService.log inside the transaction · GOOD** — Guarantees an audit row never exists without its change.
- **ADR-018 — Electron safeStorage for tokens, memory fallback · GOOD** — OS-encrypted storage beats XSS-readable localStorage; dev fallback is non-persistent.
- **ADR-019 — bcrypt password hashing · GOOD** — Industry-standard; ensure cost factor ≈10–12.
- **ADR-020 — Party masters org-global · GOOD** — Parties are genuinely shared; avoids duplicate masters.
- **ADR-021 — Offline-first, local SQLite primary · GOOD** — Pharmacy counter must sell during outages; correct core strategy.
- **ADR-022 — Cloud sync worker deferred · GOOD** — Safe because outbox contract durably records events; watch outbox growth.
- **ADR-023 — HTTP transport (Angular→Nest in Electron) · GOOD** — Reuses the same contract a cloud deploy would use; confirm port binds loopback-only.
- **ADR-024 — Canonical mutation template (UoW+audit+outbox) · GOOD** — Codifies existing rules into one checklist; no new abstraction.
- **ADR-025 — Report registry via provider registration · GOOD** — Lightweight idiomatic NestJS; justified extensibility for a growing report surface.
- **ADR-026 — Reporting read-only, no UoW/outbox · GOOD** — Reports don't mutate; skipping the write stack is correct.

### Purchase, GRN, and finance hooks (ADR-047–101)

- **ADR-047 — Purchase v1 = all four document types · GOOD** — PO/GRN/invoice/return interlock; building together avoids throwaway stubs.
- **ADR-048 — Prisma schema is source of truth for statuses · GOOD** — Executable schema wins over drifting markdown; pair with updating stale docs.
- **ADR-049 — GRN full inspection workflow before accept · GOOD** — Quality inspection before stock-in is a real pharmacy need.
- **ADR-050 — Purchase invoice POST initially no ledger · GOOD** — Safe interim; properly superseded by ADR-056.
- **ADR-052 — GRN-without-PO gated by setting · GOOD** — Setting-gated exception balances flexibility with PO control.
- **ADR-053 — Posted GRN cancel reverses stock via OUT movements · GOOD** — Cancelling must undo inventory effect; routes through the ledger service.
- **ADR-055 — Finance v1 = Ledger/Entry/Payment/Receipt · GOOD** — Minimum for double-entry; deferring Expense is safe and additive.
- **ADR-056 — Finance cross-module hooks (PI AP, supplier payment, receipt stub) · GOOD** — Right to wire AP/supplier payments now; ensure customer-receipt ownership vs ADR-069 is unambiguous.
- **ADR-064 — Block purchase-invoice cancel when paidAmount > 0 · GOOD** — Prevents orphaned payment/ledger rows; simple guard over complex auto-unwind.
- **ADR-065 — Ledger reversal by voucherNumber + `-REV` suffix · NEEDS IMPROVEMENT** — Fixes double-reversal bug but encoding state in a string suffix is fragile with no DB-level double-reversal guard. **Recommendation:** on next migration, add explicit `reversedVoucherId`/`isReversed` column with idempotency guard.
- **ADR-068 — Sales v1 = all five tables · GOOD** — Billing/collections/returns are core day-one; cohesive scope.
- **ADR-069 — Sales full finance ledger hooks · GOOD** — Sales must flow to AR/revenue/GST; return+cancel reversals close the loop.
- **ADR-072 — FEFO batch allocation at post · GOOD** — Correct dispensing rule; re-allocating at post reflects real stock at commit time.
- **ADR-076 — Block sales cancel when paid/returned · GOOD** — Mirrors ADR-064; consistent guard protects financial integrity.
- **ADR-080 — Auth module vs Security (RBAC) module · GOOD** — Different lifecycles; clean boundary, not speculative layering.
- **ADR-086 — Invalidate sessions on role/permission/password change · GOOD** — Closes stale-elevated-JWT hole.
- **ADR-089 — Medicine backend-only, tests deferred · GOOD** — Reasonable sequencing; add deferred tests before dependent modules lean on it.
- **ADR-101 — Pricing/Prescription/Audit in one delivery · GOOD** — Justified by shared audit/branch-scope patterns.

### Config, sync, and cross-cutting (ADR-114–156)

- **ADR-114 — Config/sync/masters in one delivery · GOOD** — Shared patterns; low-risk sequencing; reuses SettingsModule.
- **ADR-127 — Skip Area delete guard (no areaId on PartyAddress) · NEEDS IMPROVEMENT** — Understandable given missing column, but leaves referential-integrity gap. **Recommendation:** add `areaId` FK (then guard on it), or short-term guard via City→Area relationship; track schema fix as backlog item.
- **ADR-130 — Settings PUT requires version · GOOD** — Mandatory optimistic locking prevents lost updates.
- **ADR-133 — Developer guide replaces memory-map wiring · GOOD** — Documentation governance; no runtime risk.
- **ADR-134 — Standalone coding-principles mdc rule · GOOD** — Lightweight tooling; improves agent/developer consistency.
- **ADR-135 — GRN accept is the stock-inbound boundary · GOOD** — Standard procure-to-pay; separates physical receipt from financial docs.
- **ADR-136 — Sales post is the stock-outbound boundary · GOOD** — Mirrors inbound boundary; drafts don't corrupt available quantity.
- **ADR-137 — Cross-module coupling via FKs, not Nest imports · GOOD** — Avoids circular deps; keep invariants in persistence layer.
- **ADR-138 — Sync conflict resolve updates metadata only · GOOD** — Inert resolve is safe v1 choice; document that "resolved" ≠ "data reconciled."
- **ADR-139 — Local DB is source of truth in daily use · GOOD** — Foundational and correct for offline-first.
- **ADR-140 — Delta sync (changed records only) · GOOD** — Standard, efficient; pairs with outbox.
- **ADR-141 — Outbox with background sync triggers · GOOD** — Proven reliable-delivery pattern.
- **ADR-142 — Per-transaction UUID for idempotent sync · GOOD** — Makes retries safe; timestamp-only dedup would be unreliable.
- **ADR-143 — Entity-specific conflict resolution · GOOD** — Tailoring rules reflects real domain understanding (stock never blind-overwritten).
- **ADR-144 — Angular feature modules, no logic in components · GOOD** — Standard, testable, matches conventions.
- **ADR-145 — Electron context isolation + preload contextBridge · GOOD** — Security best practice for Electron.
- **ADR-146 — Thin controllers, rich services, validated DTOs · GOOD** — Idiomatic NestJS layering.
- **ADR-147 — REST JSON envelope; binary streams for exports · GOOD** — Uniform envelope simplifies frontend; exempting file streams is correct.
- **ADR-148 — Standard feature-module anatomy · GOOD** — Predictable shape lowers onboarding cost.
- **ADR-149 — Reads via Prisma, writes via UnitOfWork · GOOD** — Atomicity where it matters, no overhead on reads.
- **ADR-150 — Audit + outbox in same transaction as mutation · GOOD** — Correctness-critical; commits or rolls back together.
- **ADR-151 — Reports register into ReportRegistryService · GOOD** — Avoids duplicated controllers and inline SQL.
- **ADR-152 — Additive-only change policy · GOOD** — Protects unrelated modules; keeps diffs reviewable.
- **ADR-153 — Central reporting core, domain providers register · GOOD** — Inverted dependency avoids circular imports.
- **ADR-154 — Reports read-only (no UoW/outbox/audit) · GOOD** — No data change; avoids spurious sync/audit events.
- **ADR-155 — Coarse REPORT_VIEW + per-report permission · GOOD** — Cheap route gate + fine-grained control; least privilege without excess complexity.
- **ADR-156 — Report exports: JSON/CSV/Excel/PDF · GOOD** — Reflects real reporting needs; standard buffer + Content-Type implementation.

### Reporting, inventory, finance, sales, security, medicine (ADR-157–208)

- **ADR-157 — File exports bypass ResponseInterceptor via @Res · GOOD** — Binary can't go in a JSON envelope.
- **ADR-158 — Namespaced report IDs (`domain.report`) · GOOD** — Cheap uniqueness + ownership hint.
- **ADR-159 — Party reports provider ships first · GOOD** — Prove registry with one concrete provider as template.
- **ADR-160 — Export libs exceljs + pdfmake · GOOD** — Pure-JS, no native build deps — ideal for Electron.
- **ADR-161 — Inventory nested item controllers · GOOD** — Reuses party nested pattern. (Overlaps ADR-166.)
- **ADR-162 — Headers created without embedded items[] · GOOD** — Matches draft-then-add-lines workflow.
- **ADR-163 — StockMovement HTTP read-only · GOOD** — Immutable ledger, writes only via ledger service. (Duplicated by ADR-169.)
- **ADR-164 — Batch org-global, stock/docs branch-scoped · GOOD** — Lot number shared; on-hand quantity per-location. (Duplicated by ADR-168.)
- **ADR-165 — Stock/StockMovement read-only DTOs · GOOD** — No write DTOs for ledger-managed data.
- **ADR-166 — Inventory items via separate child routes · GOOD** — Sound; largely restates ADR-161 (minor doc redundancy).
- **ADR-167 — Inventory CRUD + workflow endpoints · GOOD** — Draft-only CRUD would be useless without posting transitions.
- **ADR-168 — Batch org-global, stock branch-scoped · GOOD** — Sound; duplicate of ADR-164.
- **ADR-169 — StockMovement read-only · GOOD** — Correct immutability; duplicate of ADR-163.
- **ADR-170 — Stock-take reconcile creates adjustment + postings · GOOD** — Variances flow through auditable adjustment+ledger path.
- **ADR-171 — Inventory memory doc + scoped mdc rule · GOOD** — Docs/tooling; improves agent accuracy on complex module.
- **ADR-172 — Purchase full permission matrix · GOOD** — Granular RBAC mirrors inventory.
- **ADR-173 — Purchase tests deferred · NEEDS IMPROVEMENT** — GRN stock-inbound + invoice/ledger posting shipped with zero tests. **Recommendation:** add persistence tests for GRN→stock and invoice→ledger paths before relying on it.
- **ADR-174 — Full LedgerPostingService (balance validation + reversal) · GOOD** — Centralized double-entry protects financial integrity.
- **ADR-175 — LedgerEntry HTTP read-only · GOOD** — Immutable journal; no manual create endpoint.
- **ADR-176 — COA full CRUD with hierarchy guards · GOOD** — Blocks system-ledger delete + circular parents.
- **ADR-177 — Strict financial-year validation on posts · GOOD** — Hard-rejects out-of-period postings.
- **ADR-178 — Global payment/receipt numbers, branch code in format · GOOD** — Follows schema; branch prefix avoids offline collisions.
- **ADR-179 — Expense out of scope, use Payment EXPENSE type · GOOD** — Reuses Payment flow; no integrity downside for v1.
- **ADR-180 — Finance tests deferred · NEEDS IMPROVEMENT** — Highest-correctness-risk module shipped untested. **Recommendation:** add tests asserting balanced postings and correct reversals before trusting with real money.
- **ADR-181 — Reject unsupported PaymentType at complete · GOOD** — Fails loudly instead of silently posting to wrong account.
- **ADR-182 — Ledger running balance best-effort · GOOD** — Fine on single-writer SQLite; prefer deriving balance on read when Postgres cloud sync arrives (see ADR-245).
- **ADR-183 — Finance simplification refactor dropped · GOOD** — Declining optional churn aligns with simplicity principle.
- **ADR-184 — SalesPayment nested + separate Finance Receipt, no link · NEEDS IMPROVEMENT** — Two unlinked paths both reduce same invoice outstanding — double-count risk. **Recommendation:** guard combined allocations ≤ outstanding; document authoritative path.
- **ADR-185 — Auto-resolve selling price from PriceList at post · GOOD** — Avoids manual-entry errors; snapshots MRP/tax for history.
- **ADR-186 — Prescription FK validation only in v1 · GOOD** — Sound data decision; track Schedule H dispensing controls separately for regulatory compliance.
- **ADR-187 — Sales returns RESTOCK-only in v1 · NEEDS IMPROVEMENT** — Damaged/expired medicine returned to sellable stock is a patient-safety problem. **Recommendation:** at minimum support `DAMAGED` disposition that does not restock.
- **ADR-188 — Posted sales cancel with stock + ledger reversal · GOOD** — Correct full reversal; marked Superseded — confirm replacement preserves same guarantees.
- **ADR-189 — Sales full permission matrix · GOOD** — Consistent granular RBAC incl. workflow actions.
- **ADR-190 — Sales tests deferred · NEEDS IMPROVEMENT** — Post/cancel reversal and stock movements shipped untested. **Recommendation:** add persistence tests for post/cancel/reversal path before production.
- **ADR-191 — Security: all six RBAC tables + UserBranch · GOOD** — Full RBAC surface + branch scoping.
- **ADR-192 — Admin reset, self change-password, unlock flows · GOOD** — Essential password flows split sensibly.
- **ADR-193 — Permission full CRUD incl. system permissions · NEEDS IMPROVEMENT** — Deleting/mutating seeded system permissions can break RBAC or lock everyone out. **Recommendation:** block delete/edit of `isSystemPermission` rows, or block delete while RolePermission references them.
- **ADR-194 — Junction APIs nested with bulk replace · GOOD** — Bulk replace fits editing assignment set in one screen.
- **ADR-195 — UserSession read + admin force-logout · GOOD** — Covers real need without over-building session management.
- **ADR-196 — Employee link FK validation only · GOOD** — Keeps user↔employee clean without dragging employee CRUD into security.
- **ADR-197 — Full SECURITY permission matrix seed · GOOD** — Granular seeding avoids coarse catch-all.
- **ADR-198 — Security tests deferred · NEEDS IMPROVEMENT** — Untested permission enforcement is a security risk. **Recommendation:** test that guards deny unauthorized access before release.
- **ADR-199 — Public change-required-password endpoint · GOOD** — Solves chicken-and-egg; ensure rate-limited like login.
- **ADR-200 — Full MASTER permission matrix · GOOD** — Consistent, appropriately granular for master data.
- **ADR-201 — Manufacturer requires existing Party (FK only) · GOOD** — Reuses supplier→party pattern.
- **ADR-202 — MedicineSalt nested CRUD + PUT replace · GOOD** — Composition is natural child collection.
- **ADR-203 — System schedule/UOM full CRUD, block delete on FK refs · GOOD** — FK-reference guard protects integrity; unreferenced system rows re-seedable.
- **ADR-204 — Strict soft-delete guards on medicine masters · GOOD** — Blocks deletion of referenced masters.
- **ADR-205 — Client provides unique medicineCode · GOOD** — Codes externally meaningful; client value + uniqueness check matches real usage.
- **ADR-206 — medicineName unique within manufacturerId · GOOD** — Different manufacturers legitimately share names.
- **ADR-207 — MedicineCategory flat CRUD + circular-parent guard · GOOD** — Parent pointer + cycle guard; client assembles tree.
- **ADR-208 — MedicineSalt schema as-is, hard-delete junction rows · NEEDS IMPROVEMENT** — Hard-deletes leave no tombstone for offline-first sync. **Recommendation:** add `deletedAt` migration so MedicineSalt matches soft-delete pattern.

### Pricing, prescription, audit, SCM, closeout (ADR-209–260)

- **ADR-209 — Fix all reviewed medicine issues · GOOD** — Fixing incl. low-priority prevents defect accumulation.
- **ADR-210 — PACK→PACKAGING in constants/seed only · GOOD** — Simplest for pre-release seed value; populated DB keeps old value until fresh reseed.
- **ADR-211 — PPA backend-only, tests deferred · GOOD** — Consistent v1 pattern; no correctness risk from deferral.
- **ADR-212 — PriceList list includes org-wide lists · GOOD** — Reflects how pricing applies (branch + global).
- **ADR-213 — Enforce single default PriceList per scope · GOOD** — Enforcing at write time prevents ambiguous pricing.
- **ADR-214 — PriceListItem nested CRUD + replace · GOOD** — Established collection pattern.
- **ADR-215 — Tax/DiscountRule full CRUD, block delete on FK refs · GOOD** — Protects integrity; updates safe since posted docs snapshot amounts.
- **ADR-216 — Prescription lifecycle via workflow routes · GOOD** — Explicit actions + DRAFT-only edit guard.
- **ADR-217 — Client provides unique prescriptionNumber · GOOD** — Numbers from external paper; client-provided + uniqueness is realistic.
- **ADR-218 — Dispensed fields read-only via API · GOOD** — Prevents tampering with derived dispensing progress.
- **ADR-219 — Sales dispensing hook out of scope in v1 · GOOD** — Honestly documented; fields stay at defaults, no inconsistency.
- **ADR-220 — Audit read APIs + ChangeHistory on UPDATE · GOOD** — Closes real audit gap incrementally.
- **ADR-221 — Audit lists default-filter by JWT branchId · GOOD** — Reasonable safety default for branch-sensitive data.
- **ADR-222 — Full PRICING/PRESCRIPTION/AUDIT matrices · GOOD** — Granular RBAC, least privilege.
- **ADR-223 — PPA fix plan: critical + medium · GOOD** — Reasonable triage prioritizing correctness fixes.
- **ADR-224 — PPA standard-scope simplification · GOOD** — Extracts genuinely repeated logic; no over-refactoring.
- **ADR-225 — SCM backend-only, tests deferred · GOOD** — Consistent pattern; no integrity risk.
- **ADR-226 — Extend SettingsModule with AppSetting CRUD · GOOD** — Additive; keeps settings logic in one place.
- **ADR-227 — New configuration/ module for org tables · GOOD** — Clean boundary between org config and key-value settings.
- **ADR-228 — FinancialYear CRUD + POST close · GOOD** — Explicit close models OPEN→CLOSED; enforcement gap flagged in ADR-256.
- **ADR-229 — SequenceGenerator admin CRUD, internal next() · GOOD** — Keeping allocation internal protects sequence integrity.
- **ADR-230 — Company/Branch CRUD with default/head-office guards · GOOD** — Single-flag enforcement at write time.
- **ADR-231 — Sync admin: outbox read/retry, resolve, no worker · GOOD** — Matches offline-first stance; admin retry/resolve useful and low-risk.
- **ADR-232 — Geographic masters flat CRUD · GOOD** — Parent FKs + cycle guards; simpler than nested routing.
- **ADR-233 — Strict soft-delete reference checks · GOOD** — Protects integrity across FK relationships.
- **ADR-234 — ChangeHistory on UPDATE for config/masters · GOOD** — Consistent audit approach; valuable traceability.
- **ADR-235 — Full CONFIG/SYNC/LOOKUP matrix, keep existing perms · GOOD** — Backward-compatible, consistent RBAC.
- **ADR-236 — SCM fix plan: all review items · GOOD** — Addressing all findings is sound quality work.
- **ADR-237 — Company API tenant-scoped to JWT companyId · GOOD** — Fixes inconsistency; tightens cross-tenant security.
- **ADR-238 — Block SequenceGenerator delete when active · GOOD** — Guards numbering continuity for live documents.
- **ADR-239 — FinancialYear isCurrent stays branch-scoped · NEEDS IMPROVEMENT** — FY is normally a company accounting period; multiple "current" years risks inconsistent posting. **Recommendation:** make `isCurrent` exclusive at company level, or document rationale if branches run independent statutory calendars.
- **ADR-240 — SCM simplification P1+P2+P3 · GOOD** — Concrete dedupe/consistency improvements, not speculative.
- **ADR-241 — Consolidated architecture docs tree · GOOD** — Easier to navigate than inline notes.
- **ADR-242 — Per-module mdc rules point to memory docs · GOOD** — Scoped guidance stays relevant.
- **ADR-243 — Shared utilities in common/ only when 2+ modules · GOOD** — Right balance between duplication and premature abstraction.
- **ADR-244 — PO/Invoice don't change stock · GOOD** — Posting stock at physical receipt is correct boundary.
- **ADR-245 — Ledger balance derived from entries, never stored · GOOD** — Avoids stored-balance drift bug; correct accounting.
- **ADR-246 — Dual settlement via one shared recompute helper · GOOD** — Both paths route through one function; pairs with ADR-184 cap guard recommendation.
- **ADR-247 — OTC (no customer) posts to CASH001 not CUST001 · GOOD** — Cash sales shouldn't create receivables.
- **ADR-248 — Sales post gated by MRP-cap + expired-batch settings · GOOD** — Settings-driven regulatory gates with safe defaults.
- **ADR-249 — Finance Receipt allocation deferred · GOOD** — Still validates balance via shared helper; reasonable v1 cut.
- **ADR-250 — Party nested contacts/addresses via child routes · GOOD** — Follows party CRUD template (ADR-015).
- **ADR-251 — PartyContact ChangeHistory deferred · GOOD** — Minor documented gap (AuditLog still applies); no correctness impact.
- **ADR-252 — Settings list dedupes branch over company · GOOD** — List reflects effective runtime resolution.
- **ADR-253 — Outbox retry only FAILED/PROCESSING → PENDING · GOOD** — Never re-queues completed rows; version-checked.
- **ADR-254 — Sync admin mutations audit-only, no outbox · GOOD** — Local housekeeping shouldn't create recursive sync entries.
- **ADR-255 — SyncLog immutable, read-only HTTP · GOOD** — Append-only history preserves diagnostic integrity.
- **ADR-256 — FY close not enforced on all posting modules · NEEDS IMPROVEMENT** — "Close" that doesn't prevent posting is misleading. **Recommendation:** enforce `FINANCIAL_YEAR_CLOSED` guard in finance/ledger posting path in v1, or label close as non-enforcing.
- **ADR-257 — MFA & password-complexity out of scope v1 · GOOD** — bcrypt + RBAC + forced-change is reasonable v1 baseline.
- **ADR-258 — Stock-take variance server-computed · GOOD** — Server-computing from snapshot prevents client tampering.
- **ADR-259 — Stock-transfer dispatch from DRAFT, approval deferred · GOOD** — Status machine supports adding approval later; reasonable v1 simplification.
- **ADR-260 — auditAndLogChanges helper for UPDATE · GOOD** — One shared helper for genuinely repeated pattern.

---

## 3. Cross-cutting observations

- **Test deferrals cluster on highest-risk modules** — Purchase, finance, sales, and security (ADR-173, 180, 190, 198) are where an untested bug directly corrupts stock, money, or access control.
- **Near-duplicate ADRs** — ADR-163≈169, ADR-164≈168, ADR-161≈166 document the same decision from different sources; harmless but worth doc hygiene if consolidating later.
- **Core strength** — Consistent atomic write pattern (UnitOfWork + outbox + audit in one transaction) applied across every module is the architectural backbone and is sound throughout.

---

*This is a meta-review document, not a numbered ADR. For individual decision records, see the files in this directory or the [Architectural Decision Index](../backend-memory-map.md#architectural-decision-index).*
