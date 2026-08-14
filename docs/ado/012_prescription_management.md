# Phase 12 — Prescription Management

## 1. Purpose

Phase 12 implements the Pharmacy ERP Prescription domain.

The approved database overview places Prescription after Loyalty and defines the module as **Prescription management**, with:

```text
Prescription
PrescriptionItem
```

The database overview also identifies `Prescription` and `PrescriptionItem` as part of the core domain model. This phase therefore treats prescription management as its own domain capability while keeping Medicine, Party/Customer, Sales and Inventory responsibilities separate.

---

## 2. Scope

- Prescription domain and schema finalization
- Prescription creation
- Prescription reference generation
- Patient association
- Prescriber association
- Prescription item management
- Medicine master validation
- Dosage/frequency/duration capture
- Prescription lifecycle
- Finalization/cancellation/archive behavior
- Sales/dispensing integration
- Prescribed versus dispensed quantity tracking
- Partial dispensing
- Prescription history
- Prescription search
- Permissions
- Audit
- Sensitive-data protection
- Offline-first prescription workflows
- Outbox synchronization
- Idempotency
- Conflict handling
- Angular UI
- NestJS backend/API
- Unit/API/E2E/synchronization testing
- SQLite/PostgreSQL compatibility
- Performance and documentation

## 3. Domain Boundary

| Domain | Responsibility |
|---|---|
| Prescription | Prescription header/items, lifecycle and prescribing instructions |
| Party/Customer | Patient/customer identity and party information |
| Medicine | Medicine master identity and master attributes |
| Sales | Sales invoice and dispensing transaction ownership |
| Inventory | Batch, stock and inventory movement ownership |
| Pricing | Price, tax and discount calculation |
| Financial | Accounting/ledger posting |
| Synchronization | Outbox, SyncLog and conflict processing |
| Audit | AuditLog and ChangeHistory |

**Important:** Prescription should reference patient/customer and medicine records; it should not duplicate their master data.

## 4. Core Workflow

```text
Patient / Customer
       ↓
Prescription
       ↓
PrescriptionItem(s)
       ↓
Medicine Validation
       ↓
Prescription Finalization
       ↓
Sales / Dispensing
       ↓
Prescribed Quantity vs Dispensed Quantity
       ↓
Prescription History
```

Prescription owns the prescription. Sales owns the sale/dispensing transaction.

---

## 5. ADO Hierarchy

```text
EPIC-012 — Prescription Management
├── FEAT-167 — Prescription Domain & Data Model
├── FEAT-168 — Prescription Creation & Registration
├── FEAT-169 — Patient & Prescriber Association
├── FEAT-170 — Prescription Item Management
├── FEAT-171 — Medicine & Dosage Validation
├── FEAT-172 — Prescription Status & Lifecycle
├── FEAT-173 — Dispensing Workflow Integration
├── FEAT-174 — Prescription History & Search
├── FEAT-175 — Prescription Security, Audit & Compliance
├── FEAT-176 — Offline Synchronization & Conflict Handling
└── FEAT-177 — Prescription UI, Testing & Performance
```

# 6. EPIC-012 — Prescription Management

## Objective

Provide a controlled prescription workflow from creation through finalization and dispensing, while preserving prescription history and preventing invalid dispensing.

## Epic Definition of Done
- [ ] Prescription and PrescriptionItem schemas are finalized and implemented.
- [ ] Prescription records can be created and referenced uniquely.
- [ ] Patients and prescribers are associated using approved domain references.
- [ ] Prescription items reference valid Medicine master records.
- [ ] Dosage, frequency, duration and quantity validations are enforced.
- [ ] Prescription lifecycle transitions are explicit and server-side validated.
- [ ] Sales can consume applicable prescriptions without taking ownership of prescription data.
- [ ] Partial dispensing and prescribed-versus-dispensed quantities are handled correctly.
- [ ] Historical finalized prescriptions are not destructively overwritten.
- [ ] Prescription search/history is performant.
- [ ] Sensitive prescription information is protected by permissions.
- [ ] Prescription mutations are auditable where required.
- [ ] Offline workflows are supported through the local database and Outbox.
- [ ] Synchronization is idempotent and conflict-safe.
- [ ] Angular workflows are keyboard-first.
- [ ] Unit/API/E2E/synchronization tests pass.
- [ ] SQLite and PostgreSQL behavior is validated.

