# Pharmacy ERP — Backend CRUD Foundation

## Purpose

This document defines the backend foundation to implement before building CRUD modules across the Pharmacy ERP.

The goal is to build common backend capabilities **once** and reuse them across simple master-data CRUD modules.

The project uses:

- NestJS backend
- Prisma ORM
- SQLite for development
- PostgreSQL for production

The database design also calls for soft delete, audit history, optimistic locking with `version`, BIGINT primary keys, UUID external references, and SQLite/PostgreSQL compatibility.

---

# 1. Backend Architecture

Recommended structure:

```text
src/
│
├── common/
│   ├── decorators/
│   ├── dto/
│   ├── enums/
│   ├── filters/
│   ├── interceptors/
│   ├── pipes/
│   ├── guards/
│   ├── exceptions/
│   ├── prisma/
│   ├── pagination/
│   ├── sorting/
│   ├── filtering/
│   ├── search/
│   └── audit/
│
├── modules/
│   ├── country/
│   ├── state/
│   ├── city/
│   ├── area/
│   ├── medicine/
│   └── ...
│
└── app.module.ts
```

The architecture should look like:

```text
                   COMMON CRUD FOUNDATION
                            │
          ┌─────────────────┼──────────────────┐
          ▼                 ▼                  ▼
       Country           Medicine           Supplier
          │                 │                  │
       Controller        Controller         Controller
       Service           Service            Service
       DTO               DTO                DTO
       Prisma            Prisma             Prisma
```

Common capabilities must not be reimplemented separately in every module.

---

# 2. Standard API Response

All APIs should use a consistent response structure.

## Single Object

```json
{
  "success": true,
  "data": {
    "id": 1001,
    "name": "ABC Pharmacy"
  }
}
```

## List

```json
{
  "success": true,
  "data": [
    {
      "id": 1001,
      "name": "ABC Pharmacy"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 125,
    "totalPages": 7
  }
}
```

## Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": [
      {
        "field": "name",
        "message": "Name is required"
      }
    ]
  }
}
```

## Rule

Never expose raw Prisma errors directly to Angular.

Use:

```text
Prisma Error
     ↓
Exception Mapper
     ↓
Business/API Error
     ↓
Angular
```

---

# 3. Validation

Use DTOs as the API boundary.

Example DTOs:

```text
CreateCountryDto
UpdateCountryDto
CountryQueryDto
```

Validation should cover:

- Required fields
- String length
- Numeric ranges
- Enum values
- UUID format
- Dates
- Email format
- Basic structural validation

Keep DTO validation separate from business validation.

Example:

```text
DTO validation
"country name must not be empty"

Business validation
"country code already exists"
```

Business rules belong in the service/domain layer.

---

# 4. Pagination

Standardize pagination for list APIs.

Example:

```http
GET /countries?page=1&pageSize=20
```

Response:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 245,
    "totalPages": 13
  }
}
```

Recommended initial limits:

```text
Default page size = 20
Maximum page size = 100
```

Prevent excessively large requests such as:

```text
?pageSize=1000000
```

Prisma implementation concept:

```text
skip = (page - 1) * pageSize
take = pageSize
```

The list query needs both:

```text
count()
findMany()
```

Use a transaction when appropriate.

---

# 5. Sorting

Standardize:

```http
GET /medicines?page=1&pageSize=20&sortBy=name&sortOrder=asc
```

Never pass an arbitrary client-supplied field directly into Prisma.

Instead, whitelist sortable fields.

Example:

```text
Medicine sortable fields:

id
name
code
createdAt
updatedAt
```

Flow:

```text
Requested field
      ↓
Whitelist
      ↓
Valid?
   ↙     ↘
 yes      no
 ↓         ↓
Prisma    400
```

This provides predictable API behavior and prevents unsafe dynamic query construction.

---

# 6. Filtering

Filtering should be standardized across CRUD modules.

Examples:

```http
GET /medicines?categoryId=10&manufacturerId=25&isActive=true
```

Date filtering:

```http
GET /medicines?createdFrom=2026-01-01&createdTo=2026-08-14
```

Supported operators can include:

```text
eq
neq
contains
startsWith
endsWith
gt
gte
lt
lte
in
between
```

Do not allow Angular to submit arbitrary Prisma `where` objects.

Use:

```text
Angular query
     ↓
Query DTO
     ↓
Filter parser
     ↓
Allowed fields/operators
     ↓
Prisma where
```

Each module should define which fields are filterable.

---

# 7. Search

Search is different from structured filtering.

Example:

```http
GET /medicines?search=paracetamol
```

Possible searchable fields:

```text
Medicine.name
Medicine.code
Medicine.genericName
```

Supplier example:

```http
GET /suppliers?search=apollo
```

Possible fields:

```text
Party.name
Party.code
PartyContact.phone
PartyContact.email
```

Define searchable fields per module.

Example configuration:

