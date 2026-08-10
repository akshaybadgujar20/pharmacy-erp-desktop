# Supplier

> **Module:** Master Data
> **Entity:** Supplier
> **Logical Entity:** Supplier
> **Status:** Draft
> **Version:** 1.0
> **Last Updated:** YYYY-MM-DD

---

# Purpose

Stores supplier and vendor information used throughout the ERP.

A supplier can represent:

- Pharmaceutical Company
- Distributor
- Wholesaler
- Manufacturer
- Local Vendor
- Service Provider
- Equipment Supplier

This document defines the **logical design** of the Supplier entity.

Supported databases:

- SQLite (Desktop Edition)
- PostgreSQL (Cloud Edition)

---

# Database Support

| Database   | Status    |
|------------|-----------|
| SQLite     | Supported |
| PostgreSQL | Supported |

---

# Physical Type Mapping

| Logical Type | SQLite        | PostgreSQL    |
|--------------|---------------|---------------|
| UUID         | TEXT          | UUID          |
| String(30)   | TEXT          | VARCHAR(30)   |
| String(50)   | TEXT          | VARCHAR(50)   |
| String(100)  | TEXT          | VARCHAR(100)  |
| String(255)  | TEXT          | VARCHAR(255)  |
| Boolean      | INTEGER (0/1) | BOOLEAN       |
| Decimal      | NUMERIC       | NUMERIC(18,2) |
| Integer      | INTEGER       | INTEGER       |
| Date         | TEXT          | DATE          |
| DateTime     | TEXT          | TIMESTAMP     |
| Long Text    | TEXT          | TEXT          |

---

# Purpose of Entity

Supplier stores all procurement partner information required by the ERP.

Suppliers are responsible for providing products and services that are purchased by the organization.

---

# Business Rules

| ID     | Rule                                                |
|--------|-----------------------------------------------------|
| BR-001 | Supplier Code must be unique.                       |
| BR-002 | Supplier Name is mandatory.                         |
| BR-003 | GST Number should be unique if provided.            |
| BR-004 | PAN Number should be unique if provided.            |
| BR-005 | Supplier cannot be deleted once transactions exist. |
| BR-006 | Supplier can be marked inactive.                    |
| BR-007 | Credit Days cannot be negative.                     |
| BR-008 | Credit Limit cannot be negative.                    |
| BR-009 | Supplier Code cannot be changed after creation.     |
| BR-010 | Soft Delete only.                                   |

---

# Columns

| Column              | Logical Type | Nullable | Default          | Description                       |
|---------------------|--------------|----------|------------------|-----------------------------------|
| supplier_id         | UUID         | No       | Generated        | Primary Key                       |
| supplier_code       | String(30)   | No       | -                | Supplier Code                     |
| supplier_name       | String(255)  | No       | -                | Supplier Name                     |
| short_name          | String(100)  | Yes      | NULL             | Short Name                        |
| supplier_type       | String(50)   | No       | Distributor      | Distributor, Manufacturer, Vendor |
| contact_person      | String(255)  | Yes      | NULL             | Primary Contact                   |
| mobile              | String(20)   | Yes      | NULL             | Mobile Number                     |
| phone               | String(30)   | Yes      | NULL             | Telephone                         |
| email               | String(255)  | Yes      | NULL             | Email Address                     |
| website             | String(255)  | Yes      | NULL             | Website                           |
| gst_number          | String(20)   | Yes      | NULL             | GST Registration Number           |
| pan_number          | String(20)   | Yes      | NULL             | PAN Number                        |
| drug_license_number | String(50)   | Yes      | NULL             | Drug License                      |
| address_line_1      | String(255)  | Yes      | NULL             | Address Line 1                    |
| address_line_2      | String(255)  | Yes      | NULL             | Address Line 2                    |
| city                | String(100)  | Yes      | NULL             | City                              |
| state               | String(100)  | Yes      | NULL             | State                             |
| country             | String(100)  | Yes      | NULL             | Country                           |
| postal_code         | String(20)   | Yes      | NULL             | Postal Code                       |
| payment_terms       | String(100)  | Yes      | NULL             | Payment Terms                     |
| credit_days         | Integer      | No       | 0                | Credit Period                     |
| credit_limit        | Decimal      | No       | 0                | Credit Limit                      |
| opening_balance     | Decimal      | No       | 0                | Opening Balance                   |
| active              | Boolean      | No       | TRUE             | Active Supplier                   |
| remarks             | Long Text    | Yes      | NULL             | Internal Notes                    |
| created_by          | UUID         | No       | -                | Created User                      |
| created_date        | DateTime     | No       | Current DateTime | Creation Time                     |
| modified_by         | UUID         | Yes      | NULL             | Modified User                     |
| modified_date       | DateTime     | Yes      | NULL             | Last Modified                     |

