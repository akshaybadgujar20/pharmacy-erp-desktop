# Pharmacy ERP Database Overview

## Purpose

This document provides a high-level overview of the Pharmacy ERP database architecture.

It explains how the database is designed to:

- Normalize common information.
- Avoid duplicate data.
- Use Party as the master entity.
- Support multiple roles for a single party.
- Support offline-first synchronization.
- Keep SQLite and PostgreSQL schemas compatible.
- Maintain complete audit history.
- Use soft delete wherever applicable.
- Use **String** fields for status/type values (not Prisma enums) for SQLite compatibility.

---

# Local vs Cloud Persistence

| Aspect | Local (Desktop) | Cloud (Server) |
|--------|-----------------|----------------|
| Database | **SQLite** | **PostgreSQL** |
| ORM | **Prisma** | **Spring Boot + JPA/Hibernate** |
| Runtime | Electron + NestJS | Spring Boot REST API |
| Primary key | `BigInt` autoincrement (local FK efficiency) | `BIGINT` (mapped from cloud sequences) |
| Sync identity | `uuid String @unique @default(uuid())` on all syncable entities | Same UUID as authoritative merge key |
| JSON payloads | Prisma `Json` → TEXT in SQLite | JPA `@Column(columnDefinition = "jsonb")` on Outbox/SyncConflict |
| Decimal | Prisma `Decimal` → REAL in SQLite | JPA `NUMERIC` in PostgreSQL |
| Status fields | `String` validated in application code | `String` + optional PostgreSQL CHECK constraints |

The Prisma schema in `backend/prisma/` is the **local source of truth**. Cloud JPA entities mirror the same logical model; PostgreSQL-specific types (JSONB, NUMERIC precision) are applied in JPA mappings only — not via `@db.*` in Prisma.

See [prisma_sqlite_jpa_postgres_alignment.md](./prisma_sqlite_jpa_postgres_alignment.md) for the full alignment guide.

---

# High-Level Architecture

```text
                          ┌────────────────────┐
                          │       Party        │
                          └─────────┬──────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
        PartyRole            PartyAddress         PartyContact
              │
              │
    ┌─────────┼───────────┬──────────────┬───────────────┐
    ▼         ▼           ▼              ▼
 Customer  Supplier    Doctor       Employee

────────────────────────────────────────────────────────────

                Medicine
                    │
        ┌───────────┼────────────┐
        ▼           ▼            ▼
 Manufacturer  MedicineSalt  Category
                    │
                    ▼
             SaltComposition

────────────────────────────────────────────────────────────

Purchase Order
       │
       ▼
Goods Receipt
       │
       ▼
Purchase Invoice
       │
       ▼
      Batch (org-global lot)
       │
       ├── Stock @ Branch A
       ├── Stock @ Branch B
       └── ...
       │
       ▼
Stock Movement (per branch)

────────────────────────────────────────────────────────────

Prescription
      │
      ▼
Sales Invoice
      │
      ▼
Sales Payment

────────────────────────────────────────────────────────────

             Ledger
               │
      ┌────────┴────────┐
      ▼                 ▼
   Receipt          Payment

────────────────────────────────────────────────────────────

User
 │
 ▼
Role
 │
 ▼
Permission

────────────────────────────────────────────────────────────

Sync
 ├── Outbox
 ├── SyncLog
 └── SyncConflict

────────────────────────────────────────────────────────────

Audit
 ├── AuditLog
 └── ChangeHistory
```

---

# Functional Modules

## 1. [Party Management](./tables/party_management/party_management.md)

Responsible for managing every person and organization in the ERP.

Tables

- Party
- PartyRole
- PartyAddress
- PartyContact
- Customer
- Supplier
- Doctor
- Employee

---

## 2. [User & Security](./tables/user_and_security/user_and_security.md)

Responsible for authentication and authorization.

Tables

- User
- Role
- Permission
- RolePermission
- UserRole
- UserSession

---

## 3. [Medicine Master](./tables/medicine_master/medicine_master.md)

Stores all medicine-related master data.

Tables

- Medicine
- MedicineGeneric
- MedicineCategory
- MedicineSchedule
- Manufacturer
- SaltComposition
- MedicineSalt
- UnitOfMeasure

---

## 4. [Inventory](./tables/inventory/inventory.md)

Responsible for inventory tracking.

Tables

- Batch
- Stock
- StockMovement
- StockAdjustment
- StockTransfer
- StockTake
- StockTakeItem

---

## 5. [Purchase](./tables/purchase/purchase.md)

Responsible for procurement.

Tables

- PurchaseOrder
- PurchaseOrderItem
- GoodsReceipt
- GoodsReceiptItem
- PurchaseInvoice
- PurchaseInvoiceItem
- PurchaseReturn
- PurchaseReturnItem

---

## 6. [Sales](./tables/sales/sales.md)

Responsible for customer billing.

Tables

- SalesInvoice
- SalesInvoiceItem
- SalesReturn
- SalesReturnItem
- SalesPayment

---

## 7. [Financial](./tables/financial/financial.md)

Accounting and payment tracking.

Tables

- Payment
- Receipt
- Ledger
- LedgerEntry

---

## 8. [Pricing](./tables/pricing/pricing.md)

Pricing and taxation.

Tables

- PriceList
- PriceListItem
- Tax
- DiscountRule

---

## 9. [Loyalty](./tables/loyalty/loyalty.md)

Customer reward programs.

Tables

- LoyaltyProgram
- LoyaltyTransaction

---

## 10. [Prescription](./tables/prescription/prescription.md)

Prescription management.

Tables

- Prescription
- PrescriptionItem

---

## 11. [Synchronization](./tables/synchronization/synchronization.md)

Offline and cloud synchronization.

Tables

- Outbox
- SyncLog
- SyncConflict

---

## 12. [Audit](./tables/audit/audit.md)

Tracks all changes made in the ERP.

Tables

- AuditLog
- ChangeHistory

---

## 13. [Configuration](./tables/configuration/configuration.md)

System-wide configuration.

Tables

- Company
- Branch
- FinancialYear
- SequenceGenerator
- AppSetting
- PrinterConfiguration
- BarcodeConfiguration

---

## 14. [Masters](./tables/masters/masters.md)

Reference data used throughout the ERP.

Tables

- Country
- State
- City
- Area

---

# Documentation Structure

```text
docs/pharmacy_erp_architecture_docs/database/

database_overview.md
persistence-patterns.md
prisma_sqlite_jpa_postgres_alignment.md

tables/
    table_catalog.md          — human-readable catalog
    party_management/party_management.md
    sales/sales.md
    inventory/inventory.md
    ...                       — one self-contained file per category
```

Each category file contains a relationship diagram, how-the-tables-work-together summary, and per-table column/constraint/index specs. Prisma models live in `backend/prisma/schema.prisma` (not duplicated in docs).

---

# Naming Conventions

- Singular table names
- camelCase column names
- BIGINT primary keys
- UUID for external references
- Soft delete using deletedAt
- createdAt / updatedAt audit fields
- version column for optimistic locking

---

# Target Databases

**Local development / desktop (offline-first)**

- SQLite via Prisma + NestJS

**Cloud production**

- PostgreSQL via Spring Boot + JPA

**Shared schema principles**

- No `@db.Uuid`, `@db.Decimal`, or Prisma `enum` in the Prisma schema
- `uuid String @unique @default(uuid())` for sync identity
- `String` status/type fields with application-level validation
- Batch 1:N Stock (per branch via `@@unique([branchId, batchId])`)