```text
Medicine
  searchableFields:
    name
    code

Supplier
  searchableFields:
    party.name
    party.code

Country
  searchableFields:
    name
    code
```

---

# 8. Soft Delete

The database design uses `deletedAt` for soft deletion.

For applicable master records:

```http
DELETE /countries/1001
```

should normally result in:

```text
deletedAt = current timestamp
```

rather than physically deleting the row.

Normal queries should exclude deleted records:

```text
WHERE deletedAt IS NULL
```

## Restore

Where restoration is appropriate:

```http
POST /countries/1001/restore
```

## Important

Do not automatically treat every table as a soft-delete CRUD table.

Examples requiring special treatment:

```text
AuditLog
ChangeHistory
StockMovement
LedgerEntry
```

These represent history, movement, or financial records and should be governed by business rules.

---

# 9. Audit Fields

Standard applicable entities should have a consistent audit model.

Candidate fields:

```text
id
externalId
createdAt
createdBy
updatedAt
updatedBy
deletedAt
deletedBy
version
```

The database design explicitly requires:

```text
createdAt
updatedAt
deletedAt
version
```

The exact creator/deleter fields should be finalized as a project decision before implementation.

Expected behavior:

```text
Create
 ↓
createdAt = now
createdBy = currentUser
version = 1

Update
 ↓
updatedAt = now
updatedBy = currentUser
version = version + 1

Delete
 ↓
deletedAt = now
deletedBy = currentUser
```

---

# 10. Optimistic Locking

The database design includes a `version` column for optimistic locking.

Example:

```text
User A opens Medicine
version = 5

User B opens Medicine
version = 5
```

User A updates:

```text
version 5 → 6
```

User B attempts to update using:

```text
expectedVersion = 5
```

Backend checks:

```text
Database version = 6
Expected version = 5
```

Reject with:

```text
CONCURRENT_MODIFICATION
```

Angular should then inform the user:

> This record was modified by another user. Please reload and try again.

This prevents silent overwriting of another user's changes.

---

# 11. Global Exception Handling

Use a global NestJS exception filter.

Flow:

```text
Controller
   ↓
Service
   ↓
Prisma
   ↓
Exception
   ↓
Global Exception Filter
   ↓
Standard API Error
```

Map common conditions to standard HTTP responses:

```text
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Validation / Business Validation
500 Internal Server Error
```

Use stable error codes such as:

```text
COUNTRY_NOT_FOUND
COUNTRY_CODE_EXISTS
MEDICINE_NOT_FOUND
DUPLICATE_MEDICINE_CODE
CONCURRENT_MODIFICATION
INVALID_REQUEST
```

Angular should rely on error codes for behavior rather than parsing human-readable messages.

---

# 12. Transaction Handling

Transactions are essential for ERP operations involving multiple related changes.

Simple CRUD may involve one operation:

```text
Create Medicine
    ↓
one DB operation
```

A business operation may involve multiple writes:

```text
Create Purchase
   ↓
Create Purchase Items
   ↓
Update Batch
   ↓
Update Stock
   ↓
Create Stock Movement
   ↓
Audit
```

These should eventually execute transactionally:

```text
BEGIN
   Purchase
   Items
   Stock
   Movement
   Audit
COMMIT
```

If any required operation fails:

```text
ROLLBACK
```

The transaction boundary should be owned by the service/use-case performing the business operation.

---

# 13. AuditLog vs Audit Fields vs ChangeHistory

These are different concepts.

## Audit fields

Answer:

```text
Who created this record?
When was it updated?
```

## AuditLog

Answers:

```text
Who performed an operation?
What operation?
Which entity?
Which record?
When?
```

## ChangeHistory

Can capture field-level changes.

Example:

```text
name:
    "Paracetamol 500"
        ↓
    "Paracetamol 500mg"
```

Keep these concepts separate.

---

# 14. ID Handling

The database standard specifies:

```text
BIGINT primary keys
UUID external references
```

Conceptually:

```text
id          BIGINT
externalId  UUID
```

Use BIGINT internally for database relationships.

Use UUID external references where APIs/integration boundaries require an identifier that should not expose sequential database IDs.

This keeps the Angular application less coupled to database implementation details.

---

# 15. Standard CRUD Service Pattern

A simple master module should follow a consistent pattern.

Example:

```text
CountryController
      │
      ▼
CountryService
      │
      ├── create()
      ├── findAll()
      ├── findOne()
      ├── update()
      ├── softDelete()
      └── restore()
             │
             ▼
       PrismaService
```

The module-specific service should focus on Country-specific business rules.

Common infrastructure should handle:

```text
Pagination
Sorting
Filtering
Search
Validation
Audit
Soft Delete
Errors
Transactions
```

---

# 16. Authorization Hook

The database architecture includes:

```text
User
 ↓
Role
 ↓
Permission
```

Build the authorization mechanism into the foundation, but keep the first implementation simple.

Example permissions:

```text
country.read
country.create
country.update
country.delete

medicine.read
medicine.create
medicine.update
medicine.delete
```

