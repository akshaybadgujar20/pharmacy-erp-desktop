# Phase 1 — Foundation & Architecture

## 1. Objective

Establish the technical foundation required to build the Pharmacy ERP consistently across the Angular/Electron UI, NestJS local backend, Prisma ORM, SQLite development database, and PostgreSQL production database.

This phase is about platform capabilities and engineering standards, not business-domain CRUD functionality.

## 2. Scope

### In Scope

- Repository and application foundation
- NestJS foundation
- Angular/Electron foundation
- Prisma foundation
- SQLite configuration
- PostgreSQL compatibility foundation
- Environment/configuration management
- Database migration strategy
- Common API conventions
- Error handling
- Validation
- Exception handling
- Logging
- UUID and BIGINT handling
- Soft-delete framework
- Optimistic locking framework
- Transaction handling
- Common UI foundation
- API client foundation
- Global loading/error handling
- Development tooling
- Code quality
- CI/CD foundation

### Out of Scope

- Party business functionality
- Medicine business functionality
- Inventory business functionality
- Purchase/sales workflows
- Financial workflows
- Loyalty
- Business reporting
- Detailed offline synchronization workflows
- Domain-specific audit functionality

Those are covered in later phases.

---

# 3. ADO Hierarchy

```text
EPIC-001 — Foundation & Architecture
│
├── FEAT-001 — Repository & Application Foundation
├── FEAT-002 — NestJS Backend Foundation
├── FEAT-003 — Angular/Electron Frontend Foundation
├── FEAT-004 — Prisma & Database Foundation
├── FEAT-005 — Configuration & Environment Management
├── FEAT-006 — API Standards & Error Handling
├── FEAT-007 — Validation & Data Integrity Foundation
├── FEAT-008 — Common Persistence Capabilities
├── FEAT-009 — Common UI Infrastructure
├── FEAT-010 — Logging & Diagnostics Foundation
├── FEAT-011 — Development Standards & Code Quality
└── FEAT-012 — CI/CD Foundation
```

---

# 4. Epic

## EPIC-001 — Foundation & Architecture

### Description

Establish the shared technical foundation required for all Pharmacy ERP modules.

### Business / Technical Value

The Pharmacy ERP contains multiple business domains and must operate with SQLite during local development and PostgreSQL in production. A standardized foundation prevents each module from implementing its own persistence, validation, error handling, configuration, UI, logging, and deployment patterns.

### Epic Completion Criteria

- Application starts successfully in the supported development environment.
- Angular/Electron and NestJS foundations are operational.
- Prisma is configured.
- SQLite development database is operational.
- PostgreSQL compatibility approach is established.
- Database migrations are operational.
- Common API/error/validation conventions are established.
- Common persistence conventions are established.
- Common UI infrastructure is available.
- Logging and diagnostics are available.
- Code-quality checks are established.
- CI/CD foundation is operational.

---

# 5. Features and User Stories

## FEAT-001 — Repository & Application Foundation

### US-001 — Establish Pharmacy ERP project structure

**User Story**

As a development team, we want a standardized project structure so that all ERP components follow a consistent organization.

**Scope**

- Repository structure
- Application boundaries
- Documentation location
- Source code conventions
- Configuration locations
- Database/schema locations
- Test locations

**Acceptance Criteria**

1. Project structure is documented.
2. Application responsibilities are clearly separated.
3. Source, test, configuration, database, and documentation locations are defined.
4. New developers can understand where each type of artifact belongs.

### Tasks

**TASK-001 — Define repository structure**
- Document application and module boundaries.
- Define locations for frontend, backend, database, tests, scripts, and documentation.

**TASK-002 — Establish source-code organization standards**
- Define module/folder conventions.
- Define naming conventions.
- Document expected structure for new modules.

**TASK-003 — Establish documentation structure**
- Create documentation structure.
- Define database documentation location.
- Define ADO planning/backlog documentation location.

