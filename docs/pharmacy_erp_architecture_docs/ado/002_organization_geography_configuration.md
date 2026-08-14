# Phase 2 — Organization, Geography & Configuration

## 1. Objective

Establish the organization, branch, geographic, financial-year, numbering, application-setting, printer, and barcode configuration capabilities required by the Pharmacy ERP.

This phase builds the configuration and reference foundation that later business modules depend on.

The database overview identifies the following tables for this area:

- Company
- Branch
- FinancialYear
- SequenceGenerator
- AppSetting
- PrinterConfiguration
- BarcodeConfiguration
- Country
- State
- City
- Area

The geographic hierarchy is:

```text
Country
   ↓
State
   ↓
City
   ↓
Area
```

The database architecture also establishes soft delete, timestamps, BIGINT primary keys, UUID external references, and optimistic locking as general conventions.

---

# 2. Scope

## In Scope

- Company management
- Branch management
- Company-branch relationship
- Geographic master hierarchy
- Country management
- State management
- City management
- Area management
- Financial year management
- Financial year lifecycle
- Sequence generation
- Business document numbering
- Application settings
- Printer configuration
- Barcode configuration
- Configuration validation
- Configuration APIs
- Configuration UI
- Authorization integration
- Audit integration points
- Testing

## Out of Scope

The following are deliberately deferred:

- Party management
- Customer management
- Supplier management
- Employee management
- Medicine master
- Inventory
- Purchase
- Sales
- Financial transactions
- Loyalty
- Full synchronization workflows
- Reporting

Those capabilities are covered in later phases.

---

# 3. ADO Hierarchy

```text
EPIC-002 — Organization, Geography & Configuration
│
├── FEAT-013 — Company Management
├── FEAT-014 — Branch Management
├── FEAT-015 — Geographic Master — Country
├── FEAT-016 — Geographic Master — State
├── FEAT-017 — Geographic Master — City
├── FEAT-018 — Geographic Master — Area
├── FEAT-019 — Geographic Hierarchy & Address Reference
├── FEAT-020 — Financial Year Management
├── FEAT-021 — Sequence Generator
├── FEAT-022 — Application Settings
├── FEAT-023 — Printer Configuration
└── FEAT-024 — Barcode Configuration
```

---

# 4. Epic

## EPIC-002 — Organization, Geography & Configuration

### Description

Provide the core organization and configuration capabilities required for the Pharmacy ERP to operate consistently across companies, branches, financial years, geographic locations, document sequences, application settings, printers, and barcode functionality.

### Technical Context

The database overview identifies Company, Branch, FinancialYear, SequenceGenerator, AppSetting, PrinterConfiguration, and BarcodeConfiguration as configuration tables, while Country, State, City, and Area form the geographic master hierarchy.

### Business Value

These capabilities provide the reference context required by later ERP transactions. Purchase, sales, inventory, party addresses, financial processing, printing, and document numbering should depend on standardized configuration rather than hardcoded values.

### Epic Completion Criteria

- Company configuration is operational.
- Branch configuration is operational.
- Geographic hierarchy is operational.
- Financial year configuration is operational.
- Sequence generation foundation is operational.
- Application settings are manageable.
- Printer configuration is manageable.
- Barcode configuration is manageable.
- APIs and UI are implemented.
- Validation and authorization are implemented.
- Appropriate audit behavior is integrated.
- Tests cover core and negative scenarios.

---

# 5. Feature: Company Management

## FEAT-013 — Company Management

### Objective

Provide the ability to maintain the organization/company context used by the ERP.

### US-025 — Create company

**User Story**

As an authorized administrator, I want to create a company so that the ERP has a defined organization context.

### Acceptance Criteria

1. An authorized user can create a company.
2. Mandatory company information is validated.
3. Duplicate company information is rejected according to defined uniqueness rules.
4. A new company receives the standard system identifiers and audit fields.
5. The company can subsequently be associated with branches.
6. Invalid requests return standardized validation errors.

### Tasks

**TASK-094 — Define Company database model requirements**
- Review required attributes.
- Define relationships.
- Define constraints and indexes.
- Confirm soft-delete and optimistic-locking requirements.

