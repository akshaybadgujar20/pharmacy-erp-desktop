# Phase 7 — System Architecture

> **Document Type:** System Architecture Handbook (SAH)  
> **Phase:** 7 of 15  
> **Audience:** Enterprise Architects, Solution Architects, Software Architects, Technical Leads, Backend Developers, Frontend Developers, DevOps Engineers

---

# Purpose

The **System Architecture** phase defines **how the Pharmacy ERP is built** from a technical perspective.

While previous phases define:

- Business Domain
- Functional Specifications
- Workflows
- Database Design
- Business Rules
- UI/UX

this phase defines **how all of those pieces are implemented as a scalable software platform**.

The architecture should support:

- Single Pharmacy
- Multi Branch
- Offline Desktop
- Cloud Deployment
- SaaS
- Enterprise Installations
- Future AI integrations

This document becomes the **technical blueprint** for the entire ERP.

---

# Goals

- Define the overall architecture.
- Establish module boundaries.
- Design the domain model.
- Design the communication model.
- Design synchronization.
- Design scalability.
- Design deployment topology.
- Define technology standards.
- Support future growth.

---

# Estimated Size

| Metric | Estimate |
|----------|-----------|
| Architecture Diagrams | 80+ |
| Technical Modules | 40+ |
| Services | 60+ |
| Components | 150+ |
| Pages | 300–500 |

---

# Expected Deliverables

- Architecture Handbook
- High-Level Architecture
- Low-Level Design
- Module Architecture
- Domain Architecture
- Integration Architecture
- Deployment Architecture
- Synchronization Design
- Security Architecture
- Performance Strategy

---

# Architecture Principles

The ERP should follow

- Domain Driven Design (DDD)
- Modular Architecture
- Clean Architecture
- SOLID Principles
- CQRS (where applicable)
- Event-Driven Design
- Offline First
- API First
- Testability
- Scalability

---

# Architectural Vision

The system should support

```text
Desktop

↓

Electron

↓

Angular

↓

NestJS (Local Services)

↓

SQLite

↓

Synchronization Engine

↓

REST API

↓

Spring Boot

↓

PostgreSQL

↓

Cloud Services
```

---

# High Level Architecture

```text
+------------------------------------------------------+
|                  Pharmacy ERP                         |
+------------------------------------------------------+

        Presentation Layer

        Angular

        Electron

------------------------------

        Application Layer

        Use Cases

        Services

        Validation

------------------------------

        Domain Layer

        Business Rules

        Entities

        Aggregates

------------------------------

        Infrastructure Layer

        SQLite

        REST

        Files

        Printing

        Barcode

------------------------------

        Cloud

        Spring Boot

        PostgreSQL

        Notification Services
```

---

# Architecture Layers

---

## Presentation Layer

Responsibilities

- User Interface
- Navigation
- Forms
- Dialogs
- Validation
- State Management

Technology

- Angular
- Electron
- TypeScript
- Tailwind CSS
- AG Grid

---

## Application Layer

Responsibilities

- Use Cases
- Commands
- Queries
- Transactions
- Orchestration

---

## Domain Layer

Responsibilities

- Entities
- Aggregates
- Value Objects
- Business Rules
- Domain Events

---

## Infrastructure Layer

Responsibilities

- SQLite
- REST Client
- File System
- Printing
- Barcode
- Notifications

---

## Cloud Layer

Responsibilities

- Authentication
- Synchronization
- Central Database
- APIs
- Reporting
- Analytics

---

# Module Architecture

```text
Authentication

Sales

Purchase

Inventory

Masters

Reports

Accounts

Utilities

Notifications

Synchronization

Administration
```

Each module should remain independent.

---

# Domain Architecture

Example

```text
Sales Domain

│

├── Invoice

├── Invoice Item

├── Customer

├── Discount

├── Payment

└── Taxes
```

Purchase

```text
Purchase Domain

│

├── Purchase

├── Purchase Item

├── Supplier

├── Batch

├── GST

└── Inventory
```

---

# Suggested Bounded Contexts

```text
Authentication

Product Catalog

Inventory

Sales

Purchase

Accounting

Reports

Administration

Configuration

Notification
```

---

# Component Architecture

Each module consists of

```text
Pages

↓

Containers

↓

Components

↓

Services

↓

Repositories

↓

Database
```

---

# Frontend Architecture

Recommended

```text
Angular

│

├── Core

├── Shared

├── Features

├── Layout

├── Widgets

├── Theme

├── Assets
```

---

# Backend Architecture

Recommended

```text
Controllers

↓

Application Services

↓

Domain Services

↓

Repositories

↓

Database
```

---

# Local Desktop Architecture