# FEAT-167 — Prescription Domain & Data Model

## US-463 — Finalize Prescription domain boundaries and schema

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid prescription operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Historical records are protected from unsafe destructive changes.
- Duplicate/retry behavior is deterministic where synchronization is involved.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Confirm Prescription owns prescription records and prescription items only
- [ ] Confirm Customer/Party remains the owner of patient identity where applicable
- [ ] Confirm Medicine remains the owner of medicine master data
- [ ] Confirm Sales remains the owner of dispensing/sales transactions
- [ ] Define UUID and primary-key strategy
- [ ] Define soft-delete and historical-record rules
- [ ] Review source requirements and confirm the story remains within Prescription ownership
- [ ] Define business rules, validation rules and failure scenarios
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Define audit behavior where applicable
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

## US-464 — Define Prescription lifecycle and ownership rules

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid prescription operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Historical records are protected from unsafe destructive changes.
- Duplicate/retry behavior is deterministic where synchronization is involved.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Define draft/active/completed/cancelled/archived states only if supported by the approved workflow
- [ ] Define who can create, edit, finalize and cancel a prescription
- [ ] Define whether finalized prescriptions become immutable
- [ ] Define prescription date and validity semantics
- [ ] Review source requirements and confirm the story remains within Prescription ownership
- [ ] Define business rules, validation rules and failure scenarios
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Define audit behavior where applicable
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

## US-465 — Define PrescriptionItem structure and validation rules

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid prescription operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Historical records are protected from unsafe destructive changes.
- Duplicate/retry behavior is deterministic where synchronization is involved.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Define PrescriptionItem relationship to Prescription
- [ ] Define medicine reference strategy
- [ ] Define quantity, dosage, frequency, duration and instruction fields supported by the domain
- [ ] Define item ordering and uniqueness rules
- [ ] Define item lifecycle and historical behavior
- [ ] Review source requirements and confirm the story remains within Prescription ownership
- [ ] Define business rules, validation rules and failure scenarios
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Define audit behavior where applicable
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

# FEAT-168 — Prescription Creation & Registration

## US-466 — Create prescription entry workflow

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid prescription operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Historical records are protected from unsafe destructive changes.
- Duplicate/retry behavior is deterministic where synchronization is involved.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Create prescription entry screen
- [ ] Create patient lookup
- [ ] Create prescriber lookup
- [ ] Allow adding medicine items
- [ ] Validate mandatory fields before save
- [ ] Support save draft if the finalized workflow allows drafts
- [ ] Review source requirements and confirm the story remains within Prescription ownership
- [ ] Define business rules, validation rules and failure scenarios
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Define audit behavior where applicable
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

## US-467 — Generate and maintain prescription reference

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid prescription operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Historical records are protected from unsafe destructive changes.
- Duplicate/retry behavior is deterministic where synchronization is involved.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Define human-readable prescription reference format
- [ ] Ensure reference uniqueness
- [ ] Define generation timing
- [ ] Prevent reference duplication during retries
- [ ] Review source requirements and confirm the story remains within Prescription ownership
- [ ] Define business rules, validation rules and failure scenarios
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Define audit behavior where applicable
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

# FEAT-169 — Patient & Prescriber Association

## US-468 — Associate prescription with patient/customer

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid prescription operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Historical records are protected from unsafe destructive changes.
- Duplicate/retry behavior is deterministic where synchronization is involved.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Search/select patient from approved Party/Customer model
- [ ] Prevent ambiguous patient selection
- [ ] Store only the required patient reference
- [ ] Validate patient status according to approved rules
- [ ] Review source requirements and confirm the story remains within Prescription ownership
- [ ] Define business rules, validation rules and failure scenarios
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Define audit behavior where applicable
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

