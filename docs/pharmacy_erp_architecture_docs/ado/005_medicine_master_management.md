# Phase 5 — Medicine Master Management

## 1. Objective

Build the complete Medicine Master domain that becomes the authoritative reference for medicine/product information used later by Inventory, Purchase, Sales, Prescription, Pricing, Reporting, and Synchronization.

The database overview explicitly defines Medicine Master as a separate functional module containing:

- Medicine
- MedicineGeneric
- MedicineCategory
- MedicineSchedule
- Manufacturer
- SaltComposition
- MedicineSalt
- UnitOfMeasure

The architecture also shows Medicine connected to Manufacturer, MedicineSalt, Category, and SaltComposition. fileciteturn1file0

This phase is therefore a **master-data phase**, not a stock or transaction phase.

---

## 2. Important Boundary

Do **not** mix Medicine Master with Inventory.

### Medicine Master owns

```text
Medicine identity
Generic
Category
Schedule
Manufacturer
Salt Composition
Unit of Measure
Medicine relationships
Medicine search
Medicine lifecycle
Medicine master validation
```

### Inventory owns later

```text
Batch
Stock
Stock Movement
Stock Adjustment
Stock Transfer
Stock Take
```

The database overview explicitly places Batch and stock-related tables under Inventory, not Medicine Master. fileciteturn1file0

Similarly, Purchase and Sales are separate downstream modules. fileciteturn1file0

---

# 3. ADO Hierarchy

```text
EPIC-005 — Medicine Master Management
│
├── FEAT-052 — Medicine Generic Master
├── FEAT-053 — Medicine Category Master
├── FEAT-054 — Medicine Schedule Master
├── FEAT-055 — Manufacturer Master
├── FEAT-056 — Salt Composition Master
├── FEAT-057 — Unit of Measure Master
├── FEAT-058 — Medicine Master
├── FEAT-059 — Medicine-Salt Composition
├── FEAT-060 — Medicine Search & Selection
├── FEAT-061 — Medicine Lifecycle & Data Quality
├── FEAT-062 — Medicine Authorization & Audit
├── FEAT-063 — Medicine API & Shared Services
├── FEAT-064 — Medicine UI/UX & Keyboard Workflow
└── FEAT-065 — Medicine Testing, Performance & Readiness
```

---

# 4. Epic

## EPIC-005 — Medicine Master Management

### Description

Provide a normalized, reusable medicine master that identifies medicines consistently throughout the ERP.

### Business Value

Medicine is one of the most frequently referenced entities in a pharmacy ERP.

The master must support:

```text
Medicine
  ├── Generic
  ├── Category
  ├── Schedule
  ├── Manufacturer
  ├── Salt Composition
  └── Unit of Measure
```

This allows downstream modules to reference medicine master data rather than duplicating medicine descriptions.

### Epic Completion Criteria

- Medicine master can be created, viewed, searched, updated, activated and deactivated.
- Generic, category, schedule, manufacturer, salt composition and UOM masters exist.
- Medicine-to-salt relationships are supported.
- Duplicate medicine creation is controlled.
- Master records are validated.
- APIs are reusable by later modules.
- UI supports fast pharmacy-oriented search.
- Authorization is enforced server-side.
- Audit integration is implemented.
- SQLite and PostgreSQL compatibility is validated.
- Unit and integration tests pass.
- Medicine master is ready for Inventory/Purchase/Sales phases.

---

# 5. Master Data Design Rules

## 5.1 Normalization

Do not store repeated descriptive master data directly in Medicine when a separate master exists.

Prefer:

```text
Medicine
   ↓
medicineGenericId

Medicine
   ↓
categoryId

Medicine
   ↓
scheduleId

Medicine
   ↓
manufacturerId
```

For salt composition:

```text
Medicine
   ↓
MedicineSalt
   ↓
SaltComposition
```

The database architecture explicitly emphasizes normalized tables and avoiding duplicate data. fileciteturn1file16

## 5.2 External Identity

Follow the project database convention:

```text
BIGINT primary key
UUID unique external identifier
```

The database overview specifies BIGINT primary keys, UUID external references, camelCase columns, soft delete, timestamps, and optimistic-locking `version` where applicable. fileciteturn1file0

## 5.3 Lifecycle

Master records should generally use:

```text
createdAt
updatedAt
deletedAt
version
```

and an active/inactive business state where appropriate.

Avoid physical deletion when the record has downstream references.

---

# 6. FEAT-052 — Medicine Generic Master

## Purpose

Maintain generic/active pharmaceutical ingredient reference data.

## US-120 — Create generic

### Acceptance Criteria

1. Authorized users can create a generic.
2. Generic name is mandatory.
3. Duplicate active generics are prevented according to the approved uniqueness rule.
4. Leading/trailing whitespace is normalized.
5. Generic can be marked active/inactive.
6. Creation is audited.

### Tasks

- TASK-001 — Define MedicineGeneric business fields.
- TASK-002 — Define generic naming and normalization rules.
- TASK-003 — Define uniqueness strategy.
- TASK-004 — Implement MedicineGeneric Prisma model.
- TASK-005 — Add primary key and UUID.
- TASK-006 — Add timestamps/lifecycle fields.
- TASK-007 — Add unique/index constraints.
- TASK-008 — Create migration.
- TASK-009 — Implement create DTO.
- TASK-010 — Implement DTO validation.
- TASK-011 — Implement service create method.
- TASK-012 — Implement POST API.
- TASK-013 — Add permission check.
- TASK-014 — Implement create UI.
- TASK-015 — Add create form validation.
- TASK-016 — Add audit event.
- TASK-017 — Add unit tests.
- TASK-018 — Add API integration tests.

