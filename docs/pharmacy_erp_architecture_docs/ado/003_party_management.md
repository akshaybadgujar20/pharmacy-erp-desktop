# Phase 3 — Party Management

## 1. Objective

Establish the central Party Management capability for the Pharmacy ERP.

The database architecture identifies `Party` as the master entity and supports multiple roles for a single party. Party-related information is separated into reusable role, address, and contact structures:

```text
Party
  │
  ├── PartyRole
  ├── PartyAddress
  ├── PartyContact
  │
  ├── Customer
  ├── Supplier
  ├── Doctor
  └── Employee
```

This phase establishes the party foundation that later modules will consume.

The database overview explicitly states:

- Party is the master entity.
- A single party can support multiple roles.
- PartyAddress and PartyContact are reusable party-level structures.
- Customer, Supplier, Doctor, and Employee are party-related business roles.
- Soft delete, timestamps, UUID external references, BIGINT identifiers, and optimistic locking are architectural conventions.

fileciteturn0file0

---

# 2. Scope

## In Scope

- Party master
- Party identity information
- Party lifecycle
- Party search and retrieval
- Party duplicate prevention
- Party roles
- Customer role
- Supplier role
- Doctor role
- Employee role
- Party addresses
- Party contacts
- Primary address/contact rules
- Address/contact lifecycle
- Party status
- Party role validation
- Party relationship APIs
- Party management UI
- Role-specific UI
- Authorization integration
- Audit integration
- Testing
- SQLite/PostgreSQL compatibility
- Reusable Party services for later modules

## Out of Scope

The following belong to later phases:

- User authentication and login
- User/Role/Permission administration
- Medicine
- Inventory
- Purchase
- Sales
- Prescription
- Financial transactions
- Loyalty
- Full synchronization implementation
- Advanced reporting

Party data created in this phase will become the foundation for those later modules.

---

# 3. ADO Hierarchy

```text
EPIC-003 — Party Management
│
├── FEAT-025 — Party Master Foundation
├── FEAT-026 — Party Registration
├── FEAT-027 — Party Search & Retrieval
├── FEAT-028 — Party Update & Lifecycle
├── FEAT-029 — Party Role Management
├── FEAT-030 — Customer Management
├── FEAT-031 — Supplier Management
├── FEAT-032 — Doctor Management
├── FEAT-033 — Employee Management
├── FEAT-034 — Party Address Management
├── FEAT-035 — Party Contact Management
├── FEAT-036 — Party Duplicate & Data Quality
└── FEAT-037 — Party Integration Foundation
```

---

# 4. Epic

## EPIC-003 — Party Management

### Description

Provide a centralized master-data capability for people and organizations that participate in the Pharmacy ERP.

The Party model must support multiple business roles without duplicating common party information.

### Business Value

A single person or organization may participate in multiple ERP processes. The Party architecture avoids duplicate master records and allows a party to acquire multiple roles.

For example:

```text
One Party
   │
   ├── Customer
   ├── Supplier
   └── Doctor
```

The exact combination depends on business rules and should not be artificially restricted unless a role-specific rule requires it.

### Epic Completion Criteria

- Party master is operational.
- Party registration is operational.
- Party search/retrieval is operational.
- Party update and lifecycle management is operational.
- Multiple roles can be associated with a party.
- Customer role is operational.
- Supplier role is operational.
- Doctor role is operational.
- Employee role is operational.
- Multiple addresses are supported.
- Multiple contacts are supported.
- Primary address/contact rules are enforced.
- Duplicate detection/prevention is implemented.
- Authorization boundaries are established.
- Audit integration points are established.
- Automated tests cover core and negative scenarios.
- Party APIs are reusable by downstream modules.

---

# 5. Feature: Party Master Foundation

## FEAT-025 — Party Master Foundation

### Objective

Establish the common Party record that represents a person or organization.

## US-049 — Define party master record

**User Story**

As an authorized ERP user, I want to maintain a common party master so that people and organizations can be reused throughout the system.

### Acceptance Criteria

1. A Party can represent the common identity of a person or organization.
2. The Party has a stable internal identifier.
3. The Party follows the standard UUID/external-reference convention where applicable.
4. Common timestamps are maintained.
5. Soft-delete behavior follows the platform standard.
6. Optimistic locking is available where required.
7. Party-specific information is not duplicated unnecessarily in role tables.

### Tasks

**TASK-281 — Define Party database model requirements**
- Identify common party attributes.
- Identify required relationships.
- Define constraints and indexes.
- Confirm lifecycle fields.
- Confirm compatibility with role-specific tables.

**TASK-282 — Implement Party Prisma model**

**TASK-283 — Define Party relationships**

**TASK-284 — Define Party indexes and uniqueness rules**

**TASK-285 — Create Party migration**

**TASK-286 — Validate Party model against SQLite**

