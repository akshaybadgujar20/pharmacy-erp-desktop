# Pharmacy ERP — Azure DevOps Backlog Creation Standard

## 1. Purpose

This document is the standard/template for decomposing the Pharmacy ERP into Azure DevOps (ADO) work items.

The objective is to create a backlog that is:

- Business-capability driven rather than table driven.
- Detailed enough for implementation by separate UI, backend, database, QA, and infrastructure work.
- Traceable from Epic → Feature → User Story → Task.
- Ordered according to dependencies and business workflows.
- Suitable for incremental/vertical-slice development.
- Consistent across the entire Pharmacy ERP.

The database architecture is the foundation, but database tables must **not** automatically become ADO Features or User Stories.

---

# 2. Source of Truth

The Pharmacy ERP database overview defines the following key principles:

- Normalize common information.
- Avoid duplicate data.
- Use Party as the master entity.
- Support multiple roles for a single party.
- Support offline-first synchronization.
- Keep SQLite and PostgreSQL schemas compatible.
- Maintain complete audit history.
- Use soft delete wherever applicable.

The high-level database modules include:

1. Party Management
2. User & Security
3. Medicine Master
4. Inventory
5. Purchase
6. Sales
7. Financial
8. Pricing
9. Loyalty
10. Prescription
11. Synchronization
12. Audit
13. Configuration
14. Lookup / Masters

Target databases:

- Development: SQLite
- Production: PostgreSQL
- ORM: Prisma

Reference: Pharmacy ERP Database Overview.

---

# 3. Core ADO Hierarchy

Use this hierarchy consistently:

```text
Epic
 └── Feature
      └── User Story
           └── Task
```

## Epic

Represents a major business/product capability.

Examples:

- Party Management
- Medicine Master
- Inventory Management
- Procurement
- Sales & Billing

Do not use individual database tables as Epics.

---

## Feature

Represents a meaningful functional capability within an Epic.

Example:

```text
Epic: Party Management

Feature:
    Supplier Management
```

A Feature should describe a business capability, not merely a technical implementation detail.

---

## User Story

Represents a specific business/user capability.

Preferred format:

> As a [user/persona], I want to [perform an action] so that [business outcome].

Example:

> As a pharmacy administrator, I want to register and maintain suppliers so that suppliers can be used in procurement transactions.

A User Story should normally represent a vertical business slice rather than only a database, backend, or UI activity.

---

## Task

Tasks describe the engineering work required to complete the User Story.

Typical task categories:

- Database
- Backend
- UI
- Security
- Audit
- Synchronization
- Testing
- Documentation
- DevOps / Infrastructure

---

# 4. Business-First, Not Table-First

Do not create a backlog like:

```text
Feature: Supplier Table

User Story: Create Supplier Table
User Story: Update Supplier Table
User Story: Delete Supplier Table
```

Prefer:

```text
Epic: Party Management

Feature: Supplier Management

User Story: Register a supplier
User Story: View supplier details
User Story: Search and filter suppliers
User Story: Update supplier information
User Story: Manage supplier contacts
User Story: Manage supplier addresses
User Story: Activate/deactivate supplier
User Story: Prevent duplicate supplier registration
User Story: View supplier transaction history
```

The database tables support these capabilities; they do not define the business backlog by themselves.

---

# 5. Recommended Epic Structure

Use the following as the initial decomposition. Refine names if later business analysis requires it.

```text
EPIC 01 — Foundation & Platform
EPIC 02 — Organization & Configuration
EPIC 03 — Geographic & Common Masters
EPIC 04 — Party Management
EPIC 05 — User, Role & Security
EPIC 06 — Medicine Master
EPIC 07 — Inventory Management
EPIC 08 — Procurement / Purchase
EPIC 09 — Sales & Billing
EPIC 10 — Prescription Management
EPIC 11 — Pricing, Tax & Discount
EPIC 12 — Payments & Financial Management
EPIC 13 — Customer Loyalty
EPIC 14 — Audit & Change History
EPIC 15 — Offline & Synchronization
EPIC 16 — Reporting & Dashboard
EPIC 17 — Notifications / Printing / Barcode
EPIC 18 — Administration & Operational Tools
EPIC 19 — Quality, Testing & Performance
EPIC 20 — Production Readiness / Deployment
```