## US-121 — Search and view generics

### Acceptance Criteria

1. Users can search by generic name.
2. Search is case-insensitive.
3. Inactive records can be excluded by default.
4. Results support pagination.
5. Search does not expose deleted records.

### Tasks

- TASK-019 — Implement generic list query.
- TASK-020 — Implement generic search query.
- TASK-021 — Add active filter.
- TASK-022 — Add pagination.
- TASK-023 — Add sorting.
- TASK-024 — Implement GET APIs.
- TASK-025 — Implement generic list UI.
- TASK-026 — Implement generic search UI.
- TASK-027 — Add empty-state handling.
- TASK-028 — Add search tests.

## US-122 — Update and deactivate generic

### Tasks

- TASK-029 — Define editable fields.
- TASK-030 — Implement update DTO.
- TASK-031 — Implement update service.
- TASK-032 — Implement update API.
- TASK-033 — Implement update UI.
- TASK-034 — Implement activation/deactivation service.
- TASK-035 — Implement lifecycle API.
- TASK-036 — Implement lifecycle UI.
- TASK-037 — Prevent deactivation when prohibited by dependencies.
- TASK-038 — Add audit integration.
- TASK-039 — Add update/lifecycle tests.

---

# 7. FEAT-053 — Medicine Category Master

## US-123 — Create category

### Acceptance Criteria

1. Category name is mandatory.
2. Duplicate categories are prevented.
3. Category supports active/inactive lifecycle.
4. Category creation is authorized and audited.

### Tasks

- TASK-040 — Define category fields.
- TASK-041 — Define category uniqueness.
- TASK-042 — Implement MedicineCategory Prisma model.
- TASK-043 — Add constraints/indexes.
- TASK-044 — Create migration.
- TASK-045 — Implement category DTO.
- TASK-046 — Implement validation.
- TASK-047 — Implement service.
- TASK-048 — Implement create API.
- TASK-049 — Implement create UI.
- TASK-050 — Add authorization.
- TASK-051 — Add audit event.
- TASK-052 — Add tests.

## US-124 — Manage categories

### Tasks

- TASK-053 — Implement category search.
- TASK-054 — Implement category list API.
- TASK-055 — Implement category list UI.
- TASK-056 — Implement category update.
- TASK-057 — Implement category update UI.
- TASK-058 — Implement category activation/deactivation.
- TASK-059 — Add dependency validation.
- TASK-060 — Add pagination/sorting.
- TASK-061 — Add lifecycle audit.
- TASK-062 — Add integration tests.

---

# 8. FEAT-054 — Medicine Schedule Master

## Purpose

Maintain medicine schedule/classification data required by pharmacy operations.

## US-125 — Create and manage schedule

### Acceptance Criteria

1. Schedule identifier/name is maintained centrally.
2. Duplicate schedules are prevented.
3. Schedule can be activated/deactivated.
4. Medicine can reference a schedule.
5. Schedule changes are audited.

### Tasks

- TASK-063 — Define MedicineSchedule fields.
- TASK-064 — Define schedule naming convention.
- TASK-065 — Define uniqueness rules.
- TASK-066 — Implement Prisma model.
- TASK-067 — Add constraints/indexes.
- TASK-068 — Create migration.
- TASK-069 — Implement DTOs.
- TASK-070 — Implement service.
- TASK-071 — Implement CRUD APIs.
- TASK-072 — Implement schedule UI.
- TASK-073 — Implement search/filter.
- TASK-074 — Implement lifecycle.
- TASK-075 — Add dependency checks.
- TASK-076 — Add audit events.
- TASK-077 — Add unit tests.
- TASK-078 — Add integration tests.

## US-126 — Select schedule from Medicine form

### Tasks

- TASK-079 — Implement schedule lookup endpoint.
- TASK-080 — Implement frontend schedule lookup.
- TASK-081 — Add keyboard-search support.
- TASK-082 — Add inactive-record filtering.
- TASK-083 — Add schedule selection validation.
- TASK-084 — Add UI integration tests.

---

# 9. FEAT-055 — Manufacturer Master

## US-127 — Create manufacturer

### Acceptance Criteria

1. Manufacturer is represented through the normalized manufacturer master.
2. Manufacturer name is mandatory.
3. Duplicate manufacturers are controlled.
4. Manufacturer can be activated/deactivated.
5. Manufacturer can later be referenced by Medicine.
6. Manufacturer data is auditable.

### Tasks

- TASK-085 — Define Manufacturer fields.
- TASK-086 — Define manufacturer uniqueness strategy.
- TASK-087 — Implement Manufacturer Prisma model.
- TASK-088 — Add UUID and lifecycle fields.
- TASK-089 — Add constraints/indexes.
- TASK-090 — Create migration.
- TASK-091 — Implement DTO.
- TASK-092 — Implement validation.
- TASK-093 — Implement service.
- TASK-094 — Implement CRUD APIs.
- TASK-095 — Implement manufacturer UI.
- TASK-096 — Add authorization.
- TASK-097 — Add audit integration.
- TASK-098 — Add tests.

## US-128 — Search and manage manufacturers

### Tasks

- TASK-099 — Implement manufacturer search.
- TASK-100 — Implement manufacturer list.
- TASK-101 — Implement pagination.
- TASK-102 — Implement sorting.
- TASK-103 — Implement update.
- TASK-104 — Implement activation/deactivation.
- TASK-105 — Implement dependency validation.
- TASK-106 — Implement lookup API.
- TASK-107 — Implement lookup component.
- TASK-108 — Add lifecycle audit.
- TASK-109 — Add integration tests.

