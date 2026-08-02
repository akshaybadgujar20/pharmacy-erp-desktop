# Phase 5 — Business Rules Engine

> **Document Type:** Business Rules Handbook (BRH)  
> **Phase:** 5 of 15  
> **Audience:** Product Owners, Business Analysts, Solution Architects, Backend Developers, QA Engineers

---

# Purpose

The Business Rules Engine defines **how the Pharmacy ERP makes business decisions**.

If **Phase 2 defines what the ERP does** and **Phase 3 defines how workflows execute**, this phase defines **the rules that control those workflows**.

Every validation, calculation, pricing rule, tax rule, inventory policy, accounting policy, approval condition, and regulatory constraint belongs here.

This document becomes the **heart of the ERP**.

---

# Goals

- Document every business rule.
- Separate business rules from UI implementation.
- Centralize all validations.
- Document configurable rules.
- Define calculation engines.
- Define pricing policies.
- Define inventory policies.
- Define approval rules.
- Define compliance rules.
- Enable future rule configuration without code changes.

---

# Estimated Size

| Metric | Estimate |
|----------|-----------|
| Business Rules | 700–1,000 |
| Validation Rules | 300–500 |
| Calculation Rules | 150+ |
| Configuration Rules | 100+ |
| Decision Trees | 100+ |
| Pages | 250–400 |

---

# Expected Deliverables

- Business Rule Catalog
- Validation Catalog
- Decision Matrix
- Rule Dependency Matrix
- Configuration Matrix
- Rule Priority Matrix
- Rule Engine Architecture
- Rule Versioning Strategy
- Exception Handling Guide

---

# Rule Categories

```text
Business Rules
│
├── Product Rules
├── Inventory Rules
├── Sales Rules
├── Purchase Rules
├── Pricing Rules
├── Discount Rules
├── Batch Rules
├── GST Rules
├── Accounting Rules
├── Customer Rules
├── Supplier Rules
├── Doctor Rules
├── Prescription Rules
├── Expiry Rules
├── Security Rules
├── User Permission Rules
├── Reporting Rules
├── Notification Rules
├── Year-End Rules
└── Configuration Rules
```

---

# Business Rule Documentation Template

Every rule should use the following format.

```text
Rule ID

Rule Name

Category

Priority

Description

Purpose

Trigger

Conditions

Validation

Decision

Success Result

Failure Result

Error Message

Affected Modules

Affected Tables

Configuration

Audit

Examples

Future Enhancements
```

---

# Rule Classification

## Critical Rules

Violating these rules must stop the transaction.

Examples

- Selling expired medicine
- Invalid GST
- Duplicate invoice
- Negative stock

---

## Warning Rules

User may continue after confirmation.

Examples

- Low margin
- Near expiry
- Selling below purchase price
- Large discount

---

## Informational Rules

Only display information.

Examples

- Customer birthday
- Loyalty points
- Previous purchases

---

# Product Rules

Examples

---

## Product Active Rule

Purpose

Only active products can be sold.

Validation

```text
IF Product.Status != Active

THEN

Reject Sale
```

---

## Product Discontinued Rule

Purpose

Discontinued medicines cannot be purchased.

---

## Product Schedule Rule

Purpose

Controlled medicines require additional validations.

---

## Generic Product Rule

Purpose

Allow generic substitution when enabled.

---

# Inventory Rules

Examples

---

## Stock Availability Rule

```text
IF Current Stock < Requested Quantity

Reject Transaction
```

---

## Negative Stock Rule

Never allow inventory below zero unless system configuration permits.

---

## Minimum Stock Rule

Generate purchase recommendation when stock falls below reorder level.

---

## Maximum Stock Rule

Warn if purchase exceeds maximum stocking level.

---

## Physical Stock Adjustment Rule

Only authorized users can adjust inventory.

---

# Batch Rules

---

## FEFO Rule

Sell the batch that expires first.

---

## FIFO Rule

Configurable alternative to FEFO.

---

## Duplicate Batch Rule

Supplier cannot supply duplicate batch for same invoice.

---

## Expired Batch Rule

Expired medicines cannot be sold.

---

## Near Expiry Rule

Display warning before sale.

---

## Batch Lock Rule

Locked batches cannot participate in transactions.

---

# Purchase Rules

---

## Supplier Mandatory Rule

Purchase cannot proceed without supplier.

---

## Purchase Rate Rule

Purchase rate cannot be zero.

---

## GST Verification Rule

GST should match product configuration.

---

## Purchase Discount Rule

Apply supplier-specific discount rules.

---

## Purchase Approval Rule

Large purchases require approval.

---

# Sales Rules

---

## Invoice Rule

Invoice cannot be saved without at least one item.

---

## Customer Credit Rule

Credit sale allowed only within customer credit limit.

---

## Pending Cash Rule

Pending cash should be tracked separately.

---

## Return Rule

Returned quantity cannot exceed sold quantity.