**TASK-004 — Establish development setup documentation**
- Document prerequisites.
- Document installation.
- Document startup commands.
- Document local development workflow.

---

## FEAT-002 — NestJS Backend Foundation

### US-002 — Establish NestJS backend application foundation

**User Story**

As a development team, we want a standardized NestJS backend foundation so that all ERP backend modules follow consistent implementation patterns.

**Acceptance Criteria**

1. NestJS application starts successfully.
2. Module organization standard is established.
3. Dependency injection conventions are established.
4. Controller/service/module patterns are documented.
5. Backend configuration can be loaded consistently.

### Tasks

**TASK-005 — Configure NestJS application**
- Configure application bootstrap.
- Configure global application behavior.
- Establish module loading conventions.

**TASK-006 — Define NestJS module structure**
- Establish feature-module conventions.
- Define controller/service/data-access responsibilities.

**TASK-007 — Establish backend coding conventions**
- Define naming conventions.
- Define DTO conventions.
- Define service conventions.
- Define exception conventions.

**TASK-008 — Create backend health endpoint**
- Implement application health/basic availability endpoint.
- Verify successful startup and response.

---

## FEAT-003 — Angular/Electron Frontend Foundation

### US-003 — Establish frontend application foundation

**User Story**

As a development team, we want a standardized Angular/Electron foundation so that ERP screens have a consistent structure and behavior.

**Acceptance Criteria**

1. Angular application starts successfully.
2. Electron integration foundation is operational where applicable.
3. Routing foundation is established.
4. Shared UI infrastructure can be consumed by feature modules.
5. Frontend configuration is environment-aware.

### Tasks

**TASK-009 — Configure Angular application foundation**
- Establish application bootstrap.
- Establish routing.
- Establish shared/core application structure.

**TASK-010 — Establish Electron integration foundation**
- Define communication boundary between Angular UI and local backend.
- Establish required Electron configuration.

**TASK-011 — Establish shared UI structure**
- Define common components/services location.
- Define reusable UI conventions.

**TASK-012 — Establish frontend coding conventions**
- Define component/service naming.
- Define state and observable/signal conventions.
- Define error/loading handling conventions.

---

## FEAT-004 — Prisma & Database Foundation

The database architecture explicitly uses Prisma ORM, SQLite for development, and PostgreSQL for production. The database overview also specifies BIGINT primary keys, UUID external references, `createdAt`/`updatedAt`, soft delete using `deletedAt`, and a `version` column for optimistic locking. 

### US-004 — Establish Prisma database foundation

**User Story**

As a development team, we want Prisma configured consistently so that the ERP database schema can evolve through controlled migrations.

**Acceptance Criteria**

1. Prisma is configured.
2. Schema location is standardized.
3. Migration workflow is documented.
4. Development database can be initialized.
5. Prisma client can be generated successfully.

### Tasks

**TASK-013 — Configure Prisma**
- Configure Prisma schema.
- Configure Prisma client generation.
- Establish database access conventions.

**TASK-014 — Establish Prisma schema organization**
- Define model naming conventions.
- Define relation conventions.
- Define index/constraint conventions.

**TASK-015 — Establish Prisma migration workflow**
- Define migration creation process.
- Define migration application process.
- Define local reset/development workflow.

### US-005 — Establish SQLite development database

**Acceptance Criteria**

1. SQLite database can be created locally.
2. Prisma can connect successfully.
3. Migrations can be applied.
4. Application can execute basic database operations.

### Tasks

**TASK-016 — Configure SQLite development database**

**TASK-017 — Validate Prisma-to-SQLite connectivity**

**TASK-018 — Document SQLite database lifecycle**

### US-006 — Establish PostgreSQL production compatibility

**Acceptance Criteria**

1. PostgreSQL is identified as the production database.
2. Schema decisions are reviewed for SQLite/PostgreSQL compatibility.
3. Migration strategy is documented.
4. Database-specific features are explicitly identified before use.

### Tasks

**TASK-019 — Define SQLite/PostgreSQL compatibility guidelines**