**TASK-095 — Implement Company Prisma model**
- Add model to Prisma schema.
- Add relationships and indexes.
- Verify SQLite compatibility.

**TASK-096 — Create Company migration**
- Generate migration.
- Apply migration locally.
- Verify migration behavior.

**TASK-097 — Implement Company DTOs**
- Create create/update DTOs.
- Add validation rules.

**TASK-098 — Implement Company service**
- Implement creation logic.
- Implement uniqueness validation.
- Implement lifecycle rules.

**TASK-099 — Implement Company controller/API**
- Add create endpoint.
- Add appropriate error handling.

**TASK-100 — Implement Company create UI**
- Create company form.
- Add field validation.
- Add submission/error/loading states.

**TASK-101 — Add Company authorization**
- Restrict company configuration to appropriate administrative permissions.

**TASK-102 — Add Company tests**
- Backend unit tests.
- API tests.
- UI tests.
- Negative validation tests.

---

## US-026 — View and search companies

**User Story**

As an authorized administrator, I want to view and search companies so that I can manage the organization's configured companies.

### Acceptance Criteria

1. Authorized users can view companies.
2. Search/filter behavior is available where required.
3. Deleted companies are excluded from normal views.
4. Pagination is applied where the dataset requires it.

### Tasks

**TASK-103 — Implement Company list API**

**TASK-104 — Implement Company search/filter support**

**TASK-105 — Implement Company list UI**

**TASK-106 — Implement Company pagination/sorting**

**TASK-107 — Add Company list tests**

---

## US-027 — Update and deactivate company

### Acceptance Criteria

1. Authorized users can update permitted company information.
2. Invalid changes are rejected.
3. A company can be deactivated according to business rules.
4. Deactivated companies are not selectable for new transactions where applicable.
5. Existing historical records remain intact.

### Tasks

**TASK-108 — Implement Company update API**

**TASK-109 — Implement Company lifecycle/deactivation logic**

**TASK-110 — Implement Company edit UI**

**TASK-111 — Implement Company status display**

**TASK-112 — Add Company lifecycle tests**

---

# 6. Feature: Branch Management

## FEAT-014 — Branch Management

### US-028 — Create branch

**User Story**

As an authorized administrator, I want to create a branch under a company so that the ERP can manage multiple operational locations.

### Acceptance Criteria

1. A branch belongs to a valid company.
2. Mandatory branch information is validated.
3. Branch uniqueness rules are enforced within the applicable organization scope.
4. A branch can reference geographic master data.
5. An inactive company cannot receive new operational branches unless explicitly allowed.
6. Branch identifiers and audit fields are generated consistently.

### Tasks

**TASK-113 — Define Branch database model requirements**

**TASK-114 — Implement Branch Prisma model**

**TASK-115 — Create Branch migration**

**TASK-116 — Implement Branch DTOs and validation**

**TASK-117 — Implement Branch service**

**TASK-118 — Implement Branch API**

**TASK-119 — Implement Branch create UI**

**TASK-120 — Add company selection/association UI**

**TASK-121 — Add Branch authorization**

**TASK-122 — Add Branch tests**

---

## US-029 — View and search branches

### Acceptance Criteria

1. Authorized users can list branches.
2. Branches can be filtered by company.
3. Branch status is visible.
4. Deleted branches are excluded from normal results.

### Tasks

**TASK-123 — Implement Branch list API**

**TASK-124 — Implement company-based filtering**

**TASK-125 — Implement Branch list UI**

**TASK-126 — Add pagination/sorting**

**TASK-127 — Add Branch list tests**

---

## US-030 — Update and deactivate branch

### Acceptance Criteria

1. Authorized users can update branch information.
2. Branch deactivation is supported.
3. Deactivated branches cannot be selected for new operational transactions where applicable.
4. Historical references remain valid.

### Tasks

**TASK-128 — Implement Branch update API**

**TASK-129 — Implement Branch status/lifecycle logic**

**TASK-130 — Implement Branch edit UI**

**TASK-131 — Add Branch lifecycle tests**

---