**TASK-287 — Validate Party model against PostgreSQL**

**TASK-288 — Add Party model tests**

---

# 6. Feature: Party Registration

## FEAT-026 — Party Registration

## US-050 — Register a party

**User Story**

As an authorized user, I want to register a party so that the party can participate in ERP processes.

### Acceptance Criteria

1. Authorized users can create a party.
2. Required information is validated.
3. Party type/business identity is validated according to the final business model.
4. Duplicate party checks are performed.
5. A party can subsequently receive one or more roles.
6. Party creation is auditable.
7. Invalid data is rejected using standardized API validation.

### Tasks

**TASK-289 — Define party registration business rules**

**TASK-290 — Implement Party create DTO**

**TASK-291 — Implement Party validation**

**TASK-292 — Implement Party creation service**

**TASK-293 — Implement Party create API**

**TASK-294 — Implement Party registration UI**

**TASK-295 — Add Party registration form validation**

**TASK-296 — Add Party registration loading/error handling**

**TASK-297 — Add Party registration authorization**

**TASK-298 — Add Party registration tests**

---

## US-051 — Register organization and individual party information

**User Story**

As an authorized user, I want to capture the appropriate common identity information for a person or organization so that party records are meaningful and reusable.

### Acceptance Criteria

1. The UI supports the required party identity fields.
2. Person-specific and organization-specific data is handled according to the final business rules.
3. Invalid combinations are rejected.
4. The backend performs the authoritative validation.

### Tasks

**TASK-299 — Define person/organization identity rules**

**TASK-300 — Implement backend identity validation**

**TASK-301 — Implement identity-aware party form**

**TASK-302 — Add person/organization validation tests**

---

# 7. Feature: Party Search & Retrieval

## FEAT-027 — Party Search & Retrieval

## US-052 — Search parties

**User Story**

As an ERP user, I want to search for parties so that I can quickly find an existing customer, supplier, doctor, employee, or other party.

### Acceptance Criteria

1. Authorized users can search parties.
2. Search can use supported identity fields.
3. Search can be filtered by party role.
4. Inactive/deleted parties follow lifecycle visibility rules.
5. Results are paginated for large datasets.
6. Search results do not expose unauthorized information.

### Tasks

**TASK-303 — Define Party search fields**

**TASK-304 — Implement Party search API**

**TASK-305 — Implement Party role filter**

**TASK-306 — Implement Party status filter**

**TASK-307 — Implement Party pagination**

**TASK-308 — Implement Party search UI**

**TASK-309 — Implement Party filter UI**

**TASK-310 — Add Party search tests**

---

## US-053 — View party details

### Acceptance Criteria

1. Authorized users can view party details.
2. Common identity information is displayed.
3. Assigned roles are displayed.
4. Addresses are displayed.
5. Contacts are displayed.
6. Lifecycle status is displayed.
7. Related data is presented without duplicating master information.

### Tasks

**TASK-311 — Implement Party detail API**

**TASK-312 — Implement Party detail UI**

**TASK-313 — Implement role summary section**

**TASK-314 — Implement address summary section**

**TASK-315 — Implement contact summary section**

**TASK-316 — Add Party detail tests**

---

# 8. Feature: Party Update & Lifecycle

## FEAT-028 — Party Update & Lifecycle

## US-054 — Update party information

**User Story**

As an authorized user, I want to update party information so that master data remains accurate.

### Acceptance Criteria

1. Authorized users can update permitted information.
2. Validation rules apply to updates.
3. Duplicate checks are applied where relevant.
4. Concurrent modifications are handled using the platform's optimistic-locking convention.
5. Changes are auditable.
6. Historical transaction references remain intact.

### Tasks

**TASK-317 — Define editable Party fields**

**TASK-318 — Implement Party update DTO**

**TASK-319 — Implement Party update service**

**TASK-320 — Implement Party update API**

**TASK-321 — Implement Party edit UI**

**TASK-322 — Implement optimistic-lock handling**

**TASK-323 — Add Party update audit integration**

**TASK-324 — Add Party update tests**

---

## US-055 — Activate/deactivate party

### Acceptance Criteria

1. Authorized users can change party lifecycle status.
2. Deactivated parties remain available for historical reference.
3. Deactivated parties are not selectable for prohibited new transactions.
4. Reactivation follows authorization rules.
5. Lifecycle changes are auditable.

### Tasks

**TASK-325 — Define Party lifecycle states**

**TASK-326 — Implement Party activation/deactivation service**

**TASK-327 — Implement lifecycle API**

**TASK-328 — Implement lifecycle UI**

**TASK-329 — Add lifecycle audit integration**

**TASK-330 — Add lifecycle tests**

---

## US-056 — Soft-delete and restore party

### Acceptance Criteria

1. Soft deletion follows Phase 1 persistence conventions.
2. Normal Party queries exclude deleted records.
3. Deleted parties are preserved for historical references.
4. Restoration is restricted to authorized users.
5. Restoration does not violate uniqueness rules.

