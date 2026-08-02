# Phase 4 — Database Design

> **Document Type:** Database Design Handbook (DDH)  
> **Phase:** 4 of 15  
> **Audience:** Solution Architects, Database Architects, Backend Developers, DevOps Engineers, QA Engineers

---

# Purpose

The Database Design phase defines **how the Pharmacy ERP stores, manages, protects, and retrieves data**.

This phase converts the Functional Specifications (Phase 2) and Business Workflows (Phase 3) into a scalable, maintainable, normalized, and high-performance relational database design.

The database is the **foundation of the ERP**. Every module, workflow, report, API, and business rule ultimately depends on a well-designed data model.

---

# Goals

- Design the complete logical database model.
- Identify every business entity.
- Define relationships between entities.
- Normalize data.
- Design transaction tables.
- Design master tables.
- Design audit tables.
- Define indexing strategy.
- Define partitioning strategy.
- Define archival strategy.
- Define synchronization model.
- Prepare for future scalability.

---

# Estimated Size

| Metric | Estimate |
|----------|-----------|
| Business Entities | 150+ |
| Database Tables | 200–300 |
| Master Tables | 80+ |
| Transaction Tables | 80+ |
| Lookup Tables | 40+ |
| Audit Tables | 30+ |
| ER Diagrams | 100+ |
| Pages | 250–400 |

---

# Expected Deliverables

- Database Architecture Document
- Entity Relationship Diagram (ERD)
- Logical Data Model
- Physical Data Model
- Table Specifications
- Column Dictionary
- Indexing Strategy
- Naming Standards
- Data Dictionary
- Audit Design
- Synchronization Model

---

# Database Design Principles

The Pharmacy ERP database should follow:

- Third Normal Form (3NF)
- ACID compliance
- Referential Integrity
- Soft Delete strategy
- Optimistic Locking
- Immutable Transaction History
- Auditability
- Scalability
- Performance-first design

---

# Database Naming Standards

## Tables

```text
product
product_batch
purchase
purchase_item
sales_invoice
sales_invoice_item
supplier
customer
doctor
inventory_stock
stock_ledger
```

---

## Primary Keys

```text
id
```

---

## Foreign Keys

```text
product_id
supplier_id
customer_id
doctor_id
invoice_id
batch_id
```

---

## Audit Columns

Every table should contain

```text
id

created_by
created_at

updated_by
updated_at

deleted_by
deleted_at

version

is_deleted
```

---

# Database Layers

```text
Master Tables
        │
        ▼
Transaction Tables
        │
        ▼
Ledger Tables
        │
        ▼
Reporting Tables
        │
        ▼
Audit Tables
```

---

# Entity Categories

---

# 01. Product Domain

Entities

```text
Product

Product Type

Content Type

Company

Manufacturer

Product Schedule

HSN Code

GST Category

Shelf Location

Generic

Composition

Drug Classification

Medicine Strength

Dosage Form
```

---

# 02. Inventory Domain

Entities

```text
Inventory

Inventory Batch

Batch Ledger

Stock Ledger

Stock Adjustment

Stock Transfer

Opening Stock

Closing Stock

Physical Stock

Expiry Stock

Reserved Stock

Damaged Stock
```

---

# 03. Purchase Domain

Entities

```text
Purchase

Purchase Item

Purchase Return

Purchase Order

Supplier

Supplier Credit Note

Debit Note

Delivery Memo

Replacement

Purchase History
```

---

# 04. Sales Domain

Entities

```text
Invoice

Invoice Item

Customer Return

Delivery Challan

Quotation

Pending Cash

Stock Issue

Sales History
```

---

# 05. Customer Domain

Entities

```text
Customer

Customer Address

Customer Contact

Credit Limit

Outstanding

Loyalty

Patient History

Prescription
```

---

# 06. Doctor Domain

Entities

```text
Doctor

Specialization

Clinic

Prescription

Treatment

Referral
```

---

# 07. Accounting Domain

Entities

```text
Ledger

Voucher

Voucher Detail

Journal

Cash Book

Bank Book

Outstanding

Cheque

Bank Reconciliation

Trial Balance
```

---

# 08. GST Domain

Entities

```text
GST Rate

GST Return

GST Ledger

Tax Ledger

HSN Summary

GSTR1

GSTR2

GSTR3B
```

---

# 09. Security Domain

Entities