# 7. Feature: Geographic Master — Country

## FEAT-015 — Country Management

### US-031 — Manage countries

**User Story**

As an administrator, I want to maintain country master data so that addresses can use standardized geographic references.

### Acceptance Criteria

1. Authorized users can create countries.
2. Country name/code validation is applied.
3. Duplicate country records are prevented according to the defined uniqueness rules.
4. Countries can be viewed and searched.
5. Countries can be deactivated/soft-deleted according to dependency rules.
6. Countries referenced by existing records cannot be physically removed.

### Tasks

**TASK-132 — Define Country model constraints and indexes**

**TASK-133 — Implement Country Prisma model**

**TASK-134 — Create Country migration**

**TASK-135 — Implement Country CRUD APIs**

**TASK-136 — Implement Country validation**

**TASK-137 — Implement Country management UI**

**TASK-138 — Implement Country search/filter**

**TASK-139 — Add Country authorization**

**TASK-140 — Add Country tests**

---

# 8. Feature: Geographic Master — State

## FEAT-016 — State Management

### US-032 — Manage states within countries

**User Story**

As an administrator, I want to maintain states under countries so that the geographic hierarchy remains consistent.

### Acceptance Criteria

1. Every state belongs to one valid country.
2. A state cannot be created without a valid parent country.
3. State uniqueness is enforced within the applicable country.
4. Country filtering is supported.
5. Invalid parent references are rejected.
6. Existing referenced states are protected from unsafe deletion.

### Tasks

**TASK-141 — Define State relationship and constraints**

**TASK-142 — Implement State Prisma model**

**TASK-143 — Create State migration**

**TASK-144 — Implement State CRUD APIs**

**TASK-145 — Implement State validation**

**TASK-146 — Implement dependent-country filtering**

**TASK-147 — Implement State management UI**

**TASK-148 — Add State authorization**

**TASK-149 — Add State tests**

---

# 9. Feature: Geographic Master — City

## FEAT-017 — City Management

### US-033 — Manage cities within states

**User Story**

As an administrator, I want to maintain cities under states so that the geographic hierarchy can be used consistently by addresses and operational processes.

### Acceptance Criteria

1. Every city belongs to one valid state.
2. A city cannot be created without a valid parent state.
3. City uniqueness is enforced within the applicable state.
4. State selection filters available cities appropriately.
5. Invalid parent relationships are rejected.
6. Referenced cities cannot be physically removed unsafely.

### Tasks

**TASK-150 — Define City relationship and constraints**

**TASK-151 — Implement City Prisma model**

**TASK-152 — Create City migration**

**TASK-153 — Implement City CRUD APIs**

**TASK-154 — Implement City validation**

**TASK-155 — Implement dependent-state filtering**

**TASK-156 — Implement City management UI**

**TASK-157 — Add City authorization**

**TASK-158 — Add City tests**

---

# 10. Feature: Geographic Master — Area

## FEAT-018 — Area Management

### US-034 — Manage areas within cities

**User Story**

As an administrator, I want to maintain areas under cities so that the ERP can use the lowest-level geographic reference for addresses and operational processes.

### Acceptance Criteria

1. Every area belongs to one valid city.
2. An area cannot be created without a valid parent city.
3. Area code/name uniqueness follows the defined business scope.
4. City selection is supported.
5. Invalid parent relationships are rejected.
6. Referenced areas cannot be physically removed unsafely.

### Tasks

**TASK-159 — Define Area relationship and constraints**

**TASK-160 — Implement Area Prisma model**

**TASK-161 — Create Area migration**

**TASK-162 — Implement Area CRUD APIs**

**TASK-163 — Implement Area validation**

**TASK-164 — Implement dependent-city filtering**

**TASK-165 — Implement Area management UI**

**TASK-166 — Add Area authorization**

**TASK-167 — Add Area tests**

---

# 11. Feature: Geographic Hierarchy & Address Reference

## FEAT-019 — Geographic Hierarchy & Address Reference

### US-035 — Provide cascading geographic selection

**User Story**

As a user entering an address, I want geographic selections to follow the Country → State → City → Area hierarchy so that invalid combinations cannot be selected.

