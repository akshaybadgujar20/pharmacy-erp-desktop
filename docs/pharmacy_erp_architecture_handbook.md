# Pharmacy ERP System Design Document
**Version:** 1.0  
**Status:** Living Architecture Document  
**Author:** Your Engineering Team  
**Technology Stack:**
- Electron.js
- Angular
- NestJS
- Prisma ORM
- SQLite (Local)
- Spring Boot (Central Server)
- PostgreSQL (Cloud Database)

---

# Table of Contents

1. Vision & Product Philosophy
2. Design Principles
3. Overall System Architecture
4. Technology Stack
5. High Level Architecture
6. Module Architecture
7. Folder Structure
8. Electron Architecture
9. Angular Architecture
10. NestJS Architecture
11. Database Design
12. Prisma ORM
13. Authentication & Authorization
14. Offline First Architecture
15. Synchronization Strategy
16. Conflict Resolution
17. Event Driven Architecture
18. Service Layer Design
19. API Design Standards
20. Domain Driven Design
21. UX & Product Guidelines
22. Keyboard First Philosophy
23. Workflow Driven UI
24. Configuration Driven Development
25. Performance Guidelines
26. Hardware Integration
27. Printing Architecture
28. Barcode Integration
29. Reporting Engine
30. Audit Logging
31. Error Handling
32. Backup & Recovery
33. Security Guidelines
34. Coding Standards
35. Testing Strategy
36. CI/CD Strategy
37. Observability
38. Telemetry & Analytics
39. Feature Flags
40. Multi Store Architecture
41. Migration Strategy
42. Localization
43. Disaster Recovery
44. Future Roadmap
45. Engineering Checklist

---

# 1. Vision & Product Philosophy

## Goal

Build a **fast, reliable, offline-first Pharmacy ERP** that pharmacists enjoy using.

The software should disappear into the workflow.

Users should think about medicines—not software.

### Product Goals

- Fast
- Reliable
- Offline First
- Secure
- Easy to Learn
- Keyboard Friendly
- Extensible
- Multi Store Ready

---

# 2. Design Principles

## Principle 1
### Simplicity

Simple code lasts longer.

Avoid unnecessary abstraction.

---

## Principle 2
### Modularity

Every business domain lives independently.

Examples:

- Inventory
- Sales
- Purchase
- Supplier
- Reports
- Users
- Billing

Never mix business logic.

---

## Principle 3
### Single Responsibility

Each class should have only one responsibility.

Bad

```
SalesService
    Save Sale
    Print Invoice
    Send SMS
    Sync Data
```

Good

```
SalesService
InvoiceService
PrinterService
SMSService
SyncService
```

---

## Principle 4
### Offline First

The application should never depend on internet availability.

Internet is an enhancement—not a requirement.

---

## Principle 5
### Performance First

Every screen should feel instant.

Targets

- Medicine Search < 200ms
- Invoice Save < 500ms
- Barcode Scan < 100ms

---

# 3. Overall Architecture

```
                 Cloud

         Spring Boot API
                │
          PostgreSQL
                ▲
                │
        Delta Synchronization
                │

────────────────────────────────

         Local Machine

        Electron Desktop
               │
        Angular Frontend
               │
        IPC (Context Bridge)
               │
         NestJS Backend
               │
            Prisma ORM
               │
            SQLite DB

```

---

# 4. Technology Stack

## Desktop

Electron

Reason

- Native Desktop
- Printing
- File System
- Auto Updates
- Barcode
- Hardware Access

---

## Frontend

Angular

Reason

- Enterprise Ready
- TypeScript
- Dependency Injection
- Lazy Loading
- Strong Ecosystem

---

## Backend

NestJS

Reason

Very similar to Spring Boot

Provides

- Controllers
- Services
- Modules
- Guards
- Pipes
- Interceptors

---

## ORM

Prisma

Advantages

- Type Safe
- Modern
- Excellent Migration Support
- Fast Development
- Great Developer Experience

---

## Local Database

SQLite

Advantages

- Zero Configuration
- Fast
- Stable
- Single File
- Perfect Offline Database

---

## Cloud

Spring Boot

Reasons

- Existing Experience
- Excellent Enterprise Support
- Security
- Scalability

---

# 5. Module Architecture

Each module owns its business.

Example