Standard mapping:

```text
GET     → *.read
POST    → *.create
PUT     → *.update
DELETE  → *.delete
```

The permission system should be reusable across modules.

---

# 17. Recommended CRUD Foundation Checklist

```text
BACKEND CRUD FOUNDATION

Core
├── Standard API response
├── Standard API error
├── Global exception handling
├── Request validation
├── Request ID / correlation ID
│
├── Pagination
├── Sorting
├── Filtering
├── Search
│
├── Soft delete
├── Restore
│
├── createdAt
├── updatedAt
├── createdBy
├── updatedBy
├── deletedAt
├── deletedBy
│
├── Optimistic locking / version
├── BIGINT / external UUID handling
│
├── AuditLog integration
├── ChangeHistory integration
│
├── Transaction support
└── Prisma error mapping
```

---

# 18. Implementation Order

Do not implement all capabilities randomly.

Recommended order:

```text
1. PrismaService / database access
        ↓
2. Standard API response
        ↓
3. Global exception handling
        ↓
4. DTO validation
        ↓
5. Pagination
        ↓
6. Sorting
        ↓
7. Filtering
        ↓
8. Search
        ↓
9. Soft delete
        ↓
10. Audit fields
        ↓
11. Optimistic locking
        ↓
12. Prisma error mapping
        ↓
13. Transaction support
        ↓
14. AuditLog / ChangeHistory
        ↓
15. Authorization
        ↓
16. First complete CRUD module
```

---

# 19. First CRUD Module

After the foundation is ready, implement one simple module end-to-end.

Recommended first example:

```text
Country
```

Implement:

```text
POST   /countries
GET    /countries
GET    /countries/:id
PUT    /countries/:id
DELETE /countries/:id
POST   /countries/:id/restore
```

And verify:

```text
Create
Read
Update
List
Pagination
Sorting
Filtering
Search
Soft Delete
Restore
Validation
Errors
Audit fields
Optimistic locking
```

Once Country works correctly, use it as the reference implementation for:

```text
State
City
Area
UnitOfMeasure
MedicineCategory
Manufacturer
Tax
...
```

---

# 20. Master vs Transactional CRUD

Do not force every database table into the same generic CRUD model.

## CRUD-first master/reference tables

Examples:

```text
Country
State
City
Area
Manufacturer
MedicineCategory
UnitOfMeasure
Tax
```

## CRUD + business rules

Examples:

```text
Party
Customer
Supplier
Doctor
Employee
Medicine
```

## Workflow-driven tables

Examples:

```text
PurchaseOrder
GoodsReceipt
PurchaseInvoice
Batch
Stock
SalesInvoice
Payment
Ledger
```

Workflow-driven entities should eventually be modified through business operations rather than arbitrary generic CRUD screens.

---

# 21. Development Strategy

Do not build 70 independent CRUD implementations from scratch.

Build:

```text
                 CRUD FOUNDATION
                       │
                       ▼
        ┌──────────────────────────┐
        │ Pagination               │
        │ Search                   │
        │ Filter                   │
        │ Sort                     │
        │ Validation               │
        │ Soft Delete              │
        │ Audit                    │
        │ Optimistic Locking       │
        │ Error Handling           │
        └────────────┬─────────────┘
                     │
                     ▼
              Country CRUD
                     │
                     ▼
                State CRUD
                     │
                     ▼
                 City CRUD
                     │
                     ▼
                 Area CRUD
                     │
                     ▼
              Medicine CRUD
                     │
                     ▼
              Supplier CRUD
                     │
                     ▼
                Customer CRUD
```

The objective is to solve each cross-cutting concern once and then reuse it.

---

# 22. Definition of Done — CRUD Foundation

The CRUD foundation is complete when:

- [ ] Standard API response format exists.
- [ ] Standard API error format exists.
- [ ] Global exception handling exists.
- [ ] DTO validation exists.
- [ ] Pagination is reusable.
- [ ] Sorting is reusable and whitelist-based.
- [ ] Filtering is reusable and whitelist-based.
- [ ] Search is reusable with per-entity configuration.
- [ ] Soft delete is implemented where applicable.
- [ ] Restore is supported where applicable.
- [ ] Audit timestamps are implemented.
- [ ] User audit fields are finalized and implemented.
- [ ] Optimistic locking using `version` works.
- [ ] BIGINT / UUID ID strategy is established.
- [ ] Prisma errors are mapped to stable API errors.
- [ ] Transaction support exists for multi-write operations.
- [ ] AuditLog integration is defined.
- [ ] ChangeHistory integration is defined.
- [ ] Authorization hooks exist.
- [ ] One complete reference CRUD module passes end-to-end testing.

---

# 23. Important Principle

The objective is **not** to build a huge generic framework.

The objective is:

> Build only enough reusable backend infrastructure so that implementing the next CRUD module becomes fast, predictable, and consistent.

The first successful module should become the reference pattern for subsequent master-data modules.