Not every Epic must contain exactly the same number of Features.

---

# 6. Example Feature Decomposition

## Party Management

Potential Features:

```text
Party Master
Customer Management
Supplier Management
Doctor Management
Employee Management
Party Roles
Party Addresses
Party Contacts
Party Search
Duplicate / Merge Handling
Party Lifecycle Management
```

## Medicine Master

Potential Features:

```text
Medicine Master
Generic / Salt Management
Medicine Category
Medicine Schedule
Manufacturer Management
Unit of Measure
Medicine Search
Medicine Status / Lifecycle
Medicine Composition
```

## Inventory

Potential Features:

```text
Batch Management
Stock Management
Stock Movement
Stock Adjustment
Stock Transfer
Stock Take
Stock Reconciliation
Expiry Management
Low Stock Management
Inventory Search
```

## Procurement

Potential Features:

```text
Supplier Purchase Orders
Purchase Order Items
Goods Receipt
Purchase Invoice
Purchase Returns
Purchase Workflow
Purchase History
```

## Sales

Potential Features:

```text
Sales Invoice
Sales Invoice Items
Sales Return
Sales Payment
Customer Billing
Billing Workflow
Invoice History
```

---

# 7. User Story Design Standard

Each User Story should contain:

```text
Title
Description
Persona
Business Goal
Business Rules
Dependencies
Acceptance Criteria
Priority
Scope
Out of Scope
Technical Notes
```

## User Story Template

```text
Title:
<Short business-oriented title>

As a:
<Persona>

I want:
<Capability>

So that:
<Business outcome>

Description:
<Detailed explanation>

Business Rules:
- Rule 1
- Rule 2
- Rule 3

Dependencies:
- Dependency 1
- Dependency 2

Out of Scope:
- Item 1
- Item 2

Acceptance Criteria:
- Given ...
  When ...
  Then ...

Priority:
P0 / P1 / P2 / P3
```

---

# 8. Acceptance Criteria Standard

Acceptance criteria should describe observable behavior.

Prefer Given / When / Then.

Example:

```text
Given the user has supplier-management permission
When the user enters valid supplier information
And submits the form
Then the supplier should be created successfully.

Given a supplier already exists with the same unique business identifier
When the user attempts to create another supplier
Then the system should reject the duplicate.

Given mandatory information is missing
When the user submits the form
Then validation errors should be displayed.

Given the supplier is inactive
When the user attempts to use the supplier in a new transaction
Then the system should prevent the supplier from being selected.
```

Acceptance criteria should cover:

- Happy path
- Validation
- Duplicate handling
- Authorization
- Invalid state
- Error handling
- Business constraints
- Relevant audit behavior
- Relevant synchronization behavior
- Relevant concurrency behavior

---

# 9. Engineering Task Breakdown

For a meaningful User Story, use a standard engineering breakdown.

## 9.1 Database Tasks

Typical tasks:

```text
- Analyze database requirements.
- Update Prisma schema.
- Add required entities.
- Define relationships.
- Define primary keys.
- Define foreign keys.
- Define unique constraints.
- Define indexes.
- Add soft-delete support where applicable.
- Add createdAt / updatedAt fields.
- Add version field where optimistic locking applies.
- Add UUID external references where required.
- Create migration.
- Validate migration.
- Verify SQLite compatibility.
- Verify PostgreSQL compatibility.
- Verify referential integrity.
- Verify seed/master-data requirements.
```

Do not create all of these tasks mechanically. Only create tasks relevant to the story.

---

# 10. Backend Task Standard

For NestJS/local backend functionality:

```text
- Create NestJS module.
- Define DTOs.
- Add request validation.
- Implement service layer.
- Implement repository/data access.
- Implement controller.
- Implement CRUD/business APIs as required.
- Implement search/filter APIs.
- Implement pagination.
- Implement sorting.
- Implement transaction handling.
- Implement business-rule validation.
- Implement error handling.
- Implement authorization.
- Implement audit integration.
- Implement synchronization/outbox integration where applicable.
- Add API documentation.
```

