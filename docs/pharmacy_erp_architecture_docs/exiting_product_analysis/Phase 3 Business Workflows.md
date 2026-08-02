# Phase 3 — Business Workflows

> **Document Type:** Business Workflow Handbook (BWH)  
> **Phase:** 3 of 15  
> **Audience:** Product Owners, Business Analysts, Solution Architects, Developers, QA Engineers, Implementation Teams

---

# Purpose

Business Workflows define **how the Pharmacy ERP operates from end-to-end**.

While Phase 2 documents **individual screens and their functionality**, this phase focuses on **how multiple screens, modules, users, and systems work together** to accomplish a complete business process.

This document becomes the operational blueprint of the ERP.

Think of this as the **Business Operating Manual** for the Pharmacy ERP.

---

# Goals

- Document every business process.
- Identify every actor.
- Capture all decision points.
- Define happy paths and exception paths.
- Document module interactions.
- Define inventory movement.
- Define accounting impact.
- Define approval flows.
- Define notifications.
- Define audit requirements.
- Create end-to-end process diagrams.

---

# Estimated Size

| Metric | Estimate |
|----------|-----------|
| Major Workflows | 40–60 |
| Sub Workflows | 120+ |
| Decision Trees | 250+ |
| Sequence Diagrams | 80+ |
| Activity Diagrams | 80+ |
| Pages | 300–500 |

---

# Expected Deliverables

- Business Workflow Handbook
- Workflow Diagrams
- Activity Diagrams
- BPMN Diagrams
- Swimlane Diagrams
- Decision Trees
- Exception Flow Documentation
- Inventory Movement Matrix
- Accounting Impact Matrix
- Notification Matrix
- Approval Matrix

---

# Workflow Documentation Standard

Every workflow should follow the same structure.

---

# Workflow Template

```text
Workflow Name

Purpose

Business Objective

Actors

Trigger

Preconditions

Business Rules

Step-by-Step Process

Decision Points

Alternative Flow

Exception Flow

Validation Rules

Inventory Movement

Accounting Impact

Notifications

Audit Trail

Reports Updated

Related Modules

Database Tables

Sequence Diagram

Activity Diagram

Future Improvements
```

---

# Workflow Categories

---

# Sales Workflows

## 01. Retail Invoice Workflow

Purpose

Sell medicines to customers.

Steps

```text
Customer Arrives
        │
        ▼
Search Customer
        │
        ▼
Search Product
        │
        ▼
Select Batch
        │
        ▼
Verify Stock
        │
        ▼
Apply Discount
        │
        ▼
GST Calculation
        │
        ▼
Receive Payment
        │
        ▼
Generate Invoice
        │
        ▼
Print Bill
        │
        ▼
Update Inventory
        │
        ▼
Post Accounts
```

---

## 02. Sales Delivery Challan Workflow

---

## 03. Customer Return Workflow

---

## 04. Pending Cash Collection Workflow

---

## 05. Stock Issue Workflow

---

## 06. Quotation Workflow

---

## 07. Invoice Reprint Workflow

---

## 08. Invoice Verification Workflow

---

## 09. Sales Correction Workflow

---

## 10. Cashier Closing Workflow

---

# Purchase Workflows

---

## 11. Purchase Order Workflow

```text
Stock Analysis
        │
        ▼
Generate Suggested Order
        │
        ▼
Modify Order
        │
        ▼
Approve
        │
        ▼
Send To Supplier
        │
        ▼
Receive Confirmation
```

---

## 12. Purchase Bill Workflow

```text
Supplier Delivery
        │
        ▼
Receive Invoice
        │
        ▼
Verify Products
        │
        ▼
Verify Batch
        │
        ▼
Verify Expiry
        │
        ▼
Calculate GST
        │
        ▼
Update Inventory
        │
        ▼
Create Supplier Ledger
```

---

## 13. Purchase DM Workflow

---

## 14. Replacement Workflow

---

## 15. Supplier Credit Note Workflow

---

## 16. Opening Stock Workflow

---

## 17. Purchase Import Workflow

---

## 18. Purchase Update Workflow

---

# Inventory Workflows

---

## 19. Stock Adjustment

---

## 20. Stock Transfer

---

## 21. Batch Creation

---

## 22. Batch Merge

---

## 23. Batch Split

---

## 24. Batch Lock

---

## 25. Batch Unlock

---

## 26. Batch Barcode Generation

---

## 27. MRP Revision

---

## 28. Price Revision

---

## 29. Stock Valuation

---

## 30. Physical Stock Verification

---

# Expiry Management Workflows

---