---

# 10. FEAT-056 — Salt Composition Master

## Purpose

Maintain individual salt/active-ingredient composition records.

## US-129 — Create salt composition

### Acceptance Criteria

1. Salt composition has a normalized master record.
2. Name is mandatory.
3. Duplicate salts are controlled.
4. Salt can be activated/deactivated.
5. Salt can be referenced by multiple medicines.
6. Salt changes are audited.

### Tasks

- TASK-110 — Define SaltComposition fields.
- TASK-111 — Define salt naming rules.
- TASK-112 — Define uniqueness rules.
- TASK-113 — Implement Prisma model.
- TASK-114 — Add UUID/lifecycle fields.
- TASK-115 — Add indexes.
- TASK-116 — Create migration.
- TASK-117 — Implement DTO.
- TASK-118 — Implement validation.
- TASK-119 — Implement service.
- TASK-120 — Implement CRUD APIs.
- TASK-121 — Implement salt management UI.
- TASK-122 — Add authorization.
- TASK-123 — Add audit integration.
- TASK-124 — Add tests.

## US-130 — Search salt composition

### Tasks

- TASK-125 — Implement salt search.
- TASK-126 — Implement salt lookup API.
- TASK-127 — Implement frontend lookup.
- TASK-128 — Add pagination.
- TASK-129 — Add sorting.
- TASK-130 — Add active filtering.
- TASK-131 — Add inactive dependency validation.
- TASK-132 — Add integration tests.

---

# 11. FEAT-057 — Unit of Measure Master

## Purpose

Provide normalized units for medicine quantities and later transaction modules.

## US-131 — Create unit of measure

### Acceptance Criteria

1. UOM name is mandatory.
2. UOM code is supported where required.
3. Duplicate UOMs are prevented.
4. Active/inactive lifecycle is supported.
5. UOM can be referenced by Medicine.

### Tasks

- TASK-133 — Define UnitOfMeasure fields.
- TASK-134 — Define UOM code/name rules.
- TASK-135 — Define uniqueness.
- TASK-136 — Implement Prisma model.
- TASK-137 — Add constraints/indexes.
- TASK-138 — Create migration.
- TASK-139 — Implement DTO.
- TASK-140 — Implement validation.
- TASK-141 — Implement service.
- TASK-142 — Implement CRUD APIs.
- TASK-143 — Implement UOM UI.
- TASK-144 — Add authorization.
- TASK-145 — Add audit integration.
- TASK-146 — Add tests.

## US-132 — Provide UOM lookup

### Tasks

- TASK-147 — Implement UOM lookup API.
- TASK-148 — Implement UOM frontend lookup.
- TASK-149 — Add active-only lookup.
- TASK-150 — Add search support.
- TASK-151 — Add caching/read optimization if justified.
- TASK-152 — Add lookup tests.

---

# 12. FEAT-058 — Medicine Master

## US-133 — Create medicine

### User Story

As an authorized pharmacy administrator, I want to create a medicine master record so that the medicine can be consistently referenced across the ERP.

### Acceptance Criteria

1. Medicine has a stable internal ID and UUID.
2. Medicine has a controlled business identity/code according to the finalized schema.
3. Medicine name/display name is validated.
4. Generic/category/schedule/manufacturer/UOM references are validated.
5. Invalid referenced master IDs are rejected.
6. Duplicate medicines are detected according to approved business rules.
7. Medicine starts in the appropriate lifecycle state.
8. Creation is audited.
9. The API does not accept arbitrary duplicated master descriptions where IDs should be used.
10. The operation is protected by permission.

### Tasks

- TASK-153 — Finalize Medicine fields against schema.
- TASK-154 — Define Medicine business identity.
- TASK-155 — Define medicine code strategy.
- TASK-156 — Define medicine name/display-name rules.
- TASK-157 — Define reference-field requirements.
- TASK-158 — Define duplicate detection strategy.
- TASK-159 — Implement Medicine Prisma model.
- TASK-160 — Add UUID.
- TASK-161 — Add lifecycle fields.
- TASK-162 — Add optimistic-lock version.
- TASK-163 — Add foreign keys.
- TASK-164 — Add indexes.
- TASK-165 — Create migration.
- TASK-166 — Implement create DTO.
- TASK-167 — Implement DTO validation.
- TASK-168 — Implement reference validation.
- TASK-169 — Implement duplicate detection.
- TASK-170 — Implement Medicine service.
- TASK-171 — Implement create API.
- TASK-172 — Add authorization.
- TASK-173 — Add audit event.
- TASK-174 — Implement medicine create page.
- TASK-175 — Implement generic lookup.
- TASK-176 — Implement category lookup.
- TASK-177 — Implement schedule lookup.
- TASK-178 — Implement manufacturer lookup.
- TASK-179 — Implement UOM lookup.
- TASK-180 — Implement form validation.
- TASK-181 — Add create tests.
- TASK-182 — Add integration tests.

## US-134 — View and search medicines

### Acceptance Criteria

1. Medicine search supports name/code and approved searchable attributes.
2. Search is fast enough for pharmacy workflow.
3. Active medicines can be prioritized.
4. Inactive medicines are excluded from normal selection by default.
5. Search supports pagination.
6. Search results contain enough information for safe selection.
7. Search does not return deleted records.

### Tasks