## US-469 — Associate prescription with prescriber

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid prescription operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Historical records are protected from unsafe destructive changes.
- Duplicate/retry behavior is deterministic where synchronization is involved.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Search/select prescriber using approved Party/employee/provider model
- [ ] Define required prescriber information
- [ ] Prevent ambiguous prescriber selection
- [ ] Validate prescriber status according to approved rules
- [ ] Review source requirements and confirm the story remains within Prescription ownership
- [ ] Define business rules, validation rules and failure scenarios
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Define audit behavior where applicable
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

## US-470 — Validate patient and prescriber eligibility

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid prescription operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Historical records are protected from unsafe destructive changes.
- Duplicate/retry behavior is deterministic where synchronization is involved.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Validate patient exists
- [ ] Validate prescriber exists
- [ ] Validate required roles/statuses
- [ ] Reject invalid associations before prescription finalization
- [ ] Review source requirements and confirm the story remains within Prescription ownership
- [ ] Define business rules, validation rules and failure scenarios
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Define audit behavior where applicable
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

# FEAT-170 — Prescription Item Management

## US-471 — Add and edit prescription medicines

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid prescription operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Historical records are protected from unsafe destructive changes.
- Duplicate/retry behavior is deterministic where synchronization is involved.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Search medicine master
- [ ] Add multiple prescription items
- [ ] Edit item details
- [ ] Remove items only while permitted by lifecycle
- [ ] Prevent duplicate/ambiguous medicine selection
- [ ] Review source requirements and confirm the story remains within Prescription ownership
- [ ] Define business rules, validation rules and failure scenarios
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Define audit behavior where applicable
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

## US-472 — Capture dosage, frequency and duration

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid prescription operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Historical records are protected from unsafe destructive changes.
- Duplicate/retry behavior is deterministic where synchronization is involved.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Capture dosage instructions
- [ ] Capture frequency
- [ ] Capture duration
- [ ] Capture prescribed quantity
- [ ] Support free-text instructions only where explicitly required
- [ ] Validate numeric and date/period values
- [ ] Review source requirements and confirm the story remains within Prescription ownership
- [ ] Define business rules, validation rules and failure scenarios
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Define audit behavior where applicable
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

## US-473 — Validate prescription item completeness

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid prescription operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Historical records are protected from unsafe destructive changes.
- Duplicate/retry behavior is deterministic where synchronization is involved.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Identify mandatory item fields
- [ ] Reject incomplete items before finalization
- [ ] Validate quantity and duration consistency
- [ ] Display actionable UI validation messages
- [ ] Review source requirements and confirm the story remains within Prescription ownership
- [ ] Define business rules, validation rules and failure scenarios
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Define audit behavior where applicable
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

# FEAT-171 — Medicine & Dosage Validation

## US-474 — Resolve prescribed medicine against Medicine master

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid prescription operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Historical records are protected from unsafe destructive changes.
- Duplicate/retry behavior is deterministic where synchronization is involved.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Resolve medicine by stable identifier
- [ ] Prevent free-text medicine from bypassing master validation
- [ ] Validate medicine is active/usable where required
- [ ] Preserve historical medicine reference for finalized prescriptions
- [ ] Review source requirements and confirm the story remains within Prescription ownership
- [ ] Define business rules, validation rules and failure scenarios
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Define audit behavior where applicable
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

## US-475 — Validate dosage and quantity constraints

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid prescription operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Historical records are protected from unsafe destructive changes.
- Duplicate/retry behavior is deterministic where synchronization is involved.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Validate positive quantity
- [ ] Validate supported dosage/frequency format
- [ ] Validate duration
- [ ] Validate quantity against configured business rules
- [ ] Test boundary and invalid values
- [ ] Review source requirements and confirm the story remains within Prescription ownership
- [ ] Define business rules, validation rules and failure scenarios
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Define audit behavior where applicable
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

## US-476 — Handle invalid, inactive or unavailable medicine references

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid prescription operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Historical records are protected from unsafe destructive changes.
- Duplicate/retry behavior is deterministic where synchronization is involved.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Define behavior for inactive medicines
- [ ] Define behavior for discontinued medicines
- [ ] Define behavior when a medicine is missing after synchronization
- [ ] Prevent invalid dispensing while preserving historical prescription data
- [ ] Review source requirements and confirm the story remains within Prescription ownership
- [ ] Define business rules, validation rules and failure scenarios
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Define audit behavior where applicable
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