## 31. Near Expiry Identification

---

## 32. Expired Stock Removal

---

## 33. Supplier Claim

---

## 34. Debit Note Generation

---

## 35. Outward Invoice

---

## 36. Replacement Receipt

---

# Accounting Workflows

---

## 37. Cash Receipt

---

## 38. Cash Payment

---

## 39. Bank Receipt

---

## 40. Bank Payment

---

## 41. Journal Voucher

---

## 42. Ledger Posting

---

## 43. Trial Balance

---

## 44. Bank Reconciliation

---

# Customer Workflows

---

## 45. Consumer Registration

---

## 46. Credit Customer Workflow

---

## 47. Customer Outstanding Recovery

---

## 48. Loyalty Workflow (Future)

---

# Regulatory Workflows

---

## 49. Schedule H1 Sale

---

## 50. Narcotics Sale

---

## 51. Anti-TB Drug Sale

---

## 52. GST Return Preparation

---

## 53. GST Export

---

# Administration Workflows

---

## 54. User Creation

---

## 55. User Permission Assignment

---

## 56. Financial Year Change

---

## 57. Backup

---

## 58. Restore

---

## 59. Reindex Database

---

## 60. Data Synchronization

---

# Workflow Components

Each workflow must document

---

## Purpose

Why does this workflow exist?

What business problem does it solve?

---

## Actors

Example

- Pharmacist
- Cashier
- Purchase Manager
- Supplier
- Customer
- Doctor
- Warehouse Staff
- Accountant

---

## Trigger

Example

Customer requests medicine.

Supplier delivers goods.

Stock falls below reorder level.

---

## Preconditions

Examples

- User logged in.
- Financial year open.
- Product exists.
- Batch available.
- User has permission.

---

## Step-by-Step Process

Every user action.

Every system action.

Every database update.

---

## Decision Points

Example

```text
Stock Available?

      │
 ┌────┴────┐
 │         │
YES        NO
 │         │
 ▼         ▼
Continue  Reject
```

---

## Alternative Flow

Examples

- Customer cancels purchase.
- Supplier sends partial delivery.
- Product unavailable.
- Batch expired.

---

## Exception Flow

Examples

- Printer offline.
- Database unavailable.
- GST mismatch.
- Barcode unreadable.
- Payment failure.

---

## Validation Rules

Examples

- Expiry date validation.
- Stock validation.
- Batch validation.
- GST validation.
- Duplicate invoice check.

---

## Inventory Movement

Document

Before

↓

After

↓

Stock Ledger

↓

Batch Ledger

↓

Inventory Balance

---

## Accounting Impact

Document

Debit

Credit

Outstanding

GST

Cash

Ledger

---

## Notifications

Examples

- Low Stock
- Near Expiry
- Credit Limit
- Purchase Approval
- Payment Received
- Backup Completed

---

## Reports Updated

Example

- Sales Register
- Purchase Register
- Stock Ledger
- GST Reports
- Profit Reports

---

## Related Modules

Document every dependency.

Example

```text
Sales
      │
      ▼
Inventory
      │
      ▼
Accounts
      │
      ▼
Reports
      │
      ▼
GST
```

---

# Workflow Diagrams

Every workflow should contain

- Activity Diagram
- Sequence Diagram
- Swimlane Diagram
- BPMN Diagram
- Decision Tree
- State Diagram

---

# Cross-Module Interaction Matrix

Document interactions such as

```text
Sales
    │
    ├── Inventory
    ├── Accounts
    ├── Reports
    ├── GST
    └── Notifications

Purchase
    │
    ├── Inventory
    ├── Accounts
    ├── Reports
    ├── Suppliers
    └── GST

Inventory
    │
    ├── Sales
    ├── Purchase
    ├── Reports
    └── Masters
```

---

# Workflow Quality Checklist

Each workflow must answer

- Why does it exist?
- Who performs it?
- When does it execute?
- What data is required?
- What validations are performed?
- Which modules are updated?
- Which reports are affected?
- Which accounting entries are created?
- Which inventory records are updated?
- Which audit logs are generated?
- What happens if something fails?
- What notifications are generated?
- Can the workflow be reversed?
- Can it be resumed?
- Can it be automated?

---

# Exit Criteria

Phase 3 is complete when:

- Every business workflow is documented.
- All actors are identified.
- All decision points are documented.
- Happy paths and exception paths are defined.
- Inventory movements are documented.
- Accounting impacts are documented.
- Workflow diagrams are completed.
- Cross-module dependencies are identified.
- Documentation is sufficient for implementation without additional business clarification.

---
