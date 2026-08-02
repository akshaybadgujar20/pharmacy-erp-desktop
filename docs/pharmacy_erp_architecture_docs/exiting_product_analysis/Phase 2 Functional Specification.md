# Phase 2 — Functional Specification

> **Document Type:** Functional Specification Handbook (FSH)  
> **Phase:** 2 of 15  
> **Audience:** Product Owners, Business Analysts, Solution Architects, Developers, QA Engineers, UI/UX Designers

---

# Purpose

The Functional Specification phase defines **what the Pharmacy ERP system should do**.

Unlike Phase 1 (Business Domain), which focuses on understanding pharmacy operations, this phase translates business requirements into **software features**, **screens**, **menus**, **workflows**, **business logic**, and **functional behavior**.

This document becomes the **single source of truth** for implementing the ERP.

---

# Goals

- Document every module.
- Document every screen.
- Document every menu.
- Document every button.
- Document every field.
- Define every workflow.
- Capture business logic.
- Capture validations.
- Define permissions.
- Define user interactions.
- Create a complete ERP Functional Handbook.

---

# Estimated Size

| Metric | Estimate |
|---------|-----------|
| Modules | 10+ |
| Screens | 180–220 |
| Menus | 200+ |
| Fields | 3,000+ |
| Business Rules | 700–1,000 |
| Validations | 300–500 |
| Pages | 400–600 |

---

# Expected Deliverables

- Functional Specification Handbook
- Screen Specifications
- Menu Documentation
- Field Dictionary
- Validation Rules
- User Interaction Guide
- Navigation Guide
- Business Rule Catalog
- Permission Matrix
- Audit Requirements

---

# Documentation Standards

Every screen should follow a standard template.

---

# Standard Screen Template

```text
Screen Name

Purpose

Business Objective

Who Uses It

Navigation

Preconditions

Workflow

Fields

Buttons

Grid Columns

Keyboard Shortcuts

Business Rules

Validations

Permissions

Calculations

Reports Impact

Inventory Impact

Accounting Impact

Database Entities

Audit Logs

Notifications

Error Handling

Future Enhancements

UI/UX Improvements

Related Screens
```

---

# Module Structure

---

# 01. Authentication Module

## Purpose

Provides secure access to the ERP.

### Screens

- Login
- Change Password
- Forgot Password
- User Rights
- User Master
- Session Management

---

# 02. Dashboard Module

## Purpose

Provides business overview and quick navigation.

### Screens

- Dashboard
- Daily Summary
- Alerts
- Notifications
- Pending Tasks

---

# 03. Sales Module

## Purpose

Handles all customer-facing sales operations.

### Menus

- Invoicing
- Sales Delivery Challan
- Customer Return
- Pending Cash
- Stock Issue
- Quotation
- Sales Posting

### Screens

For each screen document:

- Functional Description
- Screen Layout
- Navigation
- Business Flow
- Fields
- Buttons
- Reports
- Validations
- Inventory Updates
- Accounting Entries
- Permissions

---

# 04. Purchase Module

## Purpose

Handles procurement and supplier transactions.

### Menus

- Purchase Bill
- Purchase DM
- Replacement
- Opening Stock
- Batch Operations
- Purchase Orders
- Supplier Credit Notes
- Expiry
- Debit Notes
- GST Reports

Every screen should document:

- Purchase workflow
- Batch creation
- Supplier validation
- Tax calculations
- Inventory updates
- Accounting postings

---

# 05. Inventory Module

## Purpose

Maintains medicine inventory.

### Features

- Stock Ledger
- Batch Stock
- Shelf Stock
- Current Stock
- Opening Stock
- Closing Stock
- Adjustments
- Transfers
- Expiry
- Stock Valuation

---

# 06. Masters Module

## Purpose

Maintains master data.

### Screens

- Product Master
- Company Master
- Supplier Master
- Doctor Master
- Shelf Master
- Product Type
- Content Master
- Generic Master
- Consumer Profile
- State Master
- Prescription Master

Each master should include