---

# Primary Key

| Name        | Columns     |
|-------------|-------------|
| PK_SUPPLIER | supplier_id |

---

# Foreign Keys

| Constraint              | Column      | References   |
|-------------------------|-------------|--------------|
| FK_SUPPLIER_CREATED_BY  | created_by  | user.user_id |
| FK_SUPPLIER_MODIFIED_BY | modified_by | user.user_id |

---

# Unique Constraints

| Constraint       | Columns       |
|------------------|---------------|
| UK_SUPPLIER_CODE | supplier_code |
| UK_SUPPLIER_GST  | gst_number    |
| UK_SUPPLIER_PAN  | pan_number    |

---

# Indexes

| Index               | Columns       | Purpose    |
|---------------------|---------------|------------|
| IDX_SUPPLIER_NAME   | supplier_name | Search     |
| IDX_SUPPLIER_CITY   | city          | Search     |
| IDX_SUPPLIER_GST    | gst_number    | GST Lookup |
| IDX_SUPPLIER_ACTIVE | active        | Filtering  |

---

# Relationships

```
Supplier
│
├── Purchase Order
├── Purchase Invoice
├── Goods Receipt
├── Purchase Return
├── Payment
├── Supplier Ledger
├── Supplier Contact
├── Supplier Bank Account
└── Product
```

---

# Used By Modules

- Purchase
- Goods Receipt
- Purchase Return
- Supplier Payments
- Finance
- Inventory
- Reports
- Dashboard

---

# Validation Rules

## Supplier Code

- Required
- Maximum 30 characters
- Unique
- Immutable after creation

---

## Supplier Name

- Required
- Maximum 255 characters

---

## GST Number

- Optional
- Must be valid GST format
- Unique if provided

---

## PAN Number

- Optional
- Unique if provided

---

## Email

- Optional
- Must be valid email format

---

## Credit Days

- Minimum value = 0

---

## Credit Limit

- Minimum value = 0

---

# Lifecycle

```
Create

↓

Active

↓

Purchase Transactions

↓

Inactive

↓

Archived
```

---

# Audit Fields

- Created By
- Created Date
- Modified By
- Modified Date

Future:

- Deleted By
- Deleted Date

---

# Permissions

| Permission      | Description     |
|-----------------|-----------------|
| SUPPLIER_VIEW   | View Supplier   |
| SUPPLIER_CREATE | Create Supplier |
| SUPPLIER_EDIT   | Edit Supplier   |
| SUPPLIER_DELETE | Delete Supplier |
| SUPPLIER_EXPORT | Export Supplier |

---

# APIs

| Method | Endpoint        | Description      |
|--------|-----------------|------------------|
| GET    | /suppliers      | Search Suppliers |
| GET    | /suppliers/{id} | Supplier Details |
| POST   | /suppliers      | Create Supplier  |
| PUT    | /suppliers/{id} | Update Supplier  |
| DELETE | /suppliers/{id} | Soft Delete      |

---

# UI Screens

- Supplier List
- Supplier Details
- Supplier Registration
- Supplier Ledger
- Purchase History
- Outstanding Balance
- Contact Information

---

# Reports

- Supplier List
- Supplier Ledger
- Purchase Summary
- Outstanding Payables
- Supplier-wise Purchase
- Supplier Performance
- GST Purchase Register

---

# Future Enhancements

- Multiple Contacts
- Multiple Addresses
- Multiple GST Registrations
- Multiple Bank Accounts
- Supplier Rating
- Supplier Performance Metrics
- Supplier Contracts
- Supplier Portal
- E-Invoice Integration
- E-Way Bill Integration
- API Integration with Suppliers

---

# Notes

- Supplier Code is immutable.
- Soft Delete preferred.
- Supports both Desktop and Cloud editions.
- Logical model is database independent.
- Designed for future multi-company and multi-branch support.
- A supplier may supply multiple products.
- A product may have multiple suppliers (handled through a separate Product Supplier mapping entity).

---

# Change History

| Version | Date       | Author | Description    |
|---------|------------|--------|----------------|
| 1.0     | YYYY-MM-DD | Akshay | Initial Design |