# FEAT-172 — Prescription Status & Lifecycle

## US-477 — Implement prescription status lifecycle

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid prescription operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Historical records are protected from unsafe destructive changes.
- Duplicate/retry behavior is deterministic where synchronization is involved.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Define allowed state transitions
- [ ] Implement transition validation
- [ ] Record transition actor/time where required
- [ ] Ensure status changes are atomic
- [ ] Review source requirements and confirm the story remains within Prescription ownership
- [ ] Define business rules, validation rules and failure scenarios
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Define audit behavior where applicable
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

## US-478 — Prevent invalid prescription state transitions

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid prescription operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Historical records are protected from unsafe destructive changes.
- Duplicate/retry behavior is deterministic where synchronization is involved.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Create explicit transition matrix
- [ ] Reject illegal transitions server-side
- [ ] Prevent UI-only state enforcement
- [ ] Test concurrent status changes
- [ ] Review source requirements and confirm the story remains within Prescription ownership
- [ ] Define business rules, validation rules and failure scenarios
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Define audit behavior where applicable
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

## US-479 — Close, cancel and archive prescriptions safely

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid prescription operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Historical records are protected from unsafe destructive changes.
- Duplicate/retry behavior is deterministic where synchronization is involved.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Define cancellation reason requirements
- [ ] Prevent destructive deletion of finalized prescription history
- [ ] Define archive behavior
- [ ] Ensure downstream dispensing references remain consistent
- [ ] Review source requirements and confirm the story remains within Prescription ownership
- [ ] Define business rules, validation rules and failure scenarios
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Define audit behavior where applicable
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

# FEAT-173 — Dispensing Workflow Integration

## US-480 — Link prescription to Sales/dispensing workflow

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid prescription operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Historical records are protected from unsafe destructive changes.
- Duplicate/retry behavior is deterministic where synchronization is involved.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Define the integration point between Prescription and Sales
- [ ] Allow Sales to identify an applicable prescription
- [ ] Validate prescription status before dispensing
- [ ] Persist prescription reference on the dispensing transaction where supported
- [ ] Review source requirements and confirm the story remains within Prescription ownership
- [ ] Define business rules, validation rules and failure scenarios
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Define audit behavior where applicable
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

## US-481 — Track prescribed versus dispensed quantities

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid prescription operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Historical records are protected from unsafe destructive changes.
- Duplicate/retry behavior is deterministic where synchronization is involved.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Track prescribed quantity
- [ ] Track dispensed quantity
- [ ] Calculate remaining quantity where the business model supports it
- [ ] Prevent remaining quantity from becoming invalid
- [ ] Handle partial dispensing
- [ ] Review source requirements and confirm the story remains within Prescription ownership
- [ ] Define business rules, validation rules and failure scenarios
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Define audit behavior where applicable
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

## US-482 — Prevent invalid dispensing against prescription

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid prescription operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Historical records are protected from unsafe destructive changes.
- Duplicate/retry behavior is deterministic where synchronization is involved.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Reject dispensing against invalid/cancelled prescription
- [ ] Validate medicine matches prescribed medicine
- [ ] Validate quantity
- [ ] Define behavior for substitutions if permitted
- [ ] Protect against concurrent over-dispensing
- [ ] Review source requirements and confirm the story remains within Prescription ownership
- [ ] Define business rules, validation rules and failure scenarios
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Define audit behavior where applicable
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

# FEAT-174 — Prescription History & Search

## US-483 — Search prescriptions by patient and reference

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid prescription operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Historical records are protected from unsafe destructive changes.
- Duplicate/retry behavior is deterministic where synchronization is involved.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Search by prescription reference
- [ ] Search by patient
- [ ] Support partial/keyword search where appropriate
- [ ] Add pagination
- [ ] Optimize common lookup queries
- [ ] Review source requirements and confirm the story remains within Prescription ownership
- [ ] Define business rules, validation rules and failure scenarios
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Define audit behavior where applicable
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