- Purpose
- Data Fields
- Relationships
- Validations
- Lookup Usage
- Dependencies

---

# 07. Reports Module

## Purpose

Provides operational and analytical reporting.

### Categories

- Daily Reports
- Sales Reports
- Purchase Reports
- Inventory Reports
- Margin Reports
- GST Reports
- Schedule H1
- Anti-TB
- Narcotics
- Ledger Reports
- Outstanding Reports

Each report should document

- Business Purpose
- Filters
- Parameters
- Columns
- Export Formats
- Performance Considerations

---

# 08. Accounts Module

## Purpose

Handles accounting operations.

### Screens

- Voucher Entry
- Cash Receipt
- Cash Payment
- Bank Receipt
- Bank Payment
- Journal Voucher
- Purchase Voucher
- Ledger
- Trial Balance
- Profit & Loss
- Balance Sheet
- Bank Reconciliation

---

# 09. Utilities Module

## Purpose

Administrative and maintenance operations.

### Screens

- Backup
- Restore
- User Manager
- User Rights
- Reindex
- Financial Year
- Data Synchronization
- GST Utilities
- Import Utilities
- WhatsApp Configuration

---

# 10. System Administration

## Purpose

System-wide configuration and maintenance.

### Features

- User Management
- Roles
- Permissions
- Licensing
- Audit Logs
- Configuration
- Notifications
- Printing
- Barcode
- Email
- SMS

---

# Functional Specification Per Screen

Each screen should include:

## 1. Screen Information

- Screen Name
- Module
- Menu Path
- Purpose
- Description

---

## 2. Navigation

How users access the screen.

---

## 3. Business Flow

Step-by-step operational workflow.

---

## 4. Field Specifications

For every field:

| Property | Description |
|----------|-------------|
| Field Name | |
| Label | |
| Data Type | |
| Required | |
| Default Value | |
| Editable | |
| Lookup | |
| Validation | |
| Business Rule | |

---

## 5. Buttons

For every button:

- Purpose
- Action
- Validation
- Confirmation
- Permission Required

---

## 6. Grid Columns

For every grid:

- Column Name
- Data Source
- Sortable
- Editable
- Calculated
- Hidden Rules

---

## 7. Business Rules

Example

- Cannot sell expired medicine.
- Batch cannot be empty.
- GST must match product.
- Quantity cannot exceed stock.
- Duplicate batches not allowed.

---

## 8. Validations

Example

- Mandatory fields
- Date validation
- Duplicate validation
- Numeric validation
- Range validation

---

## 9. Permissions

For every screen

- View
- Create
- Edit
- Delete
- Approve
- Print
- Export

---

## 10. Calculations

Example

- GST
- Discount
- Margin
- Round Off
- Net Amount
- Profit

---

## 11. Inventory Impact

Document

- Stock Increase
- Stock Decrease
- Batch Creation
- Batch Consumption
- Shelf Updates

---

## 12. Accounting Impact

Document

- Debit Entries
- Credit Entries
- GST Entries
- Ledger Posting
- Outstanding Balance

---

## 13. Audit Trail

Capture

- Created By
- Modified By
- Deleted By
- Timestamp
- IP Address
- Machine Name

---

## 14. Notifications

Example

- Near Expiry
- Low Stock
- Pending Payments
- Credit Limit
- Purchase Alerts

---

## 15. Related Reports

List reports affected by this screen.

---

## 16. Related Screens

Cross-reference other modules.

---

# Functional Artifacts

This phase should also produce:

- Screen Flow Diagrams
- Navigation Maps
- Menu Hierarchies
- Wireframes
- Sequence Diagrams
- Activity Diagrams
- State Diagrams
- Business Rule Matrix
- Validation Matrix
- Permission Matrix
- Feature Matrix

---

# Exit Criteria

Phase 2 is complete when:

- Every menu is documented.
- Every screen is documented.
- Every field is defined.
- Every business rule is captured.
- Every validation is documented.
- Every permission is defined.
- Navigation is complete.
- Functional gaps are identified.
- The documentation is sufficient for development without requiring business clarification.

---