**TASK-020 — Review Prisma data types for cross-database compatibility**

**TASK-021 — Define PostgreSQL production configuration**

**TASK-022 — Establish database compatibility verification process**

---

## FEAT-005 — Configuration & Environment Management

### US-007 — Establish environment configuration

**User Story**

As a development team, we want centralized configuration so that environment-specific values are not hardcoded.

**Acceptance Criteria**

1. Development and production configuration can be separated.
2. Secrets are not stored in source code.
3. Configuration values can be validated at startup.
4. Backend and frontend configuration conventions are documented.

### Tasks

**TASK-023 — Establish backend environment configuration**

**TASK-024 — Establish frontend environment configuration**

**TASK-025 — Define configuration validation**

**TASK-026 — Define secret-management standards**

**TASK-027 — Document environment configuration**

---

## FEAT-006 — API Standards & Error Handling

### US-008 — Establish common API standards

**Acceptance Criteria**

1. API naming conventions are documented.
2. HTTP method conventions are documented.
3. Request/response conventions are documented.
4. Pagination conventions are documented.
5. Error response structure is standardized.

### Tasks

**TASK-028 — Define REST API conventions**

**TASK-029 — Define request/response DTO conventions**

**TASK-030 — Define pagination and filtering conventions**

**TASK-031 — Define API error response structure**

### US-009 — Establish centralized backend error handling

**Acceptance Criteria**

1. Unexpected exceptions are handled consistently.
2. Validation errors use the common format.
3. Business errors can be represented consistently.
4. Internal implementation details are not unnecessarily exposed to clients.

### Tasks

**TASK-032 — Implement global exception handling**

**TASK-033 — Implement standardized error responses**

**TASK-034 — Define business exception conventions**

**TASK-035 — Add error logging integration**

---

## FEAT-007 — Validation & Data Integrity Foundation

### US-010 — Establish backend request validation

**Acceptance Criteria**

1. DTO validation is standardized.
2. Required fields can be enforced.
3. Invalid data is rejected before business processing.
4. Validation errors are returned using the standard API format.

### Tasks

**TASK-036 — Configure global validation pipeline**

**TASK-037 — Establish DTO validation conventions**

**TASK-038 — Establish validation error response conventions**

### US-011 — Establish database integrity conventions

### Tasks

**TASK-039 — Define primary-key conventions**

**TASK-040 — Define UUID external-reference conventions**

**TASK-041 — Define unique-constraint conventions**

**TASK-042 — Define foreign-key and relationship conventions**

**TASK-043 — Define index conventions**

---

## FEAT-008 — Common Persistence Capabilities

The database overview defines soft delete using `deletedAt`, standard timestamps, and a `version` column for optimistic locking. These should be implemented as reusable persistence patterns rather than recreated independently for every module. 

### US-012 — Establish soft-delete framework

**Acceptance Criteria**

1. Soft-deletable records can be marked deleted.
2. Normal queries can exclude deleted records.
3. Explicit administrative/history queries can access deleted records where required.
4. Hard deletion is restricted to explicitly approved cases.

### Tasks

**TASK-044 — Define soft-delete persistence convention**

**TASK-045 — Define default filtering behavior**

**TASK-046 — Define restore behavior**

**TASK-047 — Document hard-delete restrictions**

### US-013 — Establish optimistic locking

**Acceptance Criteria**

1. Concurrent updates can be detected.
2. Version information is maintained.
3. Stale updates are rejected safely.
4. A standard concurrency error is returned.

### Tasks

**TASK-048 — Define version-column convention**

**TASK-049 — Implement optimistic-locking pattern**

**TASK-050 — Define stale-update error handling**

**TASK-051 — Document optimistic-locking usage**

### US-014 — Establish transaction handling standards

**Acceptance Criteria**

1. Multi-step business operations can execute transactionally.
2. Failure causes appropriate rollback.
3. Transaction boundaries are documented.
4. Developers have a standard transaction pattern.

