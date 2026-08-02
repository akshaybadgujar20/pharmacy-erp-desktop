<a id="pharmacy-erp-system-design-document"></a>
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

<a id="table-of-contents"></a>
# Table of Contents
- [Pharmacy ERP System Design Document](#pharmacy-erp-system-design-document)
- [1. Vision & Product Philosophy](#vision-and-product-philosophy)
- [2. Design Principles](#design-principles)
- [3. Overall Architecture](#overall-architecture)
- [4. Technology Stack](#technology-stack)
- [5. Module Architecture](#module-architecture)
- [6. Electron Architecture](#electron-architecture)
- [7. Angular Architecture](#angular-architecture)
- [8. NestJS Architecture](#nestjs-architecture)
- [9. Database Design](#database-design)
- [10. Prisma ORM](#prisma-orm)
- [11. Authentication](#authentication)
- [12. Offline First](#offline-first)
- [13. Synchronization Strategy](#synchronization-strategy)
- [14. Event Driven Architecture](#event-driven-architecture)
- [15. API Design](#api-design)
- [16. Domain Driven Design](#domain-driven-design)
- [17. UX Guidelines](#ux-guidelines)
- [18. Keyboard First Philosophy](#keyboard-first-philosophy)
- [19. Workflow Driven UI](#workflow-driven-ui)
- [20. Configuration Driven Development](#configuration-driven-development)
- [21. Performance Guidelines](#performance-guidelines)
- [22. Hardware Integration](#hardware-integration)
- [23. Printing](#printing)
- [24. Barcode](#barcode)
- [25. Reporting](#reporting)
- [26. Audit Logging](#audit-logging)
- [27. Error Handling](#error-handling)
- [28. Backup & Recovery](#backup-and-recovery)
- [29. Security](#security)
- [30. Coding Standards](#coding-standards)
- [31. Testing](#testing)
- [32. CI/CD](#cicd)
- [33. Observability](#observability)
- [34. Telemetry & Analytics](#telemetry-and-analytics)
- [35. Feature Flags](#feature-flags)
- [36. Multi Store Architecture](#multi-store-architecture)
- [37. Migration Strategy](#migration-strategy)
- [38. Localization](#localization)
- [39. Disaster Recovery](#disaster-recovery)
- [40. Future Roadmap](#future-roadmap)
- [41. Engineering Checklist](#engineering-checklist)
- [Guiding Principle](#guiding-principle)

---

<a id="vision-and-product-philosophy"></a>
# 1. Vision & Product Philosophy

<a id="goal"></a>
## Goal

Build a **fast, reliable, offline-first Pharmacy ERP** that pharmacists enjoy using.

The software should disappear into the workflow.

Users should think about medicines—not software.

<a id="product-goals"></a>
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

<a id="design-principles"></a>
# 2. Design Principles

<a id="principle-1"></a>
## Principle 1
<a id="simplicity"></a>
### Simplicity

Simple code lasts longer.

Avoid unnecessary abstraction.

---

<a id="principle-2"></a>
## Principle 2
<a id="modularity"></a>
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

<a id="principle-3"></a>
## Principle 3
<a id="single-responsibility"></a>
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

<a id="principle-4"></a>
## Principle 4
<a id="offline-first"></a>
### Offline First

The application should never depend on internet availability.

Internet is an enhancement—not a requirement.

---

<a id="principle-5"></a>
## Principle 5
<a id="performance-first"></a>
### Performance First

Every screen should feel instant.

Targets

- Medicine Search < 200ms
- Invoice Save < 500ms
- Barcode Scan < 100ms

---

<a id="overall-architecture"></a>
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

<a id="technology-stack"></a>
# 4. Technology Stack

<a id="desktop"></a>
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

<a id="frontend"></a>
## Frontend

Angular

Reason

- Enterprise Ready
- TypeScript
- Dependency Injection
- Lazy Loading
- Strong Ecosystem

---

<a id="backend"></a>
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

<a id="orm"></a>
## ORM

Prisma

Advantages

- Type Safe
- Modern
- Excellent Migration Support
- Fast Development
- Great Developer Experience

---

<a id="local-database"></a>
## Local Database

SQLite

Advantages

- Zero Configuration
- Fast
- Stable
- Single File
- Perfect Offline Database

---

<a id="cloud"></a>
## Cloud

Spring Boot

Reasons

- Existing Experience
- Excellent Enterprise Support
- Security
- Scalability

---

<a id="module-architecture"></a>
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

<a id="electron-architecture"></a>
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

<a id="angular-architecture"></a>
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

<a id="nestjs-architecture"></a>
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

<a id="database-design"></a>
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

<a id="prisma-orm"></a>
# 10. Prisma ORM

Benefits

- Auto-generated TypeScript client
- Compile-time type safety
- Schema-first modelling
- Easy migrations
- Excellent IDE support

Use migrations for all schema changes.

---

<a id="authentication"></a>
# 11. Authentication

Use JWT between Angular and NestJS.

Roles

- Admin
- Pharmacist
- Cashier
- Manager

Permissions should always be checked in the backend, never only in the UI.

---

<a id="offline-first"></a>
# 12. Offline First

The local database is the **source of truth** during daily operation.

Users should never know whether the internet is available.

---

<a id="synchronization-strategy"></a>
# 13. Synchronization Strategy

<a id="delta-sync"></a>
## Delta Sync

Send only changed records.

Never upload the whole database.

---

<a id="push"></a>
## Push

Local → Cloud

---

<a id="pull"></a>
## Pull

Cloud → Local

---

<a id="background-sync"></a>
## Background Sync

Runs

- App Start
- Every few minutes
- Manual Sync
- Network Reconnect

---

<a id="outbox-pattern"></a>
## Outbox Pattern

Every change is recorded in an Outbox table.

Background worker processes:

1. Read outbox
2. Send to server
3. Mark success
4. Retry failures

This guarantees reliable delivery even after crashes.

---

<a id="idempotency"></a>
## Idempotency

Every transaction gets a unique UUID.

If the same request is received twice, the server safely ignores duplicates.

---

<a id="conflict-resolution"></a>
## Conflict Resolution

Different entities require different rules.

Examples:

- Inventory → Transaction-based, never overwrite stock.
- Customer details → Last write wins may be acceptable.
- Medicine master → Prefer server authority.

Keep version numbers or timestamps for conflict detection.

---

<a id="event-driven-architecture"></a>
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

<a id="api-design"></a>
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

<a id="domain-driven-design"></a>
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

<a id="ux-guidelines"></a>
# 17. UX Guidelines

The ERP should optimize the pharmacist's workflow, not showcase technology.

<a id="goals"></a>
### Goals

- Minimum clicks
- Large touch targets where appropriate
- Consistent layouts
- Clear feedback
- Fast search
- Helpful validation
- Undo where possible

---

<a id="keyboard-first-philosophy"></a>
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

<a id="workflow-driven-ui"></a>
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

<a id="configuration-driven-development"></a>
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

<a id="performance-guidelines"></a>
# 21. Performance Guidelines

Targets

- Search < 200 ms
- Open screen < 500 ms
- Invoice print < 2 s
- Startup < 5 s

Use background workers for long-running tasks.

---

<a id="hardware-integration"></a>
# 22. Hardware Integration

Abstract hardware behind interfaces.

Examples

- PrinterService
- BarcodeScannerService
- PaymentGatewayService

This allows easy replacement of vendors without changing business logic.

---

<a id="printing"></a>
# 23. Printing

Support

- Thermal printers
- A4 invoices
- Labels
- Barcode labels

Keep templates configurable.

---

<a id="barcode"></a>
# 24. Barcode

Support

- USB HID scanners
- Manual barcode entry
- Barcode generation
- Label printing

---

<a id="reporting"></a>
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

<a id="audit-logging"></a>
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

<a id="error-handling"></a>
# 27. Error Handling

Show user-friendly messages.

Avoid technical stack traces.

Allow safe retries where possible.

---

<a id="backup-and-recovery"></a>
# 28. Backup & Recovery

Automatic scheduled backups.

Support

- Local backups
- External drive
- Cloud upload (future)

Test restore procedures regularly.

---

<a id="security"></a>
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

<a id="coding-standards"></a>
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

<a id="testing"></a>
# 31. Testing

- Unit Tests
- Integration Tests
- API Tests
- End-to-End Tests
- Sync Scenario Tests
- Performance Tests

Automate critical business flows.

---

<a id="cicd"></a>
# 32. CI/CD

Automate:

- Linting
- Unit tests
- Build
- Packaging
- Versioning
- Release signing

---

<a id="observability"></a>
# 33. Observability

Track

- Errors
- Sync failures
- Performance
- Database latency
- Hardware issues

Logs should help diagnose problems quickly.

---

<a id="telemetry-and-analytics"></a>
# 34. Telemetry & Analytics

Collect anonymous usage metrics (with customer consent).

Examples

- Slow screens
- Feature usage
- Error frequency
- Sync duration

Use data to guide product improvements.

---

<a id="feature-flags"></a>
# 35. Feature Flags

Enable gradual rollout of new features.

Benefits

- Safer releases
- A/B testing
- Easy rollback

---

<a id="multi-store-architecture"></a>
# 36. Multi Store Architecture

Future support for:

- Multiple branches
- Central inventory
- Branch transfers
- Consolidated reporting

Keep branch identifiers in core data models from the beginning.

---

<a id="migration-strategy"></a>
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

<a id="localization"></a>
# 38. Localization

Prepare for:

- Multiple languages
- Regional date formats
- Currency formats
- Tax rules

Never hardcode display text.

---

<a id="disaster-recovery"></a>
# 39. Disaster Recovery

Plan for:

- Database corruption
- Disk failure
- Power failure
- Failed sync
- Accidental deletion

Document recovery procedures and test them periodically.

---

<a id="future-roadmap"></a>
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

<a id="engineering-checklist"></a>
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

<a id="guiding-principle"></a>
# Guiding Principle

> **"Design around the pharmacist's workflow, not the database schema."**

A great Pharmacy ERP is not defined by the number of features it has, but by how quickly, reliably, and confidently a pharmacist can complete everyday tasks. Prioritize speed, clarity, resilience, and maintainability in every architectural decision.