```
Sales Module

Controller

↓

Service

↓

Repository (Prisma)

↓

Database

```

Modules

- Dashboard
- Sales
- Purchase
- Inventory
- Customer
- Supplier
- Accounts
- Reports
- Users
- Settings
- Synchronization

---

# 6. Electron Architecture

Renderer

Runs Angular

Never expose Node directly.

Main Process

Responsible for

- Printing
- File System
- Window Management
- Auto Updates

Use **Context Isolation** and a **Preload Script** with `contextBridge` to expose only the APIs Angular needs.

---

# 7. Angular Architecture

Use feature modules.

Example

```
sales/

purchase/

inventory/

customer/

supplier/

reports/

shared/

core/

```

Never place business logic inside components.

Components → Services → Backend

---

# 8. NestJS Architecture

Structure

```
Controller

↓

DTO

↓

Validation

↓

Service

↓

Prisma

↓

SQLite

```

Keep:

- Controllers thin
- Services rich
- DTOs validated
- Business rules in services

---

# 9. Database Design

Use normalized tables.

Avoid duplicated data.

Core Tables

- Medicine
- Batch
- Supplier
- Customer
- Purchase
- Sales
- Inventory
- User
- Roles
- Audit
- SyncLog
- Outbox

---

# 10. Prisma ORM

Benefits

- Auto-generated TypeScript client
- Compile-time type safety
- Schema-first modelling
- Easy migrations
- Excellent IDE support

Use migrations for all schema changes.

---

# 11. Authentication

Use JWT between Angular and NestJS.

Roles

- Admin
- Pharmacist
- Cashier
- Manager

Permissions should always be checked in the backend, never only in the UI.

---

# 12. Offline First

The local database is the **source of truth** during daily operation.

Users should never know whether the internet is available.

---

# 13. Synchronization Strategy

## Delta Sync

Send only changed records.

Never upload the whole database.

---

## Push

Local → Cloud

---

## Pull

Cloud → Local

---

## Background Sync

Runs

- App Start
- Every few minutes
- Manual Sync
- Network Reconnect

---

## Outbox Pattern

Every change is recorded in an Outbox table.

Background worker processes:

1. Read outbox
2. Send to server
3. Mark success
4. Retry failures

This guarantees reliable delivery even after crashes.

---

## Idempotency

Every transaction gets a unique UUID.

If the same request is received twice, the server safely ignores duplicates.

---

## Conflict Resolution

Different entities require different rules.

Examples:

- Inventory → Transaction-based, never overwrite stock.
- Customer details → Last write wins may be acceptable.
- Medicine master → Prefer server authority.

Keep version numbers or timestamps for conflict detection.

---

# 14. Event Driven Architecture

Example events

- SaleCompleted
- StockUpdated
- InvoicePrinted
- SyncFinished
- PurchaseReceived

Modules subscribe instead of directly calling each other.

Benefits

- Loose coupling
- Easier testing
- Future extensibility

---

# 15. API Design

Use REST consistently.

Example

```
GET    /sales
POST   /sales
PUT    /sales/{id}
DELETE /sales/{id}
```

Return standard error structures.

Version APIs when needed.

---

# 16. Domain Driven Design

Bounded contexts

- Sales
- Purchase
- Inventory
- Billing
- Reporting

Avoid sharing internal logic between domains.

Communicate through services or events.

---

# 17. UX Guidelines

The ERP should optimize the pharmacist's workflow, not showcase technology.

### Goals

- Minimum clicks
- Large touch targets where appropriate
- Consistent layouts
- Clear feedback
- Fast search
- Helpful validation
- Undo where possible

---

# 18. Keyboard First Philosophy

Everything should work without a mouse.

Examples

- F2 → New Sale
- F4 → Search Medicine
- F8 → Payment
- Ctrl+S → Save
- Esc → Cancel

Benefits

- Faster billing
- Less fatigue
- Better productivity

---

# 19. Workflow Driven UI

Design screens around real work.

Cashier Flow

```
Search
↓

Select Medicine

↓

Quantity

↓

Payment

↓

Print

↓

Next Customer

```

Avoid making users jump across unrelated menus.

---

# 20. Configuration Driven Development

Do not hardcode:

- GST rates
- Invoice templates
- Barcode formats
- Printer mappings
- Store settings
- Permissions