## US-484 — Search prescriptions by prescriber and date

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid prescription operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Historical records are protected from unsafe destructive changes.
- Duplicate/retry behavior is deterministic where synchronization is involved.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Filter by prescriber
- [ ] Filter by prescription date
- [ ] Filter by status
- [ ] Support date range search
- [ ] Add appropriate indexes
- [ ] Review source requirements and confirm the story remains within Prescription ownership
- [ ] Define business rules, validation rules and failure scenarios
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Define audit behavior where applicable
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

## US-485 — View prescription and dispensing history

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid prescription operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Historical records are protected from unsafe destructive changes.
- Duplicate/retry behavior is deterministic where synchronization is involved.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Display prescription header
- [ ] Display prescription items
- [ ] Display status history where supported
- [ ] Display dispensing linkage/history
- [ ] Protect sensitive data according to permissions
- [ ] Review source requirements and confirm the story remains within Prescription ownership
- [ ] Define business rules, validation rules and failure scenarios
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Define audit behavior where applicable
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

# FEAT-175 — Prescription Security, Audit & Compliance

## US-486 — Implement prescription permissions

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid prescription operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Historical records are protected from unsafe destructive changes.
- Duplicate/retry behavior is deterministic where synchronization is involved.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Define permission matrix
- [ ] Protect prescription creation
- [ ] Protect prescription editing/finalization
- [ ] Protect cancellation
- [ ] Protect dispensing linkage
- [ ] Review source requirements and confirm the story remains within Prescription ownership
- [ ] Define business rules, validation rules and failure scenarios
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Define audit behavior where applicable
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

## US-487 — Implement prescription audit events

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid prescription operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Historical records are protected from unsafe destructive changes.
- Duplicate/retry behavior is deterministic where synchronization is involved.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Audit prescription creation
- [ ] Audit important updates
- [ ] Audit finalization/cancellation
- [ ] Audit sensitive access where required
- [ ] Audit dispensing-related changes
- [ ] Review source requirements and confirm the story remains within Prescription ownership
- [ ] Define business rules, validation rules and failure scenarios
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Define audit behavior where applicable
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

## US-488 — Protect sensitive prescription information in UI and API

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid prescription operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Historical records are protected from unsafe destructive changes.
- Duplicate/retry behavior is deterministic where synchronization is involved.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Restrict sensitive fields by role
- [ ] Prevent unauthorized API access
- [ ] Do not expose unnecessary prescription information in list responses
- [ ] Validate authorization on direct record access
- [ ] Review source requirements and confirm the story remains within Prescription ownership
- [ ] Define business rules, validation rules and failure scenarios
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Define audit behavior where applicable
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

# FEAT-176 — Offline Synchronization & Conflict Handling

## US-489 — Support offline prescription creation and updates

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid prescription operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Historical records are protected from unsafe destructive changes.
- Duplicate/retry behavior is deterministic where synchronization is involved.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Persist prescription mutations locally
- [ ] Allow authorized prescription workflows without cloud connectivity
- [ ] Create Outbox records transactionally
- [ ] Handle application restart safely
- [ ] Review source requirements and confirm the story remains within Prescription ownership
- [ ] Define business rules, validation rules and failure scenarios
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Define audit behavior where applicable
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

## US-490 — Synchronize prescriptions using Outbox and idempotency

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid prescription operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Historical records are protected from unsafe destructive changes.
- Duplicate/retry behavior is deterministic where synchronization is involved.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Define synchronization payload
- [ ] Synchronize prescription and item changes
- [ ] Use UUID/idempotency strategy
- [ ] Prevent duplicate prescription creation
- [ ] Retry failed synchronization safely
- [ ] Review source requirements and confirm the story remains within Prescription ownership
- [ ] Define business rules, validation rules and failure scenarios
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Define audit behavior where applicable
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

## US-491 — Handle prescription synchronization conflicts

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid prescription operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Historical records are protected from unsafe destructive changes.
- Duplicate/retry behavior is deterministic where synchronization is involved.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Define conflict rules for prescription master/reference data
- [ ] Protect finalized prescription history from unsafe overwrite
- [ ] Record unresolved conflicts
- [ ] Provide controlled resolution behavior
- [ ] Test replay and concurrent edits
- [ ] Review source requirements and confirm the story remains within Prescription ownership
- [ ] Define business rules, validation rules and failure scenarios
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Define audit behavior where applicable
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