### Acceptance Criteria

1. Selecting a country limits available states.
2. Selecting a state limits available cities.
3. Selecting a city limits available areas.
4. Clearing a parent selection clears or invalidates dependent selections.
5. The backend validates the complete hierarchy rather than trusting UI selections.
6. Invalid geographic combinations are rejected.

### Tasks

**TASK-168 — Implement hierarchical geographic lookup API**

**TASK-169 — Implement backend hierarchy validation**

**TASK-170 — Implement cascading geographic UI controls**

**TASK-171 — Add geographic lookup caching where appropriate**

**TASK-172 — Add hierarchy validation tests**

### US-036 — Provide reusable geographic lookup services

### Tasks

**TASK-173 — Create shared backend geographic lookup service**

**TASK-174 — Create shared frontend geographic lookup service**

**TASK-175 — Define lookup response conventions**

**TASK-176 — Add lookup service tests**

---

# 12. Feature: Financial Year Management

## FEAT-020 — Financial Year Management

### US-037 — Create financial year

**User Story**

As an authorized administrator, I want to define a financial year so that financial and operational transactions can be associated with the correct period.

### Acceptance Criteria

1. A financial year has a defined start and end.
2. Start date must precede end date.
3. Overlapping financial years are prevented according to business rules.
4. Financial year status is maintained.
5. Financial year information is auditable.

### Tasks

**TASK-177 — Define FinancialYear model rules**

**TASK-178 — Implement FinancialYear Prisma model**

**TASK-179 — Create FinancialYear migration**

**TASK-180 — Implement FinancialYear DTOs and validation**

**TASK-181 — Implement FinancialYear service**

**TASK-182 — Implement FinancialYear API**

**TASK-183 — Implement FinancialYear UI**

**TASK-184 — Add overlap validation**

**TASK-185 — Add FinancialYear tests**

---

## US-038 — Activate and close financial year

### Acceptance Criteria

1. An authorized administrator can activate a financial year.
2. Business rules prevent multiple invalid active periods.
3. Closing a financial year prevents prohibited transactions.
4. Historical records remain accessible.
5. Financial year state transitions are auditable.

### Tasks

**TASK-186 — Define FinancialYear state transitions**

**TASK-187 — Implement activation logic**

**TASK-188 — Implement closing logic**

**TASK-189 — Implement state transition UI**

**TASK-190 — Add financial-period validation service**

**TASK-191 — Add state-transition tests**

---

## US-039 — Resolve current financial year

### Acceptance Criteria

1. The system can determine the applicable financial year for a date.
2. The result is consistent across backend services.
3. Invalid or ambiguous periods are rejected.
4. Later transaction modules can consume the service.

### Tasks

**TASK-192 — Implement current financial-year resolution service**

**TASK-193 — Implement date-to-financial-year lookup**

**TASK-194 — Expose reusable financial-year service**

**TASK-195 — Add resolution tests**

---

# 13. Feature: Sequence Generator

## FEAT-021 — Sequence Generator

### US-040 — Define document numbering sequence

**User Story**

As an administrator, I want to configure document sequences so that ERP transactions receive controlled business document numbers.

### Acceptance Criteria

1. A sequence can be defined for a supported document type.
2. Sequence configuration can include the required numbering parameters.
3. Duplicate sequence definitions are prevented.
4. Sequence status can be managed.
5. Sequence configuration can be associated with the appropriate organization/branch scope where applicable.

### Tasks

**TASK-196 — Define SequenceGenerator model requirements**

**TASK-197 — Implement SequenceGenerator Prisma model**

**TASK-198 — Create SequenceGenerator migration**

**TASK-199 — Implement sequence configuration DTOs**

**TASK-200 — Implement sequence configuration service**

**TASK-201 — Implement sequence configuration API**

**TASK-202 — Implement sequence configuration UI**

**TASK-203 — Add sequence configuration tests**

### US-041 — Generate the next document number safely

### Acceptance Criteria