Store these in configuration tables.

---

# 21. Performance Guidelines

Targets

- Search < 200 ms
- Open screen < 500 ms
- Invoice print < 2 s
- Startup < 5 s

Use background workers for long-running tasks.

---

# 22. Hardware Integration

Abstract hardware behind interfaces.

Examples

- PrinterService
- BarcodeScannerService
- PaymentGatewayService

This allows easy replacement of vendors without changing business logic.

---

# 23. Printing

Support

- Thermal printers
- A4 invoices
- Labels
- Barcode labels

Keep templates configurable.

---

# 24. Barcode

Support

- USB HID scanners
- Manual barcode entry
- Barcode generation
- Label printing

---

# 25. Reporting

Provide

- Sales
- Purchase
- Stock
- Profit
- GST
- Expiry
- Fast-moving medicines
- Slow-moving medicines

Reports should be exportable to PDF and Excel.

---

# 26. Audit Logging

Maintain separate logs for:

- User actions
- Business events
- Synchronization
- Errors

Example

```
User
Action
Timestamp
Machine
Details

```

---

# 27. Error Handling

Show user-friendly messages.

Avoid technical stack traces.

Allow safe retries where possible.

---

# 28. Backup & Recovery

Automatic scheduled backups.

Support

- Local backups
- External drive
- Cloud upload (future)

Test restore procedures regularly.

---

# 29. Security

- Context Isolation enabled
- Node Integration disabled
- Content Security Policy
- Signed application builds
- Encrypted sensitive data
- Principle of least privilege
- Input validation everywhere
- Secure IPC APIs only

---

# 30. Coding Standards

- Strict TypeScript
- ESLint
- Prettier
- Dependency Injection
- SOLID Principles
- Clean Architecture
- Meaningful naming
- Small services
- Small functions

---

# 31. Testing

- Unit Tests
- Integration Tests
- API Tests
- End-to-End Tests
- Sync Scenario Tests
- Performance Tests

Automate critical business flows.

---

# 32. CI/CD

Automate:

- Linting
- Unit tests
- Build
- Packaging
- Versioning
- Release signing

---

# 33. Observability

Track

- Errors
- Sync failures
- Performance
- Database latency
- Hardware issues

Logs should help diagnose problems quickly.

---

# 34. Telemetry & Analytics

Collect anonymous usage metrics (with customer consent).

Examples

- Slow screens
- Feature usage
- Error frequency
- Sync duration

Use data to guide product improvements.

---

# 35. Feature Flags

Enable gradual rollout of new features.

Benefits

- Safer releases
- A/B testing
- Easy rollback

---

# 36. Multi Store Architecture

Future support for:

- Multiple branches
- Central inventory
- Branch transfers
- Consolidated reporting

Keep branch identifiers in core data models from the beginning.

---

# 37. Migration Strategy

Help customers migrate from:

- Excel
- Legacy ERP
- CSV exports

Provide:

- Import wizard
- Validation
- Preview
- Rollback
- Error reports

---

# 38. Localization

Prepare for:

- Multiple languages
- Regional date formats
- Currency formats
- Tax rules

Never hardcode display text.

---

# 39. Disaster Recovery

Plan for:

- Database corruption
- Disk failure
- Power failure
- Failed sync
- Accidental deletion

Document recovery procedures and test them periodically.

---

# 40. Future Roadmap

- Multi-branch support
- Mobile companion app
- Supplier portal
- Customer loyalty
- AI-powered inventory forecasting
- Automated purchase suggestions
- E-prescription integration
- Cloud dashboards
- WhatsApp notifications
- Payment gateway integration

---

# 41. Engineering Checklist

Before every release, verify:

- [ ] All tests passing
- [ ] No critical lint errors
- [ ] Database migrations reviewed
- [ ] Performance targets met
- [ ] Security review completed
- [ ] Backup tested
- [ ] Sync tested online/offline
- [ ] Printing validated
- [ ] Barcode scanner tested
- [ ] Audit logs verified
- [ ] Release notes prepared

---

# Guiding Principle

> **"Design around the pharmacist's workflow, not the database schema."**

A great Pharmacy ERP is not defined by the number of features it has, but by how quickly, reliably, and confidently a pharmacist can complete everyday tasks. Prioritize speed, clarity, resilience, and maintainability in every architectural decision.