```text
User

Role

Permission

Menu

Session

Login History

Password History

User Device

User Audit
```

---

# 10. Configuration Domain

Entities

```text
Financial Year

System Configuration

Branch

Warehouse

Printer

Barcode

Email

SMS

WhatsApp

Notification
```

---

# Entity Documentation Template

Every entity must follow the same structure.

---

# Entity Template

```text
Entity Name

Purpose

Description

Owner Module

Relationships

Primary Key

Foreign Keys

Columns

Indexes

Constraints

Triggers

Stored Procedures

Business Rules

Validations

Audit

Sample Data

Future Enhancements
```

---

# Table Documentation

Every table should contain

---

## Overview

Purpose of the table.

---

## Columns

| Column | Type | Nullable | Default | Description |
|---------|------|----------|----------|-------------|

---

## Constraints

Example

```text
NOT NULL

UNIQUE

CHECK

FOREIGN KEY

PRIMARY KEY
```

---

## Relationships

Example

```text
Product
      │
      ├── Inventory
      │
      ├── Purchase Item
      │
      ├── Invoice Item
      │
      ├── Stock Ledger
      │
      └── Price History
```

---

## Index Strategy

Document

- Primary Index
- Unique Index
- Composite Index
- Search Index
- Reporting Index

---

## Sample Indexes

```sql
IDX_PRODUCT_NAME

IDX_BATCH_NUMBER

IDX_EXPIRY_DATE

IDX_INVOICE_DATE

IDX_SUPPLIER

IDX_CUSTOMER

IDX_STOCK_LEDGER
```

---

# Relationship Diagrams

Every major module should have an ER Diagram.

Example

```text
Supplier
     │
     ▼
Purchase
     │
     ▼
Purchase Item
     │
     ▼
Inventory Batch
     │
     ▼
Inventory
     │
     ▼
Stock Ledger
```

---

# Ledger Design

The ERP should maintain immutable ledgers.

Examples

```text
Inventory Ledger

Batch Ledger

Purchase Ledger

Sales Ledger

GST Ledger

Accounting Ledger

Audit Ledger

Notification Ledger
```

---

# History Tables

Every important entity should maintain history.

Example

```text
Price History

MRP History

GST History

Purchase History

Sales History

Stock History

Login History
```

---

# Audit Tables

Every critical transaction should be auditable.

Capture

- Previous Value
- New Value
- User
- Timestamp
- Machine
- IP Address
- Reason

---

# Soft Delete Strategy

Instead of deleting records

```text
is_deleted = true

deleted_by

deleted_at
```

---

# Versioning

Every important table should support

```text
Version Number

Optimistic Lock

History Tracking
```

---

# Reporting Model

Separate reporting views from transaction tables.

```text
Transaction Tables

↓

Materialized Views

↓

Reporting Views

↓

Dashboards
```

---

# Synchronization Model

For offline-first ERP

```text
SQLite

↓

Sync Queue

↓

REST API

↓

PostgreSQL

↓

Conflict Resolution

↓

Acknowledgement
```

---

# Performance Strategy

Document

- Query Optimization
- Indexing
- Pagination
- Lazy Loading
- Materialized Views
- Batch Updates
- Caching
- Archival

---

# Database Security

Document

- Encryption
- Row-level Security
- Backup
- Restore
- Access Control
- Data Masking
- Sensitive Columns

---

# Database Standards

Every table should define

- Naming Standard
- Primary Key
- Foreign Keys
- Indexes
- Constraints
- Default Values
- Audit Columns
- Version Column
- Soft Delete Column

---

# Database Diagrams

Include

- ER Diagram
- Context Diagram
- Module Diagram
- Relationship Diagram
- Data Flow Diagram
- Sequence Diagram
- Dependency Diagram

---

# Quality Checklist

Every table must answer

- Why does it exist?
- Which module owns it?
- Which workflow uses it?
- Which reports read it?
- Which APIs expose it?
- Which indexes exist?
- Which constraints protect it?
- How is auditing handled?
- How is synchronization handled?
- Can it scale to millions of records?

---

# Exit Criteria

Phase 4 is complete when:

- Every business entity is modeled.
- Every table is documented.
- Relationships are finalized.
- ER diagrams are completed.
- Data dictionary is complete.
- Index strategy is defined.
- Audit strategy is defined.
- Synchronization model is documented.
- Database design supports all workflows from Phase 3.
- Database is ready for backend implementation.

---