### Tasks

**TASK-052 — Define transaction boundary guidelines**

**TASK-053 — Establish Prisma transaction pattern**

**TASK-054 — Document transaction usage**

---

## FEAT-009 — Common UI Infrastructure

### US-015 — Establish common application layout

**Acceptance Criteria**

1. Application shell is available.
2. Navigation structure is established.
3. Feature modules can register navigation.
4. Layout is reusable.

### Tasks

**TASK-055 — Implement application shell**

**TASK-056 — Implement navigation foundation**

**TASK-057 — Define reusable layout components**

### US-016 — Establish common UI states

**Acceptance Criteria**

1. Loading state is standardized.
2. Error state is standardized.
3. Empty state is standardized.
4. Confirmation behavior is standardized.

### Tasks

**TASK-058 — Implement global loading handling**

**TASK-059 — Implement common error display**

**TASK-060 — Implement common empty-state component**

**TASK-061 — Implement confirmation dialog convention**

### US-017 — Establish common API client

### Tasks

**TASK-062 — Implement HTTP/API client foundation**

**TASK-063 — Establish request error handling**

**TASK-064 — Establish API request loading handling**

**TASK-065 — Establish API response conventions**

---

## FEAT-010 — Logging & Diagnostics Foundation

### US-018 — Establish application logging

**Acceptance Criteria**

1. Backend application events can be logged.
2. Log levels are standardized.
3. Errors include useful diagnostic context.
4. Sensitive information is not unnecessarily logged.

### Tasks

**TASK-066 — Establish backend logging framework**

**TASK-067 — Define log levels and conventions**

**TASK-068 — Define structured logging format**

**TASK-069 — Define sensitive-data logging restrictions**

### US-019 — Establish diagnostic support

### Tasks

**TASK-070 — Define application diagnostic information**

**TASK-071 — Establish development troubleshooting guidelines**

**TASK-072 — Document common startup/database troubleshooting**

---

## FEAT-011 — Development Standards & Code Quality

### US-020 — Establish code-quality standards

**Acceptance Criteria**

1. Formatting standards are automated.
2. Linting is automated.
3. Static analysis can run locally.
4. Team coding conventions are documented.

### Tasks

**TASK-073 — Configure frontend linting/formatting**

**TASK-074 — Configure backend linting/formatting**

**TASK-075 — Establish shared coding standards**

**TASK-076 — Document code-quality standards**

### US-021 — Establish automated testing foundation

**Acceptance Criteria**

1. Backend tests can execute.
2. Frontend tests can execute.
3. Test organization is standardized.
4. Test execution can be integrated into CI.

### Tasks

**TASK-077 — Configure backend unit-test foundation**

**TASK-078 — Configure frontend unit-test foundation**

**TASK-079 — Establish test naming and organization conventions**

**TASK-080 — Establish test execution commands**

---

## FEAT-012 — CI/CD Foundation

### US-022 — Establish CI pipeline

**Acceptance Criteria**

1. Source changes trigger CI.
2. Dependencies can be installed.
3. Application can be built.
4. Tests can execute.
5. Code-quality checks can execute.
6. Pipeline failures prevent successful validation.

### Tasks

**TASK-081 — Create CI pipeline**

**TASK-082 — Configure dependency installation**

**TASK-083 — Configure backend build**

**TASK-084 — Configure frontend build**

**TASK-085 — Configure automated tests**

**TASK-086 — Configure lint/static analysis**

### US-023 — Establish database migration validation in CI

### Tasks

**TASK-087 — Validate Prisma schema in CI**

**TASK-088 — Validate migration workflow in CI**

**TASK-089 — Add database compatibility validation where practical**

### US-024 — Establish build/release foundation

### Tasks

**TASK-090 — Define application build artifacts**

**TASK-091 — Define versioning strategy**

**TASK-092 — Define release configuration strategy**

**TASK-093 — Document deployment prerequisites**

---

# 6. Phase-Level Cross-Cutting Requirements

