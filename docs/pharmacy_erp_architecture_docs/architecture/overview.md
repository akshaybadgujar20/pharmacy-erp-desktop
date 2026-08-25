# Overview

## Vision & Product Philosophy

Build a **fast, reliable, offline-first Pharmacy ERP** that pharmacists enjoy using.

The software should disappear into the workflow. Users should think about medicines—not software.

### Product Goals

- Fast
- Reliable
- Offline First
- Secure
- Easy to Learn
- Keyboard Friendly
- Extensible
- Multi Store Ready

## Overall Architecture

```text
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

## Technology Stack

### Desktop — Electron

- Native Desktop
- Printing
- File System
- Auto Updates
- Barcode
- Hardware Access

### Frontend — Angular

- Enterprise Ready
- TypeScript
- Dependency Injection
- Lazy Loading
- Strong Ecosystem

### Backend — NestJS

Very similar to Spring Boot. Provides:

- Controllers
- Services
- Modules
- Guards
- Pipes
- Interceptors

### ORM — Prisma

- Type Safe
- Modern
- Excellent Migration Support
- Fast Development
- Great Developer Experience

### Local Database — SQLite

- Zero Configuration
- Fast
- Stable
- Single File
- Perfect Offline Database

### Cloud — Spring Boot

- Existing Experience
- Excellent Enterprise Support
- Security
- Scalability

## Design Principles

### Simplicity

Simple code lasts longer. Avoid unnecessary abstraction.

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

### Single Responsibility

Each class should have only one responsibility.

Bad:

```text
SalesService
    Save Sale
    Print Invoice
    Send SMS
    Sync Data
```

Good:

```text
SalesService
InvoiceService
PrinterService
SMSService
SyncService
```

### Offline First

The application should never depend on internet availability. Internet is an enhancement—not a requirement.

### Performance First

Every screen should feel instant.

Targets:

- Medicine Search < 200ms
- Invoice Save < 500ms
- Barcode Scan < 100ms

## Domain Driven Design

Bounded contexts:

- Sales
- Purchase
- Inventory
- Billing
- Reporting

Avoid sharing internal logic between domains. Communicate through services or events.

## Event Driven Architecture

Example events:

- SaleCompleted
- StockUpdated
- InvoicePrinted
- SyncFinished
- PurchaseReceived

Modules subscribe instead of directly calling each other.

Benefits:

- Loose coupling
- Easier testing
- Future extensibility

## Related docs

- [Application architecture](./application-architecture.md)
- [Data and sync](./data-and-sync.md)
- [Early foundations](./early-foundations.md) — implemented platform layer
- [Database overview](../database/database_overview.md)