1. The system can request the next number for a configured sequence.
2. Numbers are generated without unintended duplication.
3. Concurrent requests are handled safely.
4. Failed transactions do not create unacceptable numbering corruption.
5. The sequence behavior is documented for later transaction modules.

### Tasks

**TASK-204 — Implement sequence allocation service**

**TASK-205 — Define transaction/concurrency strategy for sequence allocation**

**TASK-206 — Implement atomic sequence update**

**TASK-207 — Add duplicate/concurrency tests**

**TASK-208 — Document sequence consumption rules**

### US-042 — Integrate sequence generation with transaction modules

This story establishes the integration contract; actual Purchase/Sales document integrations belong to their respective phases.

### Tasks

**TASK-209 — Define sequence-generation API contract**

**TASK-210 — Define document-type registration convention**

**TASK-211 — Document integration pattern for later modules**

---

# 14. Feature: Application Settings

## FEAT-022 — Application Settings

### US-043 — Manage application settings

**User Story**

As an authorized administrator, I want to manage application settings so that configurable system behavior can be changed without modifying source code.

### Acceptance Criteria

1. Authorized users can view supported settings.
2. Authorized users can modify permitted settings.
3. Setting values are validated according to their type.
4. Unsupported setting keys cannot be created through unrestricted input.
5. Sensitive values are protected.
6. Setting changes are auditable where appropriate.

### Tasks

**TASK-212 — Define AppSetting model and configuration rules**

**TASK-213 — Implement AppSetting Prisma model**

**TASK-214 — Create AppSetting migration**

**TASK-215 — Define supported setting catalog**

**TASK-216 — Implement setting validation**

**TASK-217 — Implement settings service**

**TASK-218 — Implement settings API**

**TASK-219 — Implement settings UI**

**TASK-220 — Add settings authorization**

**TASK-221 — Add settings tests**

### US-044 — Provide application settings to runtime components

### Tasks

**TASK-222 — Implement backend configuration lookup**

**TASK-223 — Implement frontend configuration lookup where required**

**TASK-224 — Define configuration caching/refresh behavior**

**TASK-225 — Add runtime configuration tests**

---

# 15. Feature: Printer Configuration

## FEAT-023 — Printer Configuration

### US-045 — Configure printers

**User Story**

As an authorized administrator, I want to configure printers so that the ERP can use the correct printer for supported output operations.

### Acceptance Criteria

1. Printer configuration can be created.
2. Printer details are validated.
3. Printer configuration can be associated with the applicable company/branch/context where required.
4. A default printer can be identified according to business rules.
5. Inactive printers cannot be selected for new print operations.
6. Configuration changes are auditable where appropriate.

### Tasks

**TASK-226 — Define PrinterConfiguration model requirements**

**TASK-227 — Implement PrinterConfiguration Prisma model**

**TASK-228 — Create PrinterConfiguration migration**

**TASK-229 — Implement printer configuration DTOs**

**TASK-230 — Implement printer configuration service**

**TASK-231 — Implement printer configuration API**

**TASK-232 — Implement printer configuration UI**

**TASK-233 — Implement default-printer rules**

**TASK-234 — Add printer configuration tests**

### US-046 — Validate printer availability/configuration

### Tasks

**TASK-235 — Define printer validation contract**

**TASK-236 — Implement printer availability/configuration check where supported**

**TASK-237 — Implement printer test/diagnostic action**

**TASK-238 — Add printer diagnostic tests**

---

# 16. Feature: Barcode Configuration

## FEAT-024 — Barcode Configuration

### US-047 — Configure barcode behavior

**User Story**

As an authorized administrator, I want to configure barcode behavior so that barcode-based workflows can use consistent system settings.

### Acceptance Criteria

1. Barcode configuration can be created and updated.
2. Supported configuration values are validated.
3. Configuration can be scoped appropriately.
4. Invalid barcode configuration is rejected.
5. Barcode configuration can be consumed by later inventory/sales functionality.

### Tasks

**TASK-239 — Define BarcodeConfiguration model requirements**

**TASK-240 — Implement BarcodeConfiguration Prisma model**

**TASK-241 — Create BarcodeConfiguration migration**

**TASK-242 — Define supported barcode configuration options**

