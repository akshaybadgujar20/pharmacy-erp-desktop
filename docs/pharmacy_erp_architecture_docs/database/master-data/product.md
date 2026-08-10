# Product

> **Module:** Master Data
> **Entity:** Product
> **Logical Entity:** Product
> **Status:** Draft
> **Version:** 1.0
> **Last Updated:** YYYY-MM-DD

---

# Purpose

Stores all products managed by the Pharmacy ERP.

A product can represent:

- Medicine
- OTC Product
- Surgical Item
- Medical Equipment
- Consumable
- Cosmetic
- Healthcare Product
- Service (Optional)

This document defines the **logical design** of the Product entity.

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

Product is the central master entity used throughout the ERP.

All inventory movement, purchase, sales, taxation, pricing, reporting, and stock management revolve around Product.

---

# Business Rules

| ID     | Rule                                               |
|--------|----------------------------------------------------|
| BR-001 | Product Code must be unique.                       |
| BR-002 | Product Name is mandatory.                         |
| BR-003 | Product cannot belong to multiple categories.      |
| BR-004 | Product cannot be deleted once transactions exist. |
| BR-005 | Product can be marked Inactive.                    |
| BR-006 | Batch Tracking depends on Product configuration.   |
| BR-007 | Expiry Tracking depends on Product configuration.  |
| BR-008 | GST Rate is mandatory.                             |
| BR-009 | HSN Code is mandatory for taxable products.        |
| BR-010 | Selling Price cannot be negative.                  |
| BR-011 | Purchase Price cannot be negative.                 |
| BR-012 | Stock cannot become negative unless configured.    |
| BR-013 | Product Code cannot change after creation.         |

---

# Columns

| Column                | Logical Type | Nullable | Default          | Description                 |
|-----------------------|--------------|----------|------------------|-----------------------------|
| product_id            | UUID         | No       | Generated        | Primary Key                 |
| product_code          | String(30)   | No       | -                | Product Code                |
| product_name          | String(255)  | No       | -                | Product Name                |
| short_name            | String(100)  | Yes      | NULL             | Short Display Name          |
| description           | Long Text    | Yes      | NULL             | Description                 |
| category_id           | UUID         | No       | -                | Product Category            |
| manufacturer_id       | UUID         | Yes      | NULL             | Manufacturer                |
| brand_id              | UUID         | Yes      | NULL             | Brand                       |
| generic_name          | String(255)  | Yes      | NULL             | Generic Medicine Name       |
| dosage_form           | String(50)   | Yes      | NULL             | Tablet, Capsule, Syrup etc. |
| strength              | String(50)   | Yes      | NULL             | 500mg etc.                  |
| hsn_code              | String(20)   | Yes      | NULL             | HSN Code                    |
| gst_rate              | Decimal      | No       | 0                | GST Percentage              |
| purchase_price        | Decimal      | No       | 0                | Purchase Price              |
| selling_price         | Decimal      | No       | 0                | Selling Price               |
| mrp                   | Decimal      | No       | 0                | Maximum Retail Price        |
| minimum_stock         | Decimal      | No       | 0                | Minimum Stock               |
| maximum_stock         | Decimal      | Yes      | NULL             | Maximum Stock               |
| reorder_level         | Decimal      | No       | 0                | Reorder Level               |
| unit_id               | UUID         | No       | -                | Stock Unit                  |
| barcode               | String(100)  | Yes      | NULL             | Barcode                     |
| batch_tracking        | Boolean      | No       | TRUE             | Batch Enabled               |
| expiry_tracking       | Boolean      | No       | TRUE             | Expiry Enabled              |
| serial_tracking       | Boolean      | No       | FALSE            | Serial Number Tracking      |
| prescription_required | Boolean      | No       | FALSE            | Prescription Required       |
| narcotic              | Boolean      | No       | FALSE            | Narcotic Drug               |
| refrigerated          | Boolean      | No       | FALSE            | Cold Storage Required       |
| active                | Boolean      | No       | TRUE             | Active Product              |
| remarks               | Long Text    | Yes      | NULL             | Internal Notes              |
| created_by            | UUID         | No       | -                | Created User                |
| created_date          | DateTime     | No       | Current DateTime | Created Time                |
| modified_by           | UUID         | Yes      | NULL             | Modified User               |
| modified_date         | DateTime     | Yes      | NULL             | Modified Time               |

---