- TASK-183 — Define medicine search fields.
- TASK-184 — Define search ranking/order.
- TASK-185 — Implement medicine search query.
- TASK-186 — Add database indexes for search.
- TASK-187 — Implement paginated API.
- TASK-188 — Implement medicine list API.
- TASK-189 — Implement medicine detail API.
- TASK-190 — Implement medicine list UI.
- TASK-191 — Implement global medicine lookup component.
- TASK-192 — Implement keyboard search.
- TASK-193 — Implement result highlighting.
- TASK-194 — Implement filters.
- TASK-195 — Implement sorting.
- TASK-196 — Implement pagination.
- TASK-197 — Implement empty-state UX.
- TASK-198 — Add search performance test.
- TASK-199 — Add API tests.
- TASK-200 — Add UI tests.

## US-135 — Update medicine

### Acceptance Criteria

1. Authorized users can update permitted medicine fields.
2. Referenced master records must remain valid.
3. Sensitive/identity fields have explicit edit rules.
4. Optimistic locking prevents silent overwrites where applicable.
5. Changes are audited.
6. Existing downstream references remain consistent.

### Tasks

- TASK-201 — Define editable/non-editable fields.
- TASK-202 — Implement update DTO.
- TASK-203 — Implement version validation.
- TASK-204 — Implement update service.
- TASK-205 — Implement update API.
- TASK-206 — Implement edit UI.
- TASK-207 — Implement stale-version error UX.
- TASK-208 — Implement reference revalidation.
- TASK-209 — Add audit integration.
- TASK-210 — Add update tests.
- TASK-211 — Add concurrency tests.

## US-136 — Activate/deactivate medicine

### Acceptance Criteria

1. Authorized users can change medicine lifecycle state.
2. Deactivated medicines do not appear in normal sales/purchase selection.
3. Existing historical transactions remain readable.
4. Deactivation does not delete medicine data.
5. Dependencies can prevent deactivation where business rules require it.
6. Lifecycle change is audited.

### Tasks

- TASK-212 — Define medicine lifecycle rules.
- TASK-213 — Implement activation service.
- TASK-214 — Implement deactivation service.
- TASK-215 — Implement lifecycle API.
- TASK-216 — Implement lifecycle UI.
- TASK-217 — Add downstream dependency checks.
- TASK-218 — Add inactive-selection behavior.
- TASK-219 — Add audit events.
- TASK-220 — Add lifecycle tests.

---

# 13. FEAT-059 — Medicine-Salt Composition

## US-137 — Associate salt with medicine

### Acceptance Criteria

1. A medicine can have one or more salt composition records where applicable.
2. Each association references a valid SaltComposition.
3. Duplicate associations are prevented.
4. Composition information can include the required quantity/strength representation according to the finalized schema.
5. Association ordering/display rules are defined where needed.
6. Changes are auditable.

### Tasks

- TASK-221 — Finalize MedicineSalt schema.
- TASK-222 — Define Medicine-to-Salt cardinality.
- TASK-223 — Define composition strength representation.
- TASK-224 — Define unit/strength validation.
- TASK-225 — Implement MedicineSalt Prisma model.
- TASK-226 — Add foreign keys.
- TASK-227 — Add uniqueness constraints.
- TASK-228 — Add indexes.
- TASK-229 — Create migration.
- TASK-230 — Implement association DTO.
- TASK-231 — Implement validation.
- TASK-232 — Implement association service.
- TASK-233 — Implement association API.
- TASK-234 — Implement medicine salt UI.
- TASK-235 — Implement salt lookup.
- TASK-236 — Implement add/remove composition.
- TASK-237 — Implement composition ordering/display.
- TASK-238 — Add authorization.
- TASK-239 — Add audit integration.
- TASK-240 — Add tests.

## US-138 — Maintain medicine composition

### Tasks

- TASK-241 — Implement edit composition.
- TASK-242 — Implement remove composition.
- TASK-243 — Prevent invalid empty composition where required.
- TASK-244 — Validate inactive salt references.
- TASK-245 — Add optimistic-lock handling.
- TASK-246 — Add composition integration tests.

---

# 14. FEAT-060 — Medicine Search & Selection

## US-139 — Provide reusable medicine lookup

### Acceptance Criteria

1. Later modules can reuse the same medicine search service/component.
2. Search can be performed by medicine name.
3. Search can support medicine code.
4. Search can support barcode-related identifiers later without changing the core UX.
5. Result selection returns a stable medicine identifier.
6. Inactive medicines are excluded by default.
7. Lookup is keyboard friendly.

### Tasks

- TASK-247 — Define shared medicine lookup contract.
- TASK-248 — Implement shared backend lookup service.
- TASK-249 — Implement lookup API.
- TASK-250 — Implement Angular reusable lookup component.
- TASK-251 — Implement keyboard navigation.
- TASK-252 — Implement debounced search.
- TASK-253 — Implement minimum search-length rules.
- TASK-254 — Implement loading state.
- TASK-255 — Implement no-result state.
- TASK-256 — Implement selection event contract.
- TASK-257 — Add lookup authorization.
- TASK-258 — Add component tests.
- TASK-259 — Add API tests.

## US-140 — Support pharmacy-friendly quick selection

### Tasks

- TASK-260 — Define keyboard shortcuts.
- TASK-261 — Implement focus management.
- TASK-262 — Implement Enter-to-select.
- TASK-263 — Implement Escape-to-close.
- TASK-264 — Implement arrow-key navigation.
- TASK-265 — Implement recent-search behavior if approved.
- TASK-266 — Add usability tests.