Do not create CRUD endpoints when the business capability does not require them.

---

# 11. UI Task Standard

For Angular/Electron UI functionality:

```text
- Create feature UI structure.
- Create list page.
- Create create form.
- Create edit form.
- Create details view where required.
- Add search.
- Add filtering.
- Add sorting.
- Add pagination.
- Add form validation.
- Add business-rule validation.
- Add loading states.
- Add empty states.
- Add error handling.
- Add success feedback.
- Add confirmation dialogs.
- Add permission-based UI behavior.
- Add keyboard/accessibility behavior where required.
- Integrate backend APIs.
- Add offline behavior where applicable.
```

UI tasks should follow existing application design and coding standards.

---

# 12. Security Tasks

Security should be treated as a cross-cutting requirement.

Where applicable:

```text
- Identify required permission.
- Add permission checks to backend.
- Add role-based access behavior.
- Add UI permission handling.
- Prevent unauthorized API access.
- Validate access to branch/company-scoped data.
- Add security-related test cases.
```

Do not rely only on UI hiding. Backend authorization must enforce access.

---

# 13. Audit Tasks

The ERP has both:

```text
AuditLog
ChangeHistory
```

Audit is a cross-cutting concern.

For applicable stories:

```text
- Identify auditable actions.
- Record business/security/system action in AuditLog where required.
- Record field-level changes in ChangeHistory where required.
- Capture actor/user.
- Capture timestamp.
- Capture entity and entity identifier.
- Capture relevant context.
- Ensure audit records are not accidentally removed through normal business operations.
- Add audit search/filter capability where required.
- Add audit tests.
```

Do not create a generic AuditLog CRUD feature simply because an AuditLog table exists.

---

# 14. Synchronization Tasks

The ERP supports offline-first synchronization with:

```text
Outbox
SyncLog
SyncConflict
```

For synchronization-aware stories, consider:

```text
- Define local persistence behavior.
- Define outbox event.
- Define synchronization payload.
- Define synchronization direction.
- Define retry behavior.
- Define idempotency behavior.
- Record SyncLog.
- Detect conflicts.
- Define conflict resolution.
- Handle synchronization failure.
- Handle retry.
- Verify consistency after synchronization.
- Add synchronization tests.
```

Not every master/read-only operation requires the full sync breakdown.

---

# 15. Testing Task Standard

Testing must be planned as part of the story.

Typical tasks:

```text
Backend:
- Unit tests.
- Service tests.
- Controller/API tests.
- Integration tests.

Database:
- Migration tests.
- Constraint tests.
- Transaction tests where applicable.

UI:
- Angular component tests.
- Form validation tests.
- Interaction tests.

E2E:
- End-to-end workflow tests where appropriate.

Security:
- Permission tests.
- Unauthorized-access tests.

Sync:
- Offline tests.
- Retry tests.
- Conflict tests.

Business:
- Happy-path tests.
- Negative tests.
- Boundary tests.
- Duplicate tests.
- State-transition tests.
```

Do not automatically create every test category for every story. Select what applies.

---

# 16. Documentation Tasks

Where applicable:

```text
- Update API documentation.
- Update database documentation.
- Update business-rule documentation.
- Update user workflow documentation.
- Update configuration documentation.
- Update operational documentation.
```

---

# 17. Cross-Cutting Platform Features

Do not duplicate foundational work in every business module.

Create platform-level Features for capabilities such as:

```text
Authentication Framework
Authorization Framework
Validation Framework
API Standards
Error Handling Framework
Logging Framework
Audit Framework
Soft Delete Framework
Optimistic Locking Framework
Common UI Components
Common API Components
Transaction Management
Configuration Framework
Exception Handling
Global Search / Filtering Standards
```

Then individual business stories contain only integration tasks.

---

# 18. Offline Synchronization Architecture

