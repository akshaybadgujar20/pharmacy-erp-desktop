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

See [[prisma_sqlite_jpa_postgres_alignment]] for the full alignment guide.

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

## 1. [[party_management| Party Management]]

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

## 2. [[user_and_security|User & Security]]

Responsible for authentication and authorization.

Tables

- User
- Role
- Permission
- RolePermission
- UserRole
- UserSession

---

## 3. [[medicine_master | Medicine Master]]

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

## 4. [[database/tables/inventory/inventory|Inventory]]

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

## 5. [[purchase|Purchase]]

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

## 6. [[database/tables/sales/sales|Sales]]

Responsible for customer billing.

Tables

- SalesInvoice
- SalesInvoiceItem
- SalesReturn
- SalesReturnItem
- SalesPayment

---

## 7. [[finanacial | Financial]]

Accounting and payment tracking.

Tables

- Payment
- Receipt
- Ledger
- LedgerEntry

---

## 8. [[pharmacy_erp_architecture_docs/domain/sales/pricing|Pricing]]

Pricing and taxation.

Tables

- PriceList
- PriceListItem
- Tax
- DiscountRule

---

## 9. [[loyalty | Loyalty]]

Customer reward programs.

Tables

- LoyaltyProgram
- LoyaltyTransaction

---

## 10. [[prescription | Prescription]]

Prescription management.

Tables

- Prescription
- PrescriptionItem

---

## 11. [[database/tables/synchronization/synchronization|Synchronization]]

Offline and cloud synchronization.

Tables

- Outbox
- SyncLog
- SyncConflict

---

## 12. [[audit|Audit]]

Tracks all changes made in the ERP.

Tables

- AuditLog
- ChangeHistory

---

## 13. [[configuration | Configuration]]

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

## 14. [[masters | Masters]]

Reference data used throughout the ERP.

Tables

- Country
- State
- City
- Area

---

# Documentation Structure

```text
docs/database/

000_database_overview.md
001_table_catalog.md

tables/
    001_party.md
    002_party_role.md
    003_party_address.md
    ...
    070_area.md
```

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