---

## Sale Cancellation Rule

Cancelled invoices restore inventory.

---

# Pricing Rules

---

## MRP Rule

Selling price cannot exceed MRP.

---

## Minimum Selling Price Rule

Prevent selling below configured limit.

---

## Purchase Rate Freeze Rule

Purchase rate modification restricted.

---

## Margin Rule

Margin should be calculated automatically.

---

# Discount Rules

---

## Maximum Discount Rule

User discount cannot exceed configured limit.

---

## Product Discount Rule

Product-specific discount overrides default.

---

## Customer Discount Rule

VIP customers receive predefined discounts.

---

## Promotional Discount Rule

Promotions have validity period.

---

# GST Rules

---

## Tax Calculation Rule

GST calculated according to HSN.

---

## GST Split Rule

Split tax into CGST/SGST or IGST.

---

## GST Return Rule

Transactions should populate GST registers.

---

# Accounting Rules

---

## Sales Posting Rule

Every completed invoice creates accounting entries.

---

## Purchase Posting Rule

Purchase automatically updates supplier ledger.

---

## Cash Receipt Rule

Cash ledger updated after payment.

---

## Bank Receipt Rule

Bank ledger updated after cheque clearance.

---

# Customer Rules

---

## Duplicate Mobile Rule

Prevent duplicate customer registration.

---

## Loyalty Rule

Award loyalty points after successful purchase.

---

## Outstanding Rule

Warn for overdue balances.

---

# Doctor Rules

---

## Doctor Mandatory Rule

Required for prescription medicines.

---

## Prescription Validation Rule

Prescription number required for controlled drugs.

---

# Regulatory Rules

---

## Schedule H1 Rule

Capture mandatory patient and doctor information.

---

## Narcotics Rule

Maintain statutory register.

---

## Anti-TB Rule

Maintain government-required reporting.

---

# Expiry Rules

---

## Near Expiry Purchase Rule

Warn before purchasing near-expiry stock.

---

## Expiry Removal Rule

Expired stock cannot remain available for sale.

---

# Security Rules

---

## Permission Rule

Users can only access assigned menus.

---

## Password Policy Rule

Enforce complexity and expiry requirements.

---

## Session Rule

Terminate inactive sessions.

---

# Reporting Rules

---

## Report Access Rule

Reports visible according to user permissions.

---

## Financial Report Rule

Only finalized transactions included.

---

# Notification Rules

---

## Low Stock Alert

Generate notification automatically.

---

## Near Expiry Alert

Notify pharmacist.

---

## Credit Limit Alert

Warn before exceeding limit.

---

# Configuration Rules

Examples

```text
Allow Negative Stock

Allow Duplicate Batch

Enable FEFO

Enable FIFO

Enable Loyalty

Enable Barcode

Enable WhatsApp

Enable Multi Branch

Enable Approval Workflow
```

---

# Decision Trees

Example

```text
Customer Credit Sale

          │
          ▼
Credit Customer?

      │
 ┌────┴─────┐
 │          │
NO         YES
 │          │
 ▼          ▼
Cash     Credit Limit?

           │
     ┌─────┴─────┐
     │           │
   OK         Exceeded
     │           │
     ▼           ▼
Proceed      Reject
```

---

# Rule Dependencies

Example

```text
Invoice

│

├── Product Active Rule

├── Batch Rule

├── Stock Rule

├── GST Rule

├── Pricing Rule

├── Discount Rule

├── Customer Rule

└── Accounting Rule
```

---

# Rule Execution Order

Example

```text
User Input

↓

Field Validation

↓

Business Validation

↓

Inventory Validation

↓

Pricing Engine

↓

Discount Engine

↓

GST Engine

↓

Approval Rules

↓

Database Transaction

↓

Accounting Posting

↓

Notifications

↓

Audit Logging
```

---

# Rule Versioning

Every configurable rule should support

- Version
- Effective Date
- Expiry Date
- Changed By
- Change Reason

---

# Audit Requirements

Every rule execution should capture

- Rule ID
- User
- Timestamp
- Success/Failure
- Previous Value
- New Value
- Error Message

---

# Configuration Matrix

Document whether each rule is

- Hardcoded
- Configurable
- Branch Specific
- Company Specific
- Financial Year Specific

---

# Quality Checklist

Every rule must answer

- Why does it exist?
- Which workflow uses it?
- Which modules depend on it?
- Can it be configured?
- Can it be disabled?
- What happens if it fails?
- Which audit entries are created?
- Which reports depend on it?
- Is it regulatory?
- Is it performance critical?

---

# Exit Criteria

Phase 5 is complete when:

- Every business rule is documented.
- Validation rules are complete.
- Calculation rules are defined.
- Decision trees are documented.
- Rule priorities are established.
- Rule dependencies are mapped.
- Configuration options are documented.
- Audit requirements are defined.
- Rule execution order is finalized.
- Business logic is implementation-ready.

---