### Tasks

**TASK-331 — Implement Party soft-delete behavior**

**TASK-332 — Implement Party restore behavior**

**TASK-333 — Implement deleted-record filtering**

**TASK-334 — Implement restore UI where required**

**TASK-335 — Add soft-delete/restore tests**

---

# 9. Feature: Party Role Management

## FEAT-029 — Party Role Management

## US-057 — Assign a role to a party

**User Story**

As an authorized user, I want to assign business roles to a party so that the same party can participate in different ERP processes.

### Acceptance Criteria

1. A party can have one or more permitted business roles.
2. Duplicate role assignments are prevented.
3. Invalid role assignments are rejected.
4. Role-specific information can be created when required.
5. Role assignment is auditable.
6. Removing a role does not unintentionally delete the Party.

### Tasks

**TASK-336 — Define PartyRole model rules**

**TASK-337 — Implement PartyRole Prisma model**

**TASK-338 — Create PartyRole migration**

**TASK-339 — Define supported business-role types**

**TASK-340 — Implement role-assignment service**

**TASK-341 — Implement role-assignment API**

**TASK-342 — Implement role assignment UI**

**TASK-343 — Add duplicate-role prevention**

**TASK-344 — Add role-assignment authorization**

**TASK-345 — Add role-assignment tests**

---

## US-058 — Remove or deactivate a party role

### Acceptance Criteria

1. Authorized users can deactivate/remove an applicable role.
2. The Party remains intact.
3. Existing historical transactions remain linked to the Party.
4. Role-specific records are handled according to dependency rules.
5. Role changes are auditable.

### Tasks

**TASK-346 — Define role deactivation rules**

**TASK-347 — Implement role lifecycle service**

**TASK-348 — Implement role lifecycle API**

**TASK-349 — Implement role lifecycle UI**

**TASK-350 — Add role lifecycle tests**

---

## US-059 — View all roles for a party

### Acceptance Criteria

1. Party details show all assigned roles.
2. Role status is visible.
3. Role-specific information can be accessed where permitted.

### Tasks

**TASK-351 — Implement Party role retrieval API**

**TASK-352 — Implement role summary UI**

**TASK-353 — Add role retrieval tests**

---

# 10. Feature: Customer Management

## FEAT-030 — Customer Management

## US-060 — Add customer role to a party

**User Story**

As an authorized user, I want to designate a party as a customer so that the party can participate in sales processes.

### Acceptance Criteria

1. A valid Party can be assigned the Customer role.
2. Duplicate Customer role assignments are prevented.
3. Customer-specific data is validated.
4. Customer status is available for downstream sales processes.
5. The Party remains the common master record.

### Tasks

**TASK-354 — Define Customer-specific data requirements**

**TASK-355 — Implement Customer Prisma model**

**TASK-356 — Create Customer migration**

**TASK-357 — Implement Customer DTOs**

**TASK-358 — Implement Customer service**

**TASK-359 — Implement Customer API**

**TASK-360 — Implement Customer role UI**

**TASK-361 — Add Customer validation**

**TASK-362 — Add Customer authorization**

**TASK-363 — Add Customer tests**

---

## US-061 — Manage customer lifecycle

### Acceptance Criteria

1. Customer can be activated/deactivated.
2. Customer status is independent of unrelated Party roles where appropriate.
3. Deactivated customers cannot be selected for prohibited new sales operations.
4. Historical sales records remain accessible.

### Tasks

**TASK-364 — Implement Customer lifecycle logic**

**TASK-365 — Implement Customer lifecycle API**

**TASK-366 — Implement Customer lifecycle UI**

**TASK-367 — Add Customer lifecycle tests**

---

## US-062 — View customer information

### Tasks

**TASK-368 — Implement Customer detail API**

**TASK-369 — Implement Customer detail UI**

**TASK-370 — Add Customer search/filter integration**

**TASK-371 — Add Customer detail tests**

---

# 11. Feature: Supplier Management

## FEAT-031 — Supplier Management

## US-063 — Add supplier role to a party

**User Story**

As an authorized user, I want to designate a party as a supplier so that the party can participate in procurement processes.

### Acceptance Criteria

1. A valid Party can be assigned the Supplier role.
2. Duplicate Supplier role assignments are prevented.
3. Supplier-specific data is validated.
4. Supplier status is available for procurement processes.
5. Common party information remains in Party.

### Tasks

**TASK-372 — Define Supplier-specific data requirements**

**TASK-373 — Implement Supplier Prisma model**

**TASK-374 — Create Supplier migration**

**TASK-375 — Implement Supplier DTOs**

**TASK-376 — Implement Supplier service**

**TASK-377 — Implement Supplier API**

**TASK-378 — Implement Supplier UI**