Treat offline synchronization as an architectural capability.

Suggested Features:

```text
Local Transaction Persistence
Outbox Processing
Cloud Synchronization
Sync Status Tracking
Retry Mechanism
Conflict Detection
Conflict Resolution
Sync Failure Recovery
Initial Data Synchronization
Data Consistency Validation
```

Every business capability should be assessed for synchronization impact.

---

# 19. Business Workflow First

The backlog must represent end-to-end workflows.

For example:

```text
Purchase Order
      ↓
Goods Receipt
      ↓
Purchase Invoice
      ↓
Batch
      ↓
Stock
      ↓
Stock Movement
```

Another example:

```text
Prescription
      ↓
Sales Invoice
      ↓
Sales Payment
```

Financial workflow:

```text
Ledger
   ↓
Receipt / Payment
```

These relationships are reflected in the Pharmacy ERP database architecture and should be represented as business workflows in ADO.

Do not treat every table as an isolated feature.

---

# 20. Example End-to-End Procurement Breakdown

```text
Epic:
Procurement / Purchase

Feature:
Purchase Order Management

User Story:
Create a purchase order

Tasks:
    DB:
        Define purchase order persistence
        Define purchase order item persistence
        Define relationships and constraints
        Add indexes
        Add migration

    Backend:
        Implement purchase order module
        Implement create purchase order API
        Validate supplier
        Validate medicines
        Validate quantities
        Validate business rules
        Implement transaction handling

    UI:
        Purchase order list
        Purchase order form
        Supplier selection
        Medicine/item selection
        Quantity entry
        Validation
        Save/submit behavior

    Security:
        Add purchase-order permissions

    Audit:
        Audit purchase-order creation/submission

    Sync:
        Add outbox event if applicable
        Define synchronization behavior

    Testing:
        Backend tests
        API tests
        UI tests
        Validation tests
        Permission tests
        E2E workflow test
```

---

# 21. Do Not Split Stories by Technology

Avoid:

```text
US: Supplier Backend
US: Supplier Angular
US: Supplier Database
```

Prefer:

```text
US: Manage Suppliers
```

with:

```text
Task: Database implementation
Task: Backend implementation
Task: UI implementation
Task: Security implementation
Task: Audit integration
Task: Sync integration
Task: Testing
```

This gives ADO a business-oriented backlog while retaining detailed engineering tracking.

---

# 22. Vertical Slice Development

Prefer completing a capability end-to-end rather than building the whole system layer-by-layer.

Recommended:

```text
Party Management
    DB
    Backend
    UI
    Security
    Audit
    Sync
    Tests
        ↓
Done

Medicine Master
    DB
    Backend
    UI
    Tests
        ↓
Done

Inventory
    DB
    Backend
    UI
    Tests
        ↓
Done
```

Avoid:

```text
Build entire database
        ↓
Build entire backend
        ↓
Build entire UI
        ↓
Test everything at the end
```

Vertical slices expose business-rule problems earlier.

---

# 23. Dependency-Driven Ordering

The backlog should follow system dependencies.

Suggested high-level dependency sequence:

```text
Foundation
    ↓
Organization & Configuration
    ↓
Geography / Common Masters
    ↓
Party
    ↓
Security
    ↓
Medicine Master
    ↓
Pricing
    ↓
Inventory
    ↓
Purchase
    ↓
Sales
    ↓
Financial
    ↓
Loyalty
    ↓
Reporting
```

Cross-cutting:

```text
Audit
Security
Synchronization
Logging
Error Handling
Testing
```

These cross-cutting capabilities may run alongside the relevant modules.

---

# 24. MVP / Priority Classification

Every Feature/User Story should have a priority.

Recommended:

```text
P0 — Foundation / Must Have
P1 — Core ERP
P2 — Important Enhancement
P3 — Future / Optional
```

Use business requirements to determine priority.

Do not assign priorities solely from database complexity.

---

# 25. Definition of Ready

A User Story should not normally enter development until:

```text
Business requirement understood
Business rules documented
Dependencies identified
Database impact understood
API requirements identified
UI behavior defined
Acceptance criteria defined
Authorization requirements identified
Audit impact identified
Synchronization impact identified
Testing scenarios identified
Out-of-scope items identified
```

---

# 26. Definition of Done

A User Story is Done when applicable:

```text
Code implemented
Database migration completed
SQLite behavior verified
PostgreSQL compatibility verified
Backend implemented
UI implemented
Validation implemented
Authorization implemented
Audit implemented
Synchronization implemented
Unit tests passed
Integration/API tests passed
UI tests passed
E2E tests passed where applicable
Code reviewed
Static analysis/Sonar checks passed
Documentation updated
No critical defects
ADO acceptance criteria satisfied
```

---

# 27. ADO Tagging Standard

Recommended tags:

## Module

```text
module-foundation
module-configuration
module-party
module-security
module-medicine
module-inventory
module-purchase
module-sales
module-finance
module-pricing
module-loyalty
module-prescription
module-sync
module-audit
module-reporting
```

## Layer

```text
layer-db
layer-backend
layer-ui
layer-testing
layer-devops
```

## Type

```text
type-functional
type-technical
type-security
type-performance
type-migration
type-integration
```

## Priority

```text
priority-p0
priority-p1
priority-p2
priority-p3
```

Use only tags that materially help filtering/reporting.

---

# 28. ADO Work Item Template

## Epic

```text
Work Item Type: Epic

Title:
<Business Area>

Description:
<Purpose of the business area>

Business Objective:
<Why this Epic exists>

Scope:
<Included capabilities>

Out of Scope:
<Excluded capabilities>

Major Features:
- Feature 1
- Feature 2
- Feature 3

Dependencies:
- Dependency 1
- Dependency 2

Priority:
P0 / P1 / P2 / P3

Tags:
<module-xxx>
```

---

## Feature

```text
Work Item Type: Feature

Title:
<Business Capability>

Parent:
<Epic>

Description:
<Detailed capability description>

Business Value:
<Business outcome>

Scope:
<Included functionality>

Dependencies:
<Dependencies>

Acceptance Criteria:
- Criterion 1
- Criterion 2
- Criterion 3

Priority:
P0 / P1 / P2 / P3

Tags:
<module-xxx>
```

---

## User Story

```text
Work Item Type: User Story

Title:
<Business capability>

Parent:
<Feature>

As a:
<Persona>

I want:
<Capability>

So that:
<Business outcome>

Description:
<Detailed requirement>

Business Rules:
- Rule 1
- Rule 2
- Rule 3

Dependencies:
- Dependency 1

Out of Scope:
- Item 1

Acceptance Criteria:

Given ...
When ...
Then ...

Given ...
When ...
Then ...

Priority:
P0 / P1 / P2 / P3

Tags:
<module-xxx>
```

---

## Task

```text
Work Item Type: Task

Title:
<Implementation activity>

Parent:
<User Story>

Task Type:
Database / Backend / UI / Security / Audit / Sync / Testing / Documentation / DevOps

Description:
<Detailed technical activity>

Expected Result:
<What should be completed>

Dependencies:
<Dependencies>

Definition of Done:
- Implementation completed
- Tests completed
- Review completed
- Documentation updated where applicable

Tags:
<layer-xxx>
```

---

# 29. Final Backlog Structure

The complete backlog should look conceptually like:

```text
EPIC
│
├── FEATURE
│   │
│   ├── USER STORY
│   │   │
│   │   ├── DB TASK
│   │   ├── BACKEND TASK
│   │   ├── UI TASK
│   │   ├── SECURITY TASK
│   │   ├── AUDIT TASK
│   │   ├── SYNC TASK
│   │   ├── TEST TASK
│   │   └── DOCUMENTATION TASK
│   │
│   └── USER STORY
│       └── ...
│
└── FEATURE
    └── ...
```

---

# 30. Recommended Backlog Creation Process

Follow these stages in order.

## Stage 1 — Product Decomposition

Create the complete:

```text
Epic
  ↓
Feature
  ↓
User Story
```