---

# 15. FEAT-061 — Medicine Lifecycle & Data Quality

## US-141 — Prevent duplicate medicine master records

### Acceptance Criteria

1. Duplicate detection occurs before creation.
2. Exact duplicates are blocked where deterministically identifiable.
3. Potential duplicates can be surfaced for user review where appropriate.
4. The system does not silently merge records.
5. Duplicate detection does not rely only on UI validation.

### Tasks

- TASK-267 — Define deterministic duplicate fields.
- TASK-268 — Define normalized comparison rules.
- TASK-269 — Implement backend duplicate validation.
- TASK-270 — Implement potential-duplicate query.
- TASK-271 — Implement duplicate warning UI.
- TASK-272 — Add database constraints where possible.
- TASK-273 — Add duplicate tests.

## US-142 — Handle inactive/deleted master dependencies

### Acceptance Criteria

1. Deleted references are never silently accepted.
2. Existing historical medicine records remain readable.
3. Inactive referenced masters are handled according to explicit business rules.
4. Deletion is prevented when it would break integrity.

### Tasks

- TASK-274 — Define dependency lifecycle rules.
- TASK-275 — Implement dependency validation service.
- TASK-276 — Implement safe-delete checks.
- TASK-277 — Implement soft-delete behavior.
- TASK-278 — Implement historical read behavior.
- TASK-279 — Add dependency tests.

## US-143 — Support optimistic concurrency

### Tasks

- TASK-280 — Define Medicine versioning rules.
- TASK-281 — Implement version comparison.
- TASK-282 — Implement conflict response.
- TASK-283 — Implement UI stale-data handling.
- TASK-284 — Add concurrency tests.

---

# 16. FEAT-062 — Medicine Authorization & Audit

## US-144 — Enforce Medicine permissions

Recommended permissions:

```text
Medicine.View
Medicine.Create
Medicine.Update
Medicine.Delete
Medicine.Activate
Medicine.Deactivate

MedicineGeneric.View
MedicineGeneric.Manage

MedicineCategory.View
MedicineCategory.Manage

MedicineSchedule.View
MedicineSchedule.Manage

Manufacturer.View
Manufacturer.Manage

SaltComposition.View
SaltComposition.Manage

UnitOfMeasure.View
UnitOfMeasure.Manage
```

### Tasks

- TASK-285 — Finalize Medicine permission catalog.
- TASK-286 — Seed Medicine permissions.
- TASK-287 — Add backend permission guards.
- TASK-288 — Add frontend permission directives.
- TASK-289 — Protect create/update actions.
- TASK-290 — Protect lifecycle actions.
- TASK-291 — Protect master-management screens.
- TASK-292 — Add unauthorized API tests.
- TASK-293 — Add unauthorized UI tests.

## US-145 — Audit Medicine changes

### Events

```text
MedicineCreated
MedicineUpdated
MedicineActivated
MedicineDeactivated
MedicineDeleted
MedicineSaltAdded
MedicineSaltUpdated
MedicineSaltRemoved
GenericCreated
GenericUpdated
CategoryCreated
CategoryUpdated
ScheduleCreated
ScheduleUpdated
ManufacturerCreated
ManufacturerUpdated
SaltCompositionCreated
SaltCompositionUpdated
UnitOfMeasureCreated
UnitOfMeasureUpdated
```

### Tasks

- TASK-294 — Define Medicine audit taxonomy.
- TASK-295 — Implement Medicine create audit.
- TASK-296 — Implement Medicine update audit.
- TASK-297 — Implement Medicine lifecycle audit.
- TASK-298 — Implement MedicineSalt audit.
- TASK-299 — Implement supporting-master audit.
- TASK-300 — Validate sensitive-data redaction.
- TASK-301 — Add audit integration tests.

---

# 17. FEAT-063 — Medicine API & Shared Services

## US-146 — Implement REST API standards

### API examples

```text
GET    /medicines
GET    /medicines/{id}
POST   /medicines
PUT    /medicines/{id}
DELETE /medicines/{id}

GET    /medicine-generics
GET    /medicine-categories
GET    /medicine-schedules
GET    /manufacturers
GET    /salt-compositions
GET    /units-of-measure
```

These follow the project's REST-oriented API direction. fileciteturn1file3

### Tasks

- TASK-302 — Define endpoint naming.
- TASK-303 — Define request/response DTO contracts.
- TASK-304 — Define pagination contract.
- TASK-305 — Define sorting contract.
- TASK-306 — Define filtering contract.
- TASK-307 — Define standard error response.
- TASK-308 — Implement Medicine controller.
- TASK-309 — Implement supporting master controllers.
- TASK-310 — Implement DTO validation.
- TASK-311 — Implement service-layer business rules.
- TASK-312 — Keep controllers thin.
- TASK-313 — Add API documentation.
- TASK-314 — Add API integration tests.

## US-147 — Implement reusable Medicine service

### Tasks

- TASK-315 — Define MedicineService contract.
- TASK-316 — Implement create.
- TASK-317 — Implement update.
- TASK-318 — Implement get-by-id.
- TASK-319 — Implement search.
- TASK-320 — Implement lifecycle.
- TASK-321 — Implement composition management.
- TASK-322 — Implement duplicate validation.
- TASK-323 — Implement reference validation.
- TASK-324 — Add unit tests.

## US-148 — Integrate Medicine with offline-first architecture