**TASK-379 — Add Supplier validation**

**TASK-380 — Add Supplier authorization**

**TASK-381 — Add Supplier tests**

---

## US-064 — Manage supplier lifecycle

### Acceptance Criteria

1. Supplier can be activated/deactivated.
2. Deactivated suppliers cannot be selected for prohibited new procurement activities.
3. Historical purchase relationships remain intact.

### Tasks

**TASK-382 — Implement Supplier lifecycle logic**

**TASK-383 — Implement Supplier lifecycle API**

**TASK-384 — Implement Supplier lifecycle UI**

**TASK-385 — Add Supplier lifecycle tests**

---

## US-065 — View supplier information

### Tasks

**TASK-386 — Implement Supplier detail API**

**TASK-387 — Implement Supplier detail UI**

**TASK-388 — Implement Supplier search/filter integration**

**TASK-389 — Add Supplier detail tests**

---

# 12. Feature: Doctor Management

## FEAT-032 — Doctor Management

## US-066 — Add doctor role to a party

**User Story**

As an authorized user, I want to designate a party as a doctor so that prescriptions can later reference the appropriate doctor.

### Acceptance Criteria

1. A valid Party can be assigned the Doctor role.
2. Duplicate Doctor role assignments are prevented.
3. Doctor-specific data is validated.
4. Doctor status can be managed.
5. Common identity data remains in Party.

### Tasks

**TASK-390 — Define Doctor-specific data requirements**

**TASK-391 — Implement Doctor Prisma model**

**TASK-392 — Create Doctor migration**

**TASK-393 — Implement Doctor DTOs**

**TASK-394 — Implement Doctor service**

**TASK-395 — Implement Doctor API**

**TASK-396 — Implement Doctor UI**

**TASK-397 — Add Doctor validation**

**TASK-398 — Add Doctor authorization**

**TASK-399 — Add Doctor tests**

---

## US-067 — Manage doctor lifecycle

### Tasks

**TASK-400 — Implement Doctor lifecycle logic**

**TASK-401 — Implement Doctor lifecycle API**

**TASK-402 — Implement Doctor lifecycle UI**

**TASK-403 — Add Doctor lifecycle tests**

---

## US-068 — View/search doctors

### Acceptance Criteria

1. Authorized users can search doctors.
2. Inactive doctors follow lifecycle rules.
3. Doctor selection can later be consumed by Prescription functionality.

### Tasks

**TASK-404 — Implement Doctor search API**

**TASK-405 — Implement Doctor search UI**

**TASK-406 — Implement reusable Doctor lookup API**

**TASK-407 — Add Doctor search tests**

---

# 13. Feature: Employee Management

## FEAT-033 — Employee Management

## US-069 — Add employee role to a party

**User Story**

As an authorized administrator, I want to designate a party as an employee so that the party can be associated with ERP operational responsibilities.

### Acceptance Criteria

1. A valid Party can be assigned the Employee role.
2. Duplicate Employee role assignments are prevented.
3. Employee-specific information is validated.
4. Employee lifecycle is separately manageable from the Party master.
5. Common identity information remains centralized in Party.

### Tasks

**TASK-408 — Define Employee-specific data requirements**

**TASK-409 — Implement Employee Prisma model**

**TASK-410 — Create Employee migration**

**TASK-411 — Implement Employee DTOs**

**TASK-412 — Implement Employee service**

**TASK-413 — Implement Employee API**

**TASK-414 — Implement Employee UI**

**TASK-415 — Add Employee validation**

**TASK-416 — Add Employee authorization**

**TASK-417 — Add Employee tests**

---

## US-070 — Manage employee lifecycle

### Tasks

**TASK-418 — Implement Employee lifecycle logic**

**TASK-419 — Implement Employee lifecycle API**

**TASK-420 — Implement Employee lifecycle UI**

**TASK-421 — Add Employee lifecycle tests**

---

## US-071 — View/search employees

### Tasks

**TASK-422 — Implement Employee search API**

**TASK-423 — Implement Employee search UI**

**TASK-424 — Implement reusable Employee lookup API**

**TASK-425 — Add Employee search tests**

> Employee authentication/user-account linkage belongs to Phase 4 and must not be implemented here unless explicitly required by the final security design.

---

# 14. Feature: Party Address Management

## FEAT-034 — Party Address Management

## US-072 — Add address to a party

**User Story**

As an authorized user, I want to add an address to a party so that the party can have reusable address information.

### Acceptance Criteria

1. A party can have multiple addresses.
2. Address type is validated.
3. Geographic fields use the Phase 2 hierarchy.
4. Invalid Country → State → City → Area combinations are rejected.
5. Address can be marked primary where permitted.
6. Address changes are auditable.

### Tasks

**TASK-426 — Define PartyAddress model requirements**

**TASK-427 — Implement PartyAddress Prisma model**