Do not create detailed Tasks yet.

Goal:

- Cover the complete product.
- Avoid missing business capabilities.
- Avoid duplicate capabilities.
- Identify dependencies.
- Identify workflows.

---

## Stage 2 — Story Refinement

For every User Story define:

```text
Description
Persona
Business Goal
Business Rules
Dependencies
Acceptance Criteria
Priority
Out of Scope
```

Review the story for completeness before task breakdown.

---

## Stage 3 — Engineering Breakdown

For every approved User Story determine which layers are required:

```text
Database?
Backend?
UI?
Security?
Audit?
Sync?
Testing?
Documentation?
DevOps?
```

Only create relevant Tasks.

---

## Stage 4 — Dependency Ordering

Order the backlog based on:

```text
Architecture dependencies
Data dependencies
Business workflow dependencies
Security dependencies
Integration dependencies
```

---

## Stage 5 — ADO Entry

Create:

```text
Epics
    ↓
Features
        ↓
User Stories
            ↓
Tasks
```

Set:

- Parent
- Area Path
- Iteration Path
- Priority
- Tags
- Acceptance Criteria

---

# 31. Quality Checks Before Finalizing the Backlog

Before considering the backlog complete, verify:

```text
[ ] Every major business domain has an Epic.
[ ] Every Epic has meaningful Features.
[ ] Every Feature contains business-oriented User Stories.
[ ] User Stories are not simply database CRUD operations.
[ ] Major workflows are represented.
[ ] Database work is represented through Tasks.
[ ] Backend work is represented through Tasks.
[ ] UI work is represented through Tasks.
[ ] Security is considered.
[ ] Audit is considered.
[ ] Offline synchronization is considered.
[ ] Testing is considered.
[ ] Documentation is considered.
[ ] Dependencies are identified.
[ ] Priorities are assigned.
[ ] Acceptance criteria are defined.
[ ] Definition of Ready is satisfied.
[ ] Definition of Done is satisfied.
[ ] SQLite compatibility is considered.
[ ] PostgreSQL compatibility is considered.
[ ] Soft-delete requirements are considered.
[ ] Optimistic locking is considered where applicable.
[ ] No unnecessary duplicate stories exist.
[ ] No table is automatically treated as a business feature.
[ ] End-to-end workflows are represented.
[ ] MVP vs future capabilities are identified.
```

---

# 32. Important Principle

The final backlog should answer two questions simultaneously:

### Business question

> What capability are we delivering to the pharmacy?

### Engineering question

> What work must the team perform to deliver that capability completely?

Therefore:

```text
Business capability
        ↓
User Story
        ↓
Complete vertical implementation
        ↓
Database
Backend
UI
Security
Audit
Sync
Testing
Documentation
        ↓
Done
```

This approach keeps the Pharmacy ERP backlog business-oriented while still providing enough engineering detail for implementation and tracking in Azure DevOps.

---

# 33. Standard for Future ADO Generation

Whenever generating the actual Pharmacy ERP ADO backlog, follow these rules:

1. Start with Epic → Feature → User Story.
2. Do not start from individual tables.
3. Use the database schema as the technical foundation.
4. Model actual business workflows.
5. Keep User Stories business-oriented.
6. Put database/backend/UI work into Tasks.
7. Add Security, Audit, Sync, Testing, and Documentation Tasks only where applicable.
8. Include detailed acceptance criteria.
9. Identify dependencies.
10. Assign priority.
11. Follow vertical-slice development.
12. Respect SQLite development and PostgreSQL production compatibility.
13. Respect Party as the master entity.
14. Respect offline-first synchronization.
15. Respect audit requirements.
16. Respect soft-delete requirements.
17. Respect optimistic-locking requirements.
18. Avoid duplicate or artificially fragmented stories.
19. Ensure the entire ERP is covered.
20. Generate the backlog in manageable phases when the total number of ADO items becomes large.

The objective is not to produce the largest possible number of ADO items.

The objective is to produce a **complete, traceable, dependency-aware, implementation-ready Pharmacy ERP backlog**.
