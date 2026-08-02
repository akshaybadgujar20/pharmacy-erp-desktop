# Customer

> **Module:** Master Data
> **Entity:** Customer
> **Logical Entity:** Customer
> **Status:** Draft
> **Version:** 1.0
> **Last Updated:** YYYY-MM-DD

---

# Purpose

Stores customer information used throughout the ERP.

Supports:

- Walk-in Customers
- Registered Customers
- Credit Customers
- GST Customers
- Retail Customers

This document defines the **logical design** of the Customer entity.

The implementation supports:

- SQLite (Desktop ERP)
- PostgreSQL (Cloud ERP)

---

# Database Support

| Database | Status |
|-----------|--------|
| SQLite | Supported |
| PostgreSQL | Supported |

---

# Physical Type Mapping

| Logical Type | SQLite | PostgreSQL |
|--------------|---------|------------|
| UUID | TEXT | UUID |
| String(30) | TEXT | VARCHAR(30) |
| String(100) | TEXT | VARCHAR(100) |
| String(255) | TEXT | VARCHAR(255) |
| Boolean | INTEGER (0/1) | BOOLEAN |
| Decimal | NUMERIC | NUMERIC(18,2) |
| Date | TEXT (ISO-8601) | DATE |
| DateTime | TEXT (ISO-8601) | TIMESTAMP |
| Long Text | TEXT | TEXT |

---

# Purpose of Entity

Customer stores all customer master information required by the ERP.

Examples include:

- Customer Registration
- Sales
- Billing
- Returns
- Credit Notes
- Loyalty
- Customer Ledger
- Reports

---

# Business Rules

| ID | Rule |
|----|------|
| BR-001 | Customer Code must be unique. |
| BR-002 | Customer Name is mandatory. |
| BR-003 | Mobile Number should be unique if provided. |
| BR-004 | Credit Limit cannot be negative. |
| BR-005 | Deleted customers cannot have active transactions. |
| BR-006 | Walk-in customer does not require address. |
| BR-007 | GST Number is optional but must be valid if entered. |
| BR-008 | Customer Code cannot be changed after creation. |
| BR-009 | Soft Delete only. |

---

# Columns

| Column | Logical Type | Nullable | Default | Description |
|---------|--------------|----------|----------|-------------|
| customer_id | UUID | No | Generated | Primary Key |
| customer_code | String(30) | No | - | Unique Customer Code |
| first_name | String(100) | No | - | First Name |
| last_name | String(100) | Yes | NULL | Last Name |
| full_name | String(255) | No | Generated | Display Name |
| gender | String(20) | Yes | NULL | Gender |
| date_of_birth | Date | Yes | NULL | Date of Birth |
| mobile | String(20) | Yes | NULL | Mobile Number |
| email | String(255) | Yes | NULL | Email |
| gst_number | String(20) | Yes | NULL | GST Number |
| pan_number | String(20) | Yes | NULL | PAN Number |
| credit_limit | Decimal | No | 0 | Credit Limit |
| remarks | Long Text | Yes | NULL | Internal Remarks |
| is_active | Boolean | No | TRUE | Active Status |
| created_by | UUID | No | - | Created User |
| created_date | DateTime | No | Current DateTime | Creation Time |
| modified_by | UUID | Yes | NULL | Modified User |
| modified_date | DateTime | Yes | NULL | Last Modified Time |

---

# Primary Key

| Name | Columns |
|------|---------|
| PK_CUSTOMER | customer_id |

---

# Foreign Keys

| Constraint | Column | References |
|------------|--------|------------|
| FK_CUSTOMER_CREATED_BY | created_by | user.user_id |
| FK_CUSTOMER_MODIFIED_BY | modified_by | user.user_id |

---

# Unique Constraints

| Constraint | Columns |
|------------|---------|
| UK_CUSTOMER_CODE | customer_code |
| UK_CUSTOMER_MOBILE | mobile |

---

# Indexes

| Index | Columns | Purpose |
|-------|---------|----------|
| IDX_CUSTOMER_NAME | full_name | Search |
| IDX_CUSTOMER_MOBILE | mobile | POS Lookup |
| IDX_CUSTOMER_EMAIL | email | Lookup |
| IDX_CUSTOMER_ACTIVE | is_active | Filtering |

---

# Relationships

```
Customer
│
├── Sales Invoice
├── Sales Return
├── Customer Ledger
├── Credit Note
├── Loyalty
├── Customer Address
└── Contact Person
```

---

# Used By Modules

- Sales
- POS
- Customer Management
- CRM
- Returns
- Credit Notes
- Reports
- Notifications

---

# Validation Rules

## Customer Code

- Required
- Maximum 30 characters
- Unique
- Cannot change after creation

---

## Customer Name

- Required
- Maximum 255 characters

---

## Mobile

- Optional
- Digits only
- Duplicate not allowed

---

## Email

- Optional
- Must be valid email format

---

## Credit Limit

- Minimum = 0
- Decimal

---

## GST Number

- Optional
- Must follow GST format

---

# Lifecycle

```
Create

↓

Active

↓

Transactions

↓

Inactive

↓

Archived
```

---

# Audit Fields

The following fields must be maintained.

- Created By
- Created Date
- Modified By
- Modified Date

Future:

- Deleted By
- Deleted Date

---

# Permissions

| Permission | Description |
|------------|-------------|
| CUSTOMER_VIEW | View Customer |
| CUSTOMER_CREATE | Create Customer |
| CUSTOMER_EDIT | Modify Customer |
| CUSTOMER_DELETE | Delete Customer |
| CUSTOMER_EXPORT | Export Customer |

---

# APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /customers | Search Customers |
| GET | /customers/{id} | Customer Details |
| POST | /customers | Create Customer |
| PUT | /customers/{id} | Update Customer |
| DELETE | /customers/{id} | Soft Delete |

---

# UI Screens

- Customer List
- Customer Details
- Customer Registration
- Customer Search
- POS Customer Lookup
- Customer Ledger

---

# Reports

- Customer List
- Customer Ledger
- Customer Outstanding
- Sales by Customer
- Customer Credit Report

---

# Future Enhancements

- Multiple Addresses
- Multiple Contacts
- Loyalty Program
- Customer Groups
- Customer Tags
- WhatsApp Integration
- AI Customer Classification

---

# Notes

- Supports both registered and walk-in customers.
- Customer Code is immutable.
- Soft Delete preferred.
- Designed for both Desktop and Cloud editions.
- Logical design is independent of database engine.

---

# Change History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | YYYY-MM-DD | Akshay | Initial Design |