**TASK-428 — Create PartyAddress migration**

**TASK-429 — Implement PartyAddress DTOs**

**TASK-430 — Implement address hierarchy validation**

**TASK-431 — Implement PartyAddress service**

**TASK-432 — Implement PartyAddress API**

**TASK-433 — Implement PartyAddress UI**

**TASK-434 — Integrate Country/State/City/Area cascading selection**

**TASK-435 — Add PartyAddress authorization**

**TASK-436 — Add PartyAddress tests**

---

## US-073 — Manage multiple party addresses

### Acceptance Criteria

1. A party can maintain multiple address records.
2. Each address has a meaningful type/status.
3. The user can identify the primary address where business rules permit.
4. Existing addresses are not overwritten unintentionally.

### Tasks

**TASK-437 — Implement address list API**

**TASK-438 — Implement address list UI**

**TASK-439 — Implement address edit API/UI**

**TASK-440 — Implement address lifecycle**

**TASK-441 — Add multiple-address tests**

---

## US-074 — Manage primary party address

### Acceptance Criteria

1. The system enforces the defined primary-address rule.
2. Assigning a new primary address handles the previous primary correctly.
3. Invalid multiple-primary states cannot be created.
4. Historical address records remain available where required.

### Tasks

**TASK-442 — Define primary-address business rules**

**TASK-443 — Implement primary-address service logic**

**TASK-444 — Implement primary-address API**

**TASK-445 — Implement primary-address UI**

**TASK-446 — Add primary-address constraint tests**

---

# 15. Feature: Party Contact Management

## FEAT-035 — Party Contact Management

## US-075 — Add contact to a party

**User Story**

As an authorized user, I want to add contact information to a party so that phone, email, and other supported contacts can be reused throughout the ERP.

### Acceptance Criteria

1. A party can have multiple contacts.
2. Contact type is validated.
3. Contact value is validated according to contact type.
4. Country code can be maintained where applicable.
5. Primary contact rules are enforced.
6. Verification status is maintained.
7. Contact lifecycle is supported.

### Tasks

**TASK-447 — Define PartyContact model requirements**

**TASK-448 — Implement PartyContact Prisma model**

**TASK-449 — Create PartyContact migration**

**TASK-450 — Implement PartyContact DTOs**

**TASK-451 — Implement contact validation**

**TASK-452 — Implement PartyContact service**

**TASK-453 — Implement PartyContact API**

**TASK-454 — Implement PartyContact UI**

**TASK-455 — Add contact authorization**

**TASK-456 — Add PartyContact tests**

---

## US-076 — Manage multiple party contacts

### Acceptance Criteria

1. Multiple contact records can be maintained.
2. Contact type can distinguish supported contact methods.
3. Active/inactive contacts are supported.
4. Existing contact information is not overwritten unintentionally.

### Tasks

**TASK-457 — Implement contact list API**

**TASK-458 — Implement contact list UI**

**TASK-459 — Implement contact edit API/UI**

**TASK-460 — Implement contact lifecycle**

**TASK-461 — Add multiple-contact tests**

---

## US-077 — Manage primary and verified contacts

### Acceptance Criteria

1. The primary-contact rule is enforced.
2. Contact verification status can be maintained.
3. Invalid multiple-primary states are prevented.
4. Verification changes are auditable where required.

### Tasks

**TASK-462 — Define primary-contact rules**

**TASK-463 — Implement primary-contact service**

**TASK-464 — Implement contact verification state handling**

**TASK-465 — Implement primary/verification UI**

**TASK-466 — Add primary/verification tests**

---

# 16. Feature: Party Duplicate & Data Quality

## FEAT-036 — Party Duplicate & Data Quality

## US-078 — Prevent obvious duplicate party records

**User Story**

As an ERP user, I want the system to detect likely duplicate parties so that the master data remains clean.

### Acceptance Criteria

1. Duplicate detection uses approved matching rules.
2. Exact duplicate identifiers are rejected where uniqueness is mandatory.
3. Potential duplicates can be surfaced to the user where appropriate.
4. The system does not automatically merge parties without an explicit business rule.
5. Duplicate checks do not unnecessarily prevent legitimate parties.

### Tasks

**TASK-467 — Define Party uniqueness rules**

**TASK-468 — Define Party duplicate-detection criteria**

**TASK-469 — Implement exact duplicate validation**

**TASK-470 — Implement potential-duplicate lookup**

**TASK-471 — Implement duplicate warning UI**

**TASK-472 — Add duplicate detection tests**

---

## US-079 — Protect Party data integrity

### Acceptance Criteria

1. Required relationships cannot be broken.
2. Invalid role references are rejected.
3. Invalid address relationships are rejected.
4. Invalid contact relationships are rejected.
5. Soft-deleted records are handled consistently.
6. Referential integrity is preserved.

### Tasks

**TASK-473 — Add Party relationship integrity checks**