The architecture handbook states that the local database is the source of truth during daily operation and that synchronization should use delta sync, push/pull, background sync, an Outbox pattern, idempotency and conflict resolution. It also specifically states that Medicine Master should prefer server authority during conflicts. fileciteturn1file3

### Tasks

- TASK-325 — Identify Medicine mutations requiring Outbox entries.
- TASK-326 — Define Medicine sync payload.
- TASK-327 — Define Medicine external UUID contract.
- TASK-328 — Define Medicine sync version/timestamp fields.
- TASK-329 — Define server-authoritative conflict policy.
- TASK-330 — Implement Outbox event generation.
- TASK-331 — Implement sync metadata handling.
- TASK-332 — Add idempotency handling.
- TASK-333 — Add conflict detection.
- TASK-334 — Add Medicine sync tests.

---

# 18. FEAT-064 — Medicine UI/UX & Keyboard Workflow

## US-149 — Build Medicine list screen

### Acceptance Criteria

1. List is optimized for fast master-data lookup.
2. Search is prominent.
3. Filters are available.
4. Active/inactive state is visible.
5. User can open details.
6. Authorization controls available actions.
7. Pagination is available for large datasets.

### Tasks

- TASK-335 — Create Medicine list route.
- TASK-336 — Create Medicine list component.
- TASK-337 — Define grid columns.
- TASK-338 — Implement search field.
- TASK-339 — Implement filters.
- TASK-340 — Implement sorting.
- TASK-341 — Implement pagination.
- TASK-342 — Implement loading state.
- TASK-343 — Implement error state.
- TASK-344 — Implement empty state.
- TASK-345 — Implement permission-aware actions.
- TASK-346 — Add list tests.

## US-150 — Build Medicine create/edit screen

### Tasks

- TASK-347 — Create Medicine form route.
- TASK-348 — Create reactive form.
- TASK-349 — Implement medicine identity section.
- TASK-350 — Implement generic selection.
- TASK-351 — Implement category selection.
- TASK-352 — Implement schedule selection.
- TASK-353 — Implement manufacturer selection.
- TASK-354 — Implement UOM selection.
- TASK-355 — Implement salt composition section.
- TASK-356 — Implement validation messages.
- TASK-357 — Implement unsaved-change protection.
- TASK-358 — Implement save state.
- TASK-359 — Implement success feedback.
- TASK-360 — Implement error handling.
- TASK-361 — Add form tests.

## US-151 — Build supporting master screens

### Tasks

- TASK-362 — Build Generic management screen.
- TASK-363 — Build Category management screen.
- TASK-364 — Build Schedule management screen.
- TASK-365 — Build Manufacturer management screen.
- TASK-366 — Build Salt Composition management screen.
- TASK-367 — Build UOM management screen.
- TASK-368 — Reuse common CRUD components.
- TASK-369 — Add permission-aware actions.
- TASK-370 — Add lifecycle controls.
- TASK-371 — Add UI tests.

## US-152 — Implement keyboard-first Medicine workflow

The architecture handbook explicitly recommends keyboard-first operation and a workflow-driven UI for the ERP. fileciteturn1file3

### Tasks

- TASK-372 — Define Medicine keyboard shortcuts.
- TASK-373 — Implement focus order.
- TASK-374 — Implement keyboard search.
- TASK-375 — Implement Enter selection.
- TASK-376 — Implement Escape cancellation.
- TASK-377 — Implement shortcut help.
- TASK-378 — Test keyboard-only operation.
- TASK-379 — Test focus accessibility.

---

# 19. FEAT-065 — Medicine Testing, Performance & Readiness

## US-153 — Unit test Medicine domain

### Tasks

- TASK-380 — Test Medicine validation.
- TASK-381 — Test duplicate detection.
- TASK-382 — Test reference validation.
- TASK-383 — Test lifecycle rules.
- TASK-384 — Test MedicineSalt rules.
- TASK-385 — Test optimistic locking.
- TASK-386 — Test service authorization.
- TASK-387 — Test audit events.
- TASK-388 — Test supporting masters.

## US-154 — API integration testing

### Tasks

- TASK-389 — Test Medicine create API.
- TASK-390 — Test Medicine update API.
- TASK-391 — Test Medicine search API.
- TASK-392 — Test Medicine detail API.
- TASK-393 — Test Medicine lifecycle API.
- TASK-394 — Test MedicineSalt API.
- TASK-395 — Test generic API.
- TASK-396 — Test category API.
- TASK-397 — Test schedule API.
- TASK-398 — Test manufacturer API.
- TASK-399 — Test salt API.
- TASK-400 — Test UOM API.
- TASK-401 — Test authorization failures.
- TASK-402 — Test validation failures.
- TASK-403 — Test concurrency failures.

## US-155 — UI testing

### Tasks

- TASK-404 — Test Medicine list.
- TASK-405 — Test Medicine search.
- TASK-406 — Test Medicine create.
- TASK-407 — Test Medicine edit.
- TASK-408 — Test Medicine lifecycle.
- TASK-409 — Test salt composition UI.
- TASK-410 — Test lookup components.
- TASK-411 — Test keyboard workflow.
- TASK-412 — Test permission-based UI.
- TASK-413 — Test error states.
- TASK-414 — Test unsaved changes.

## US-156 — Performance testing

### Acceptance Criteria

1. Search remains responsive with realistic master-data volume.
2. Lookup endpoints do not load the complete medicine table unnecessarily.
3. Queries use appropriate indexes.
4. Pagination is server-side.
5. UI does not request excessive data.

### Tasks