**TASK-243 — Implement barcode configuration validation**

**TASK-244 — Implement barcode configuration service**

**TASK-245 — Implement barcode configuration API**

**TASK-246 — Implement barcode configuration UI**

**TASK-247 — Add barcode configuration tests**

### US-048 — Provide reusable barcode configuration to transaction modules

### Tasks

**TASK-248 — Define barcode configuration lookup contract**

**TASK-249 — Implement reusable barcode configuration service**

**TASK-250 — Document integration with later inventory/sales modules**

---

# 17. Cross-Cutting Authorization

Every administrative configuration capability introduced in this phase must use the security framework from Phase 1 and later be connected to the full User/Role/Permission implementation in Phase 4.

### Tasks

**TASK-251 — Define configuration permission categories**

**TASK-252 — Define company/branch administration permissions**

**TASK-253 — Define geographic-master administration permissions**

**TASK-254 — Define financial-year administration permissions**

**TASK-255 — Define sequence administration permissions**

**TASK-256 — Define application-settings permissions**

**TASK-257 — Define printer/barcode configuration permissions**

**TASK-258 — Verify UI/API permission boundaries**

---

# 18. Cross-Cutting Audit Integration

The complete AuditLog/ChangeHistory implementation is covered later. This phase should nevertheless identify auditable configuration changes.

### Tasks

**TASK-259 — Define configuration audit events**

**TASK-260 — Define company/branch audit events**

**TASK-261 — Define geographic-master audit events**

**TASK-262 — Define financial-year state-change audit events**

**TASK-263 — Define sequence configuration audit events**

**TASK-264 — Define application-settings audit events**

**TASK-265 — Define printer/barcode configuration audit events**

---

# 19. Database Standards

All Phase 2 models should follow the established database architecture.

### Requirements

- Singular table names.
- BIGINT primary keys.
- UUID external references where applicable.
- `createdAt` and `updatedAt`.
- `deletedAt` for applicable soft-deletable records.
- `version` for optimistic locking where applicable.
- Explicit foreign-key relationships.
- Appropriate unique constraints.
- Appropriate indexes.
- SQLite compatibility.
- PostgreSQL compatibility.
- Prisma migration support.

### Tasks

**TASK-266 — Review Phase 2 schema for naming consistency**

**TASK-267 — Review Phase 2 indexes and unique constraints**

**TASK-268 — Review Phase 2 foreign-key relationships**

**TASK-269 — Validate SQLite compatibility**

**TASK-270 — Validate PostgreSQL compatibility**

---

# 20. UI Standards

All configuration screens should follow the common UI foundation established in Phase 1.

### Standard screen capabilities

Where applicable:

- List
- Search
- Filter
- Sort
- Pagination
- Create
- Edit
- View
- Activate/deactivate
- Validation
- Loading state
- Empty state
- Error state
- Confirmation
- Permission-based visibility

### Tasks

**TASK-271 — Define common configuration list-page pattern**

**TASK-272 — Define common configuration form pattern**

**TASK-273 — Define hierarchical geographic selection component**

**TASK-274 — Define configuration status display pattern**

---

# 21. Testing Strategy

Phase 2 should include testing at multiple levels.

## Backend

- Service unit tests
- Controller/API tests
- Validation tests
- Relationship tests
- Authorization tests
- Concurrency tests for sequence generation
- Financial-year overlap/state tests

## UI

- Form validation tests
- List/search tests
- Cascading geographic selection tests
- Permission visibility tests
- Loading/error state tests

## Integration

- Database migration tests
- SQLite integration tests
- PostgreSQL compatibility validation
- API-to-database integration

## Negative Scenarios

At minimum:

- Duplicate company
- Duplicate branch
- Invalid company/branch relationship
- Invalid geographic hierarchy
- Invalid financial-year range
- Overlapping financial year
- Invalid sequence configuration
- Concurrent sequence requests
- Invalid application setting
- Unauthorized configuration change
- Invalid printer configuration
- Invalid barcode configuration

### Tasks

**TASK-275 — Implement Phase 2 backend unit-test suite**

**TASK-276 — Implement Phase 2 API integration-test suite**