**TASK-474 — Add role integrity checks**

**TASK-475 — Add address integrity checks**

**TASK-476 — Add contact integrity checks**

**TASK-477 — Add data-integrity tests**

---

# 17. Feature: Party Integration Foundation

## FEAT-037 — Party Integration Foundation

### Objective

Provide reusable services and lookup APIs that later modules can consume without directly duplicating Party implementation logic.

## US-080 — Provide reusable party lookup

**User Story**

As a downstream ERP module, I want a standard Party lookup service so that customer/supplier/doctor/employee selection is consistent.

### Acceptance Criteria

1. Downstream modules can search Party records through a standard contract.
2. Role-based filtering is supported.
3. Inactive records follow lifecycle rules.
4. Pagination and search are supported.
5. Authorization is respected.

### Tasks

**TASK-478 — Define reusable Party lookup contract**

**TASK-479 — Implement Party lookup service**

**TASK-480 — Implement role-aware Party lookup**

**TASK-481 — Implement reusable lookup API**

**TASK-482 — Implement frontend Party lookup service**

**TASK-483 — Add lookup tests**

---

## US-081 — Provide reusable customer lookup

### Tasks

**TASK-484 — Define Customer lookup contract**

**TASK-485 — Implement Customer lookup service**

**TASK-486 — Implement Customer lookup API**

**TASK-487 — Implement Customer lookup UI/service**

**TASK-488 — Add Customer lookup tests**

---

## US-082 — Provide reusable supplier lookup

### Tasks

**TASK-489 — Define Supplier lookup contract**

**TASK-490 — Implement Supplier lookup service**

**TASK-491 — Implement Supplier lookup API**

**TASK-492 — Implement Supplier lookup UI/service**

**TASK-493 — Add Supplier lookup tests**

---

## US-083 — Provide reusable doctor lookup

### Tasks

**TASK-494 — Define Doctor lookup contract**

**TASK-495 — Implement Doctor lookup service**

**TASK-496 — Implement Doctor lookup API**

**TASK-497 — Implement Doctor lookup UI/service**

**TASK-498 — Add Doctor lookup tests**

---

## US-084 — Provide reusable employee lookup

### Tasks

**TASK-499 — Define Employee lookup contract**

**TASK-500 — Implement Employee lookup service**

**TASK-501 — Implement Employee lookup API**

**TASK-502 — Implement Employee lookup UI/service**

**TASK-503 — Add Employee lookup tests**

---

# 18. Cross-Cutting Authorization

Phase 4 will implement the complete User/Role/Permission management model. Phase 3 should nevertheless define and enforce the authorization boundaries required by Party Management.

### Permission categories

```text
Party.View
Party.Create
Party.Update
Party.Activate
Party.Deactivate
Party.Delete
Party.Restore

PartyRole.View
PartyRole.Assign
PartyRole.Remove

Customer.View
Customer.Create
Customer.Update
Customer.Activate
Customer.Deactivate

Supplier.View
Supplier.Create
Supplier.Update
Supplier.Activate
Supplier.Deactivate

Doctor.View
Doctor.Create
Doctor.Update
Doctor.Activate
Doctor.Deactivate

Employee.View
Employee.Create
Employee.Update
Employee.Activate
Employee.Deactivate

PartyAddress.View
PartyAddress.Create
PartyAddress.Update
PartyAddress.Delete

PartyContact.View
PartyContact.Create
PartyContact.Update
PartyContact.Delete
```

### Tasks

**TASK-504 — Define Party permission catalog**

**TASK-505 — Define PartyRole permission catalog**

**TASK-506 — Define Customer permission catalog**

**TASK-507 — Define Supplier permission catalog**

**TASK-508 — Define Doctor permission catalog**

**TASK-509 — Define Employee permission catalog**

**TASK-510 — Define address/contact permission catalog**

**TASK-511 — Verify API authorization boundaries**

**TASK-512 — Verify UI permission boundaries**

---

# 19. Cross-Cutting Audit Integration

Complete AuditLog and ChangeHistory functionality belongs to a later phase, but Party Management must identify events that should eventually be recorded.

### Important events

```text
Party created
Party updated
Party activated
Party deactivated
Party soft-deleted
Party restored

Party role assigned
Party role removed

Customer created/updated/status changed
Supplier created/updated/status changed
Doctor created/updated/status changed
Employee created/updated/status changed

Address added/updated/deactivated
Primary address changed

Contact added/updated/deactivated
Primary contact changed
Contact verification changed

Potential duplicate detected
```

### Tasks

**TASK-513 — Define Party audit event catalog**

**TASK-514 — Define PartyRole audit event catalog**

**TASK-515 — Define role-specific audit event catalog**

**TASK-516 — Define address audit event catalog**

**TASK-517 — Define contact audit event catalog**

**TASK-518 — Integrate Party operations with audit framework**