# Primary Key

| Name       | Columns    |
|------------|------------|
| PK_PRODUCT | product_id |

---

# Foreign Keys

| Constraint              | Column          | References                   |
|-------------------------|-----------------|------------------------------|
| FK_PRODUCT_CATEGORY     | category_id     | category.category_id         |
| FK_PRODUCT_MANUFACTURER | manufacturer_id | manufacturer.manufacturer_id |
| FK_PRODUCT_BRAND        | brand_id        | brand.brand_id               |
| FK_PRODUCT_UNIT         | unit_id         | unit.unit_id                 |

---

# Unique Constraints

| Constraint         | Columns      |
|--------------------|--------------|
| UK_PRODUCT_CODE    | product_code |
| UK_PRODUCT_BARCODE | barcode      |

---

# Indexes

| Index                | Columns      | Purpose         |
|----------------------|--------------|-----------------|
| IDX_PRODUCT_NAME     | product_name | Search          |
| IDX_PRODUCT_CATEGORY | category_id  | Category Search |
| IDX_PRODUCT_BARCODE  | barcode      | Barcode Scan    |
| IDX_PRODUCT_ACTIVE   | active       | Filtering       |
| IDX_PRODUCT_GENERIC  | generic_name | Medicine Search |

---

# Relationships

```
Product
│
├── Category
├── Manufacturer
├── Brand
├── Unit
├── Purchase Order Item
├── Purchase Invoice Item
├── Goods Receipt
├── Stock
├── Batch
├── Stock Movement
├── Sales Invoice Item
├── Sales Return Item
├── Price History
├── Inventory Adjustment
└── Expiry Management
```

---

# Used By Modules

- Purchase
- Inventory
- Warehouse
- Sales
- POS
- Pricing
- Batch Management
- Expiry Management
- Barcode
- Reports
- Dashboard
- Stock Adjustment
- Returns

---

# Validation Rules

## Product Code

- Required
- Unique
- Maximum 30 characters
- Immutable after creation

---

## Product Name

- Required
- Maximum 255 characters

---

## Selling Price

- Must be greater than or equal to 0

---

## Purchase Price

- Must be greater than or equal to 0

---

## MRP

- Cannot be negative

---

## GST

- Mandatory

---

## Barcode

- Optional
- Unique

---

## Batch Tracking

If enabled:

- Batch Number mandatory
- Expiry Date mandatory (configurable)

---

## Stock

Cannot become negative unless organization allows negative inventory.

---

# Lifecycle

```
Create

↓

Active

↓

Purchase

↓

Inventory

↓

Sales

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

| Permission     | Description     |
|----------------|-----------------|
| PRODUCT_VIEW   | View Product    |
| PRODUCT_CREATE | Create Product  |
| PRODUCT_EDIT   | Edit Product    |
| PRODUCT_DELETE | Delete Product  |
| PRODUCT_IMPORT | Import Products |
| PRODUCT_EXPORT | Export Products |

---

# APIs

| Method | Endpoint       | Description     |
|--------|----------------|-----------------|
| GET    | /products      | Search Products |
| GET    | /products/{id} | Product Details |
| POST   | /products      | Create Product  |
| PUT    | /products/{id} | Update Product  |
| DELETE | /products/{id} | Soft Delete     |

---

# UI Screens

- Product List
- Product Details
- Product Registration
- Barcode Search
- Product Pricing
- Product Stock
- Batch Details
- Inventory Dashboard

---

# Reports

- Product List
- Product Price List
- Stock Report
- Stock Valuation
- Expiry Report
- Fast Moving Products
- Slow Moving Products
- Dead Stock
- Reorder Report
- Purchase Analysis
- Sales Analysis

---

# Future Enhancements

- Multiple Barcodes
- Product Images
- Product Documents
- AI Product Classification
- Drug Interaction Information
- Alternate Medicines
- Product Kits
- Combo Products
- Supplier-specific Product Codes
- Multi-language Product Names
- QR Codes
- RFID Support

---

# Notes

- Product is one of the core master entities.
- Product Code is immutable.
- Soft Delete preferred.
- Supports both Desktop and Cloud editions.
- Logical model is database independent.
- Supports future multi-company and multi-branch architecture.

---

# Change History

| Version | Date       | Author | Description    |
|---------|------------|--------|----------------|
| 1.0     | YYYY-MM-DD | Akshay | Initial Design |