# FEAT-177 — Prescription UI, Testing & Performance

## US-492 — Create prescription management UI

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid prescription operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Historical records are protected from unsafe destructive changes.
- Duplicate/retry behavior is deterministic where synchronization is involved.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Create prescription list/search UI
- [ ] Create add prescription workflow
- [ ] Create prescription detail screen
- [ ] Create item entry grid/form
- [ ] Add keyboard-first navigation
- [ ] Add validation and status actions
- [ ] Review source requirements and confirm the story remains within Prescription ownership
- [ ] Define business rules, validation rules and failure scenarios
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Define audit behavior where applicable
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

## US-493 — Create prescription history/search UI

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid prescription operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Historical records are protected from unsafe destructive changes.
- Duplicate/retry behavior is deterministic where synchronization is involved.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Create patient prescription history
- [ ] Create prescriber/date/status filters
- [ ] Show prescription detail
- [ ] Show dispensing status/history
- [ ] Support pagination and responsive loading
- [ ] Review source requirements and confirm the story remains within Prescription ownership
- [ ] Define business rules, validation rules and failure scenarios
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Define audit behavior where applicable
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

## US-494 — Complete prescription testing, performance and documentation

### Acceptance Criteria

- Business rules are enforced in the backend/domain service.
- Invalid prescription operations return explicit validation/business errors.
- Applicable permissions are checked server-side.
- Historical records are protected from unsafe destructive changes.
- Duplicate/retry behavior is deterministic where synchronization is involved.
- Automated tests cover success and failure paths.

### Tasks

- [ ] Test prescription lifecycle
- [ ] Test patient/prescriber associations
- [ ] Test item validation
- [ ] Test Sales dispensing integration
- [ ] Test partial dispensing
- [ ] Test cancellation and invalid transitions
- [ ] Test offline and synchronization scenarios
- [ ] Benchmark common search and detail queries
- [ ] Review indexes and query plans
- [ ] Document operational troubleshooting
- [ ] Review source requirements and confirm the story remains within Prescription ownership
- [ ] Define business rules, validation rules and failure scenarios
- [ ] Define DTO/request/response contract
- [ ] Implement NestJS service-layer logic
- [ ] Implement repository/query layer
- [ ] Implement API endpoint(s)
- [ ] Add server-side authorization checks
- [ ] Define audit behavior where applicable
- [ ] Add unit tests
- [ ] Add API/integration tests
- [ ] Add end-to-end workflow tests
- [ ] Validate SQLite behavior
- [ ] Validate PostgreSQL compatibility
- [ ] Update technical documentation

---

# 7. Core Prescription Business Rules

### 7.1 Prescription owns prescribing information
Prescription should own the prescription and its items. Patient/customer identity, medicine master data and sales/dispensing transactions remain owned by their respective domains.

### 7.2 Finalized history must be protected
Once a prescription reaches a finalized state, changes must follow an explicit correction/amendment policy rather than silently changing historical data.

### 7.3 Medicine must be validated against Medicine master
PrescriptionItem should reference a valid medicine identity. Free-text medicine descriptions must not bypass master-data validation unless explicitly required by the approved business model.

### 7.4 Dispensing must not exceed permitted prescription quantity
Where prescription quantity limits apply, the system must prevent cumulative dispensing from exceeding the permitted quantity.

### 7.5 Partial dispensing must be supported where required
A prescription may be dispensed in multiple Sales transactions when the business workflow permits it. Remaining quantity must be calculated consistently.

### 7.6 Prescription status must control downstream operations
Cancelled, expired or otherwise ineligible prescriptions must not be accepted for dispensing where the finalized business rules prohibit it.

### 7.7 Corrections must be traceable
Changes to important prescription information after creation/finalization must be controlled and auditable rather than performed through uncontrolled database updates.

---

# 8. Sales / Dispensing Integration

```text
Prescription
     │
     ├── Patient
     ├── Prescriber
     └── PrescriptionItem
              │
              ▼
        Sales / Dispensing
              │
       ┌──────┴─────────┐
       ▼                ▼
  Prescribed Qty    Dispensed Qty
       │                │
       └───────┬────────┘
               ▼
         Remaining Qty
```