**TASK-519 — Verify sensitive information is not unnecessarily recorded in audit payloads**

---

# 20. Data Privacy & Sensitive Information

Party data can contain personally identifiable or business-sensitive information.

### Requirements

- Do not expose unnecessary fields in list APIs.
- Avoid logging sensitive contact information unnecessarily.
- Apply authorization before returning detailed Party data.
- Avoid placing sensitive information in exception messages.
- Audit payloads should contain only the required context.
- API responses should expose only fields required by the caller.

### Tasks

**TASK-520 — Define Party data exposure rules**

**TASK-521 — Review Party API response DTOs**

**TASK-522 — Review Party logging behavior**

**TASK-523 — Review Party audit payloads**

**TASK-524 — Add data-exposure tests**

---

# 21. Database Standards

Phase 3 must follow the database standards established in Phase 1.

### Requirements

- Singular table names.
- BIGINT primary keys.
- UUID external references where applicable.
- `createdAt` and `updatedAt`.
- `deletedAt` for applicable soft-deletable records.
- `version` for optimistic locking where applicable.
- Explicit relationships.
- Appropriate unique constraints.
- Appropriate indexes.
- SQLite compatibility.
- PostgreSQL compatibility.
- Prisma migration support.

### Tasks

**TASK-525 — Review Party schema relationships**

**TASK-526 — Review PartyRole constraints/indexes**

**TASK-527 — Review Customer/Supplier/Doctor/Employee relationships**

**TASK-528 — Review PartyAddress relationships and indexes**

**TASK-529 — Review PartyContact relationships and indexes**

**TASK-530 — Review uniqueness rules**

**TASK-531 — Validate SQLite compatibility**

**TASK-532 — Validate PostgreSQL compatibility**

---

# 22. UI Standards

Party management screens should use the common UI infrastructure established in Phase 1.

## Party List

Expected capabilities:

- Search
- Role filter
- Status filter
- Sorting
- Pagination
- View
- Edit
- Lifecycle actions
- Permission-aware actions

## Party Form

Expected capabilities:

- Common identity fields
- Validation
- Address management
- Contact management
- Role management
- Loading state
- Error state
- Confirmation where needed

## Party Details

Expected sections:

```text
Party Information
Roles
Addresses
Contacts
Status
```

### Tasks

**TASK-533 — Define Party list-page UX**

**TASK-534 — Define Party registration/edit UX**

**TASK-535 — Define Party details UX**

**TASK-536 — Define role management UX**

**TASK-537 — Define address management UX**

**TASK-538 — Define contact management UX**

**TASK-539 — Define duplicate-warning UX**

---

# 23. Testing Strategy

## Backend

- Party service unit tests
- Role service tests
- Customer service tests
- Supplier service tests
- Doctor service tests
- Employee service tests
- Address service tests
- Contact service tests
- Duplicate detection tests
- Lifecycle tests
- Authorization tests

## API

- Create
- Read
- Search
- Filter
- Update
- Activate/deactivate
- Soft delete
- Restore
- Role assignment
- Role removal
- Address operations
- Contact operations

## UI

- Party list
- Party search
- Party filters
- Party form
- Party details
- Role management
- Address management
- Contact management
- Cascading geography selection
- Validation
- Permission visibility
- Loading/error states

## Negative scenarios

At minimum:

- Duplicate Party
- Invalid Party data
- Unauthorized Party creation
- Unauthorized Party update
- Invalid role assignment
- Duplicate role assignment
- Role removal with invalid dependencies
- Invalid geographic address
- Duplicate primary address
- Duplicate primary contact
- Invalid contact format
- Duplicate contact where uniqueness is required
- Update of stale Party record
- Attempt to use inactive Party
- Attempt to access deleted Party through normal lookup

### Tasks

**TASK-540 — Implement Party backend test suite**

**TASK-541 — Implement role-management test suite**

**TASK-542 — Implement Customer test suite**

**TASK-543 — Implement Supplier test suite**

**TASK-544 — Implement Doctor test suite**

**TASK-545 — Implement Employee test suite**

**TASK-546 — Implement PartyAddress test suite**

**TASK-547 — Implement PartyContact test suite**

**TASK-548 — Implement Party API integration tests**

**TASK-549 — Implement Party UI test suite**

**TASK-550 — Implement authorization test suite**

**TASK-551 — Implement duplicate/data-integrity test suite**

**TASK-552 — Implement SQLite integration tests**

**TASK-553 — Validate PostgreSQL compatibility**

---

# 24. Phase 3 Dependencies

## Depends On

```text
Phase 1 — Foundation & Architecture
Phase 2 — Organization, Geography & Configuration
```

Specifically:

### Phase 1

- Prisma
- Database migrations
- NestJS
- Angular/Electron
- Validation
- API standards
- Error handling
- Common UI
- Logging
- Testing
- CI/CD