```text
Electron

↓

Angular

↓

NestJS

↓

SQLite

↓

File System

↓

Printer

↓

Scanner
```

---

# Cloud Architecture

```text
Angular

↓

REST

↓

Spring Boot

↓

PostgreSQL

↓

Redis

↓

Object Storage
```

---

# Synchronization Architecture

```text
SQLite

↓

Local Queue

↓

Sync Service

↓

REST API

↓

Cloud Queue

↓

PostgreSQL

↓

Acknowledgement

↓

Local Update
```

---

# Event Architecture

Events

```text
InvoiceCreated

InvoiceCancelled

PurchaseCompleted

StockAdjusted

CustomerCreated

SupplierCreated

BatchExpired

PriceChanged

UserLoggedIn
```

---

# Message Flow

```text
UI

↓

Application

↓

Domain

↓

Repository

↓

SQLite

↓

Sync Queue

↓

Cloud
```

---

# Communication Patterns

Supported

- REST
- Event Bus
- Local IPC
- WebSocket (future)
- Message Queue (future)

---

# Security Architecture

Layers

```text
Authentication

↓

Authorization

↓

Permissions

↓

Encryption

↓

Audit

↓

Logging
```

---

# Offline First Strategy

Desktop always works.

```text
User

↓

SQLite

↓

Queue

↓

Internet Available?

↓

YES

↓

Sync

↓

Cloud

↓

Done
```

---

# Multi Branch Architecture

```text
Branch A

↓

Sync

↓

Cloud

↓

Sync

↓

Branch B
```

---

# Deployment Topology

Small Pharmacy

```text
Electron

+

SQLite
```

Medium Business

```text
Electron

↓

Spring Boot

↓

PostgreSQL
```

Enterprise

```text
Desktop

↓

Load Balancer

↓

Spring Boot Cluster

↓

Redis

↓

PostgreSQL Cluster
```

---

# API Architecture

Each module owns its APIs.

Example

```text
/api/products

/api/purchase

/api/sales

/api/customers

/api/inventory

/api/accounts

/api/reports
```

---

# Integration Architecture

Future integrations

- GST Portal
- WhatsApp
- SMS
- Email
- Barcode Scanner
- Label Printer
- Payment Gateway
- IQVIA
- Tally
- ERP APIs

---

# Caching Strategy

Use cache for

- Products
- GST
- Settings
- Permissions
- Lookups

---

# Logging Architecture

Capture

- Errors
- User Actions
- Performance
- Audit
- Synchronization
- Security Events

---

# Monitoring

Metrics

- API Response Time
- Sync Time
- Queue Size
- Memory
- CPU
- Database Size
- Failed Transactions

---

# Error Handling Strategy

Every layer should

- Handle gracefully
- Log errors
- Return meaningful messages
- Retry transient failures
- Preserve transactions

---

# Scalability Strategy

Support

- 1 Store
- 10 Stores
- 100 Stores
- 1,000 Stores

No architectural redesign should be required.

---

# Technology Standards

Frontend

- Angular
- TypeScript
- RxJS
- Tailwind CSS
- AG Grid

Desktop

- Electron

Local Backend

- NestJS

Cloud Backend

- Spring Boot

Database

- SQLite
- PostgreSQL

Authentication

- JWT
- OAuth2
- OpenID Connect (future)

---

# Quality Attributes

The architecture should optimize for

- Maintainability
- Scalability
- Reliability
- Availability
- Security
- Performance
- Testability
- Extensibility
- Observability

---

# Architecture Decision Records (ADR)

Every significant architectural decision should be documented.

Template

```text
ADR Number

Title

Context

Problem

Options Considered

Decision

Consequences

Alternatives

Future Review
```

---

# Architecture Diagrams

Include

- Context Diagram
- Container Diagram
- Component Diagram
- Deployment Diagram
- Sequence Diagram
- Module Dependency Diagram
- Domain Diagram
- Network Diagram
- Synchronization Diagram
- Security Diagram

---

# Quality Checklist

Every architectural decision should answer

- Why was this chosen?
- What problem does it solve?
- Can it scale?
- Can it work offline?
- Is it testable?
- Is it secure?
- Can modules evolve independently?
- Does it support future cloud deployment?
- Can new modules be added without breaking existing ones?
- Is the architecture understandable by new developers?

---

# Exit Criteria

Phase 7 is complete when

- High-level architecture is finalized.
- Module boundaries are defined.
- Domain model is established.
- Deployment topology is documented.
- Synchronization strategy is complete.
- Integration architecture is defined.
- Security architecture is documented.
- Architecture Decision Records (ADRs) are created.
- Technical standards are approved.
- The architecture is ready for detailed implementation.

---