**TASK-277 — Implement Phase 2 frontend test suite**

**TASK-278 — Implement Phase 2 authorization tests**

**TASK-279 — Implement Phase 2 negative test suite**

**TASK-280 — Implement Phase 2 database compatibility tests**

---

# 22. Phase 2 Dependencies

Phase 2 depends on:

```text
Phase 1
Foundation & Architecture
```

Specifically:

- Prisma foundation
- Database migration framework
- NestJS foundation
- Angular/Electron foundation
- Validation
- API standards
- Error handling
- Common UI infrastructure
- Logging
- Testing foundation
- CI/CD foundation

Later dependencies:

```text
Phase 2
   ↓
Phase 3 — Party Management
   ↓
Phase 5 — Medicine Master
   ↓
Phase 6 — Inventory
   ↓
Phase 7 — Procurement
   ↓
Phase 8 — Sales
   ↓
Phase 9 — Financial
```

---

# 23. Phase 2 Business Dependency Flow

```text
Country
   ↓
State
   ↓
City
   ↓
Area
```

Organization:

```text
Company
   ↓
Branch
```

Financial context:

```text
Company / Branch
       ↓
Financial Year
       ↓
Transaction Processing
```

Numbering:

```text
Sequence Generator
       ↓
Business Document
       ↓
Purchase / Sales / Other Transaction
```

Configuration:

```text
AppSetting
PrinterConfiguration
BarcodeConfiguration
       ↓
Application / Transaction Modules
```

---

# 24. Phase 2 Completion Checklist

- [ ] Company master implemented.
- [ ] Company create/view/edit/lifecycle flows implemented.
- [ ] Branch master implemented.
- [ ] Branch create/view/edit/lifecycle flows implemented.
- [ ] Country master implemented.
- [ ] State master implemented.
- [ ] City master implemented.
- [ ] Area master implemented.
- [ ] Country → State → City → Area hierarchy validated.
- [ ] Reusable geographic lookup capability implemented.
- [ ] Financial year master implemented.
- [ ] Financial-year activation/closure implemented.
- [ ] Current financial-year resolution implemented.
- [ ] Sequence configuration implemented.
- [ ] Safe sequence allocation implemented.
- [ ] Application settings implemented.
- [ ] Runtime settings lookup implemented.
- [ ] Printer configuration implemented.
- [ ] Printer validation/diagnostics implemented where supported.
- [ ] Barcode configuration implemented.
- [ ] Reusable barcode configuration lookup implemented.
- [ ] Configuration authorization defined.
- [ ] Configuration audit events defined.
- [ ] Database constraints/indexes reviewed.
- [ ] SQLite compatibility verified.
- [ ] PostgreSQL compatibility verified.
- [ ] Backend tests completed.
- [ ] Frontend tests completed.
- [ ] Integration tests completed.
- [ ] Negative scenarios tested.
- [ ] CI pipeline passes.
- [ ] Documentation updated.

---

# 25. Phase 2 Work Item Summary

| Type | Count |
|---|---:|
| Epic | 1 |
| Features | 12 |
| User Stories | 24 |
| Tasks | 187 |
| Total Work Items | 224 |

> Task count is intentionally detailed because this backlog is intended to separate database, backend, UI, security, audit, and testing responsibilities. During actual sprint planning, small implementation tasks can be merged if your team prefers larger tasks.

---

# 26. Phase Boundary

Phase 2 establishes the organizational and configuration context.

It does not implement downstream business transactions.

For example:

```text
Phase 2:
Branch → configured

Phase 3:
Party → uses Branch/Geography

Phase 5:
Medicine → uses configuration/master data

Phase 6:
Inventory → uses Branch, Medicine, UOM, configuration

Phase 7:
Purchase → uses Supplier, Medicine, Branch, FinancialYear, Sequence

Phase 8:
Sales → uses Customer, Medicine, Branch, FinancialYear, Sequence

Phase 9:
Financial → uses FinancialYear and transaction context
```

This boundary keeps the ADO backlog dependency-driven rather than mixing unrelated business functionality into the configuration phase.