Sales remains responsible for the sale and stock movement. Prescription provides the prescribing context and validates whether the intended dispensing operation is permitted.

---

# 9. Offline & Synchronization

The ERP architecture uses local SQLite for day-to-day offline operation and Outbox-based background synchronization. Prescription workflows must follow the same architecture rather than requiring continuous cloud connectivity.

```text
Angular
   ↓
NestJS Prescription Service
   ↓
SQLite
   ↓
Outbox
   ↓
Cloud Synchronization
   ↓
PostgreSQL
```

- Prescription mutations must be persisted locally before synchronization.
- Prescription and PrescriptionItem changes must synchronize consistently.
- UUID/idempotency mechanisms must prevent duplicate records during retries.
- Finalized prescription history must not be overwritten by stale synchronization data.
- Synchronization conflicts must be explicit and resolvable.

# 10. UI Standards

- Prescription entry should be optimized for fast pharmacy workflow.
- Patient and prescriber selection should use searchable master-data lookup.
- Medicine selection should use Medicine master search rather than uncontrolled free text.
- Prescription item entry should support efficient keyboard navigation.
- Validation errors should appear close to the relevant field/item.
- Status actions should only be displayed when permitted.
- Prescription history should support patient, prescriber, date and status filters.
- Dispensing UI should clearly show prescribed, dispensed and remaining quantities.
- Sensitive information should not be unnecessarily exposed in list screens.

# 11. Testing Matrix

| Area | Required coverage |
|---|---|
| Prescription | Create, edit, reference, lifecycle |
| Patient | Association, invalid patient, status |
| Prescriber | Association, invalid prescriber, status |
| PrescriptionItem | Medicine lookup, dosage, quantity, completeness |
| Lifecycle | Valid/invalid transitions, cancellation, archive |
| Dispensing | Full, partial, over-dispensing, invalid prescription |
| History | Search, filters, detail, pagination |
| Security | Permission boundaries and sensitive data |
| Audit | Creation, important changes, lifecycle, dispensing linkage |
| Offline | Local creation/update, Outbox, retry |
| Sync | Idempotency, replay, conflict, stale update |
| Database | SQLite/PostgreSQL |
| Performance | Search, detail and dispensing validation |

# 12. Definition of Done
- [ ] Prescription and PrescriptionItem are implemented according to finalized schema decisions.
- [ ] Prescription references valid patient/customer and prescriber records.
- [ ] Prescription items reference valid Medicine records.
- [ ] Dosage, frequency, duration and quantity rules are enforced.
- [ ] Prescription lifecycle transitions are explicitly validated.
- [ ] Sales can identify and validate applicable prescriptions.
- [ ] Partial dispensing is correctly supported where required.
- [ ] Over-dispensing is prevented.
- [ ] Prescription history remains traceable.
- [ ] Sensitive prescription information is permission protected.
- [ ] Important prescription operations are audited.
- [ ] Offline operation works correctly.
- [ ] Outbox synchronization is retry-safe and idempotent.
- [ ] Conflict handling is documented and tested.
- [ ] Angular workflows are keyboard-first and efficient.
- [ ] Unit/API/E2E/synchronization tests pass.
- [ ] SQLite and PostgreSQL compatibility is verified.
- [ ] Performance is measured for common search and validation paths.
- [ ] Documentation is complete.

# 13. Phase 12 Summary

| Type | Count |
|---|---:|
| Epic | 1 |
| Features | 11 |
| User Stories | 32 |
| Tasks | 603 |
| **Total Work Items** | **647** |

# 14. Source Boundary

The approved database overview identifies the Prescription module as **Prescription management** and defines `Prescription` and `PrescriptionItem` as its core tables. This phase follows that terminology and does not introduce unsupported additional prescription tables as approved schema.

The retrieved source material does not provide sufficient field-level detail for the two tables to safely invent final column definitions. Therefore schema-finalization stories are intentionally included before implementation.

Where this backlog discusses patient/customer, prescriber, medicine and dispensing integration, these are treated as domain relationships and workflow boundaries; detailed fields and exact integration contracts must be finalized from the corresponding approved module definitions before implementation.