### Phase 2

- Country
- State
- City
- Area
- Company
- Branch
- Configuration conventions

## Used By Later Phases

```text
Party
  ↓
Security/User
  ↓
Medicine
  ↓
Inventory
  ↓
Purchase
  ↓
Sales
  ↓
Prescription
  ↓
Financial
  ↓
Loyalty
```

More specifically:

```text
Supplier → Purchase
Customer → Sales
Doctor → Prescription
Employee → User/Security
PartyAddress → Customer/Supplier/Employee/Doctor
PartyContact → Customer/Supplier/Employee/Doctor
```

---

# 25. Party Data Flow

```text
                         ┌───────────────┐
                         │     Party     │
                         └───────┬───────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
        PartyRole          PartyAddress       PartyContact
              │
       ┌──────┼──────────────┬──────────────┐
       ▼      ▼              ▼              ▼
   Customer Supplier       Doctor        Employee
       │        │             │              │
       ▼        ▼             ▼              ▼
     Sales   Purchase    Prescription    Security/
                                         Operations
```

---

# 26. Important Party Design Principles

## Principle 1 — Party is the common identity

Do not duplicate common information across Customer, Supplier, Doctor, and Employee.

```text
Party
  ├── common identity
  ├── contacts
  ├── addresses
  └── roles
```

Role-specific tables contain only role-specific information.

## Principle 2 — Multiple roles must be supported

A party may potentially have multiple roles.

Example:

```text
Party #1001

Roles:
- Customer
- Supplier
```

The system must not create two Party records simply because the same entity has multiple business relationships.

## Principle 3 — PartyRole is not the same as system authorization

These are different concepts.

```text
Business Role:
Customer
Supplier
Doctor
Employee

Security Role:
Administrator
Pharmacist
Cashier
Manager
...
```

Security roles belong to Phase 4.

## Principle 4 — Historical references must survive lifecycle changes

Deactivating or soft-deleting a party must not destroy historical transactions.

For example:

```text
Supplier
   ↓
Purchase Invoice
   ↓
Historical transaction
```

The historical transaction must continue to reference the original Party.

---

# 27. Phase 3 Completion Checklist

- [ ] Party master implemented.
- [ ] Party registration implemented.
- [ ] Party search implemented.
- [ ] Party details implemented.
- [ ] Party update implemented.
- [ ] Party lifecycle implemented.
- [ ] Party soft delete/restore implemented.
- [ ] PartyRole implemented.
- [ ] Multiple roles supported.
- [ ] Customer implemented.
- [ ] Supplier implemented.
- [ ] Doctor implemented.
- [ ] Employee implemented.
- [ ] PartyAddress implemented.
- [ ] Multiple addresses supported.
- [ ] Primary address rules implemented.
- [ ] Geographic hierarchy integrated into addresses.
- [ ] PartyContact implemented.
- [ ] Multiple contacts supported.
- [ ] Primary contact rules implemented.
- [ ] Contact verification state implemented.
- [ ] Duplicate detection implemented.
- [ ] Data-integrity validation implemented.
- [ ] Reusable Party lookup implemented.
- [ ] Customer lookup implemented.
- [ ] Supplier lookup implemented.
- [ ] Doctor lookup implemented.
- [ ] Employee lookup implemented.
- [ ] Authorization boundaries implemented.
- [ ] Audit integration points implemented.
- [ ] Data exposure/privacy checks implemented.
- [ ] SQLite compatibility verified.
- [ ] PostgreSQL compatibility verified.
- [ ] Backend tests completed.
- [ ] API tests completed.
- [ ] UI tests completed.
- [ ] Authorization tests completed.
- [ ] Negative scenarios completed.
- [ ] Documentation updated.

---

# 28. Phase 3 Work Item Summary

| Type | Count |
|---|---:|
| Epic | 1 |
| Features | 13 |
| User Stories | 36 |
| Tasks | 273 |
| Total Work Items | 323 |

The task count is intentionally detailed to keep database, backend, UI, authorization, audit, data-quality, and testing responsibilities visible in ADO.

Tasks can be merged during sprint planning if the team prefers larger work items.

---

# 29. Phase Boundary

Phase 3 creates the reusable party foundation.

It does not implement:

```text
Customer
   ↓
Sales transactions
```

or:

```text
Supplier
   ↓
Purchase transactions
```

or:

```text
Doctor
   ↓
Prescription
```

Those workflows belong to later phases.

Phase 3 provides the master entities and reusable lookup capabilities required by them.

The intended dependency is:

```text
Phase 2
Organization + Geography
        ↓
Phase 3
Party Management
        ↓
Phase 4
User/Security
        ↓
Phase 5
Medicine
        ↓
Phase 6
Inventory
        ↓
Phase 7
Purchase
        ↓
Phase 8
Sales + Prescription
        ↓
Phase 9
Financial
```