The following should be considered while implementing every Phase 1 item.

## Database

- Prisma remains the ORM.
- SQLite remains the development target.
- PostgreSQL remains the production target.
- BIGINT primary-key strategy is retained.
- UUID external-reference strategy is retained.
- `createdAt` / `updatedAt` conventions are retained.
- `deletedAt` is used for soft delete where applicable.
- `version` is used for optimistic locking where applicable.

## Backend

- NestJS module boundaries must remain clear.
- Controllers should remain thin.
- Business logic should be contained in services/domain logic.
- DTO validation should happen at the API boundary.
- Errors should use standardized responses.
- Transactions should be explicit around multi-step operations.

## UI

- Angular feature structure should be reusable.
- Common UI states should not be implemented independently by every feature.
- API communication should use the common API client.
- Loading/error handling should follow shared conventions.

## Testing

Foundation capabilities should have tests before being used heavily by later modules.

## Documentation

Every architectural convention introduced in this phase should be documented so later ADO phases can reference it instead of redefining it.

---

# 7. Dependencies

Phase 1 should be completed before substantial implementation of:

```text
Phase 2 — Organization & Configuration
Phase 3 — Party Management
Phase 4 — User & Security
Phase 5 — Medicine Master
Phase 6 — Inventory
Phase 7 — Procurement
Phase 8 — Sales & Prescription
Phase 9 — Financial
Phase 10 — Loyalty/Audit/Reporting
Phase 11 — Synchronization
```

Some Phase 1 items can be developed in parallel, but the core database, backend, frontend, API, configuration, validation, and testing foundations should exist before domain development begins.

---

# 8. Phase 1 Suggested ADO Priority

| Area | Priority |
|---|---|
| Repository/application foundation | P0 |
| NestJS foundation | P0 |
| Angular/Electron foundation | P0 |
| Prisma foundation | P0 |
| SQLite foundation | P0 |
| PostgreSQL compatibility | P0 |
| Configuration | P0 |
| API standards | P0 |
| Validation | P0 |
| Persistence conventions | P0 |
| UI infrastructure | P0 |
| Logging | P0 |
| Code quality | P0 |
| Testing foundation | P0 |
| CI/CD foundation | P0 |

---

# 9. Phase 1 Definition of Done

Phase 1 is complete when:

- [ ] Repository structure is established.
- [ ] NestJS backend foundation is operational.
- [ ] Angular/Electron foundation is operational.
- [ ] Prisma is operational.
- [ ] SQLite development database is operational.
- [ ] PostgreSQL production compatibility approach is documented.
- [ ] Migration workflow is established.
- [ ] Environment configuration is established.
- [ ] API conventions are documented.
- [ ] Global validation is established.
- [ ] Global error handling is established.
- [ ] Soft-delete convention is established.
- [ ] Optimistic-locking convention is established.
- [ ] Transaction convention is established.
- [ ] Common UI infrastructure is established.
- [ ] Common API client is established.
- [ ] Logging foundation is established.
- [ ] Testing foundation is established.
- [ ] Code-quality checks are established.
- [ ] CI pipeline is operational.
- [ ] Phase 1 documentation is committed to the repository.

---

# 10. Important Boundary for Later Phases

Phase 1 establishes reusable technical mechanisms.

It should NOT create domain-specific implementations such as:

- Customer CRUD
- Supplier CRUD
- Medicine CRUD
- Inventory CRUD
- Purchase Order CRUD
- Sales Invoice CRUD
- Prescription CRUD
- Financial transactions

Those belong to their respective later phases.

This prevents the foundation phase from becoming an unmanageable mixture of platform and business functionality.

---

# 11. Phase 1 Work Item Summary

| Type | Count |
|---|---:|
| Epic | 1 |
| Features | 12 |
| User Stories | 24 |
| Tasks | 93 |

The counts are intended as a planning baseline. During ADO entry, some small tasks may be merged or split depending on your team's sprint size and ownership.