- TASK-415 — Define realistic medicine dataset.
- TASK-416 — Seed performance dataset.
- TASK-417 — Benchmark medicine search.
- TASK-418 — Benchmark generic lookup.
- TASK-419 — Benchmark category lookup.
- TASK-420 — Benchmark manufacturer lookup.
- TASK-421 — Inspect query plans.
- TASK-422 — Add missing indexes.
- TASK-423 — Re-run benchmarks.
- TASK-424 — Test frontend rendering performance.

## US-157 — Database compatibility testing

### Tasks

- TASK-425 — Validate SQLite migration.
- TASK-426 — Validate PostgreSQL migration compatibility.
- TASK-427 — Validate foreign keys.
- TASK-428 — Validate unique constraints.
- TASK-429 — Validate indexes.
- TASK-430 — Validate soft-delete behavior.
- TASK-431 — Validate optimistic locking.
- TASK-432 — Validate Prisma-generated client.
- TASK-433 — Run integration suite against SQLite.
- TASK-434 — Run compatibility suite against PostgreSQL.

## US-158 — Phase readiness and documentation

### Tasks

- TASK-435 — Document Medicine domain.
- TASK-436 — Document supporting master relationships.
- TASK-437 — Document API endpoints.
- TASK-438 — Document permissions.
- TASK-439 — Document audit events.
- TASK-440 — Document sync behavior.
- TASK-441 — Document duplicate rules.
- TASK-442 — Document lifecycle rules.
- TASK-443 — Document search behavior.
- TASK-444 — Document UI workflow.
- TASK-445 — Review acceptance criteria.
- TASK-446 — Complete code review.
- TASK-447 — Complete security review.
- TASK-448 — Complete database review.
- TASK-449 — Complete UI review.
- TASK-450 — Complete QA sign-off.
- TASK-451 — Confirm downstream module readiness.

---

# 20. Recommended Initial Permission Catalog

```text
Medicine.View
Medicine.Create
Medicine.Update
Medicine.Delete
Medicine.Activate
Medicine.Deactivate

MedicineGeneric.View
MedicineGeneric.Create
MedicineGeneric.Update
MedicineGeneric.Delete

MedicineCategory.View
MedicineCategory.Create
MedicineCategory.Update
MedicineCategory.Delete

MedicineSchedule.View
MedicineSchedule.Create
MedicineSchedule.Update
MedicineSchedule.Delete

Manufacturer.View
Manufacturer.Create
Manufacturer.Update
Manufacturer.Delete

SaltComposition.View
SaltComposition.Create
SaltComposition.Update
SaltComposition.Delete

UnitOfMeasure.View
UnitOfMeasure.Create
UnitOfMeasure.Update
UnitOfMeasure.Delete
```

The final permission granularity should be aligned with the Phase 4 security framework.

---

# 21. Suggested Medicine UI

## Medicine List

```text
┌────────────────────────────────────────────────────────────┐
│ Medicine Master                              [+ New]        │
├────────────────────────────────────────────────────────────┤
│ Search Medicine...                                         │
│                                                            │
│ Category   Schedule   Manufacturer   Status                │
├────────────────────────────────────────────────────────────┤
│ Medicine │ Generic │ Manufacturer │ Category │ Status      │
│------------------------------------------------------------│
│ ...                                                        │
└────────────────────────────────────────────────────────────┘
```

## Medicine Form

```text
Medicine Identity
────────────────────────────────
Medicine Name
Medicine Code

Classification
────────────────────────────────
Generic
Category
Schedule
Manufacturer
Unit of Measure

Composition
────────────────────────────────
Salt              Strength       UOM
------------------------------------------------
Amoxicillin       500            mg
Clavulanate       125            mg

Status
────────────────────────────────
Active / Inactive

[Cancel] [Save]
```

This is intentionally a master-data screen. Batch, expiry, stock quantity, purchase cost, sale price and stock movement do **not** belong in this phase.

---

# 22. Important Data Ownership

| Data | Owner |
|---|---|
| Medicine identity | Medicine Master |
| Generic | Medicine Master |
| Category | Medicine Master |
| Schedule | Medicine Master |
| Manufacturer | Medicine Master |
| Salt composition | Medicine Master |
| Unit of Measure | Medicine Master |
| Batch number | Inventory |
| Expiry date | Inventory |
| Stock quantity | Inventory |
| Purchase cost | Purchase |
| Sale price | Pricing/Sales |
| Tax | Pricing |
| Discount | Pricing |
| Customer | Party |
| Supplier | Party |
| Prescription | Prescription |

This separation is important because the database architecture explicitly separates Medicine Master, Inventory, Purchase, Sales, Pricing, and Prescription into different functional modules. fileciteturn1file0

---

# 23. Downstream Dependency Flow

After Phase 5:

```text
                    Medicine Master
                         │
        ┌────────────────┼─────────────────┐
        │                │                 │
        ▼                ▼                 ▼
    Inventory         Purchase           Sales
        │                │                 │
        ▼                ▼                 ▼
      Batch         Purchase Item      Sales Item
        │
        ▼
      Stock
```

Prescription will also consume medicine master data:

```text
Prescription
      │
      ▼
PrescriptionItem
      │
      ▼
Medicine
```

The database overview explicitly shows Prescription and Sales as separate downstream domains. fileciteturn1file1

---

# 24. Offline-First Requirements

Medicine master must work with the project's offline-first model.

The architecture defines:

```text
Local SQLite
    ↓
Source of Truth during daily operation
    ↓
Outbox
    ↓
Background Sync
    ↓
Cloud
```

and identifies Medicine Master as a case where **server authority is preferred during conflict resolution**. fileciteturn1file3

Therefore:

- Medicine mutations must be synchronization-aware.
- UUID must be stable.
- Changes must be represented in the Outbox.
- Duplicate synchronization must be idempotent.
- Conflict detection must be version/timestamp based.
- Medicine master conflicts should prefer server authority according to the existing architecture.
- Local operation must remain usable while offline.

---

# 25. Security Requirements

The architecture handbook explicitly requires permissions to be checked in the backend, not only in the UI. fileciteturn1file3

Therefore:

```text
Angular
  ↓
UI permission check
  ↓
UX only

NestJS
  ↓
Authentication
  ↓
Authorization
  ↓
Business rule validation
  ↓
Prisma
```

Never rely solely on:

```text
Hide "Delete" button
```

The API must independently reject unauthorized deletion.

---

# 26. Testing Matrix

| Area | Required Tests |
|---|---|
| Medicine | Create / Read / Update / Lifecycle |
| Generic | CRUD / Duplicate / Lifecycle |
| Category | CRUD / Duplicate / Lifecycle |
| Schedule | CRUD / Duplicate / Lifecycle |
| Manufacturer | CRUD / Duplicate / Lifecycle |
| Salt | CRUD / Duplicate / Lifecycle |
| UOM | CRUD / Duplicate / Lifecycle |
| MedicineSalt | Add / Update / Remove / Duplicate |
| Authorization | Allowed / Denied |
| Validation | Missing / Invalid / Duplicate |
| Concurrency | Stale version |
| Search | Exact / Partial / Empty |
| Pagination | First / Middle / Last |
| Offline | Create/update while offline |
| Sync | Push / Retry / Idempotency |
| Conflict | Server-authoritative resolution |
| Audit | Create / Update / Delete / Lifecycle |
| UI | Forms / Lists / Lookup |
| Keyboard | Search / Select / Cancel |
| Performance | Large dataset search |
| Database | SQLite / PostgreSQL |

---

# 27. Definition of Done

Phase 5 is complete only when:

- [ ] Medicine schema is finalized.
- [ ] MedicineGeneric is implemented.
- [ ] MedicineCategory is implemented.
- [ ] MedicineSchedule is implemented.
- [ ] Manufacturer is implemented.
- [ ] SaltComposition is implemented.
- [ ] UnitOfMeasure is implemented.
- [ ] MedicineSalt is implemented.
- [ ] Medicine CRUD is implemented.
- [ ] Medicine search is implemented.
- [ ] Medicine lifecycle is implemented.
- [ ] Duplicate protection is implemented.
- [ ] Optimistic concurrency is implemented where required.
- [ ] Backend authorization is implemented.
- [ ] Frontend permission handling is implemented.
- [ ] Audit integration is implemented.
- [ ] Offline Outbox integration is implemented.
- [ ] Sync/idempotency rules are implemented.
- [ ] Server-authoritative conflict behavior is defined.
- [ ] UI follows keyboard-first principles.
- [ ] Reusable medicine lookup exists.
- [ ] Unit tests pass.
- [ ] API integration tests pass.
- [ ] UI tests pass.
- [ ] Performance tests pass.
- [ ] SQLite compatibility is verified.
- [ ] PostgreSQL compatibility is verified.
- [ ] Documentation is complete.
- [ ] QA sign-off is complete.

---

# 28. Phase 5 Work Item Summary

| Type | Count |
|---|---:|
| Epic | 1 |
| Features | 14 |
| User Stories | 39 |
| Tasks | 451 |
| **Total Work Items** | **505** |

The task-level breakdown is intentionally extensive so that database, NestJS backend, Angular UI, security, audit, offline synchronization, testing, performance and documentation can be tracked independently in ADO.

Tasks can be merged into larger implementation tasks during sprint planning if desired.

---

# 29. Phase 5 Boundary

At the end of Phase 5, the ERP knows:

```text
WHAT the medicine is
```

It does **not** yet know:

```text
HOW MUCH stock exists
WHICH batch is available
WHEN a batch expires
WHAT it cost to purchase
WHAT price it should be sold for
HOW much tax applies
HOW much was sold
```

Those belong to subsequent domains.

The intended progression is:

```text
Phase 5
Medicine Master
     ↓
Phase 6
Inventory
     ↓
Phase 7
Purchase
     ↓
Phase 8
Sales
```

This prevents the Medicine master from becoming a dumping ground for transactional data.

---

# 30. Final Phase Architecture

```text
                     MEDICINE MASTER
                           │
       ┌───────────────────┼────────────────────┐
       │                   │                    │
       ▼                   ▼                    ▼
 MedicineGeneric     MedicineCategory     MedicineSchedule
       │                   │                    │
       └───────────────────┼────────────────────┘
                           │
                           ▼
                        Medicine
                           │
       ┌───────────────────┼────────────────────┐
       │                   │                    │
       ▼                   ▼                    ▼
 Manufacturer       MedicineSalt        UnitOfMeasure
                           │
                           ▼
                    SaltComposition
```

Downstream:

```text
Medicine
   │
   ├──────────────► Inventory
   │                    │
   │                    ├── Batch
   │                    ├── Stock
   │                    └── StockMovement
   │
   ├──────────────► Purchase
   │
   ├──────────────► Sales
   │
   ├──────────────► Prescription
   │
   └──────────────► Pricing
```

This keeps Phase 5 focused on the authoritative Medicine Master while allowing every later transactional module to consume the same normalized medicine identity.
