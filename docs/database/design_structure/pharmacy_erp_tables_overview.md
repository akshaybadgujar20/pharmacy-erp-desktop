# Pharmacy ERP - Database Tables Overview

This document lists the proposed database tables grouped by functional
area with a short description.

## 1. Party Management

  ------------------------------------------------------------------------
                            \# Table                 Purpose
  ---------------------------- --------------------- ---------------------
                             1 `Party`               Master record for
                                                     every person or
                                                     organization. Stores
                                                     common information
                                                     shared by customers,
                                                     suppliers, doctors
                                                     and employees.

                             2 `PartyRole`           Maps one party to one
                                                     or more business
                                                     roles such as
                                                     Customer, Supplier or
                                                     Doctor.

                             3 `PartyAddress`        Stores multiple
                                                     addresses (home,
                                                     clinic, warehouse,
                                                     billing, shipping,
                                                     etc.) for a party.

                             4 `PartyContact`        Stores multiple
                                                     contact methods such
                                                     as mobile, email,
                                                     WhatsApp and
                                                     landline.

                             5 `Customer`            Stores
                                                     customer-specific
                                                     business information
                                                     like credit and
                                                     loyalty.

                             6 `Supplier`            Stores
                                                     supplier-specific
                                                     business information
                                                     like GST, licenses
                                                     and payment terms.

                             7 `Doctor`              Stores
                                                     doctor-specific
                                                     professional
                                                     information.

                             8 `Employee`            Stores
                                                     employee-specific HR
                                                     and payroll
                                                     information.
  ------------------------------------------------------------------------

## 2. User & Security

    \# Table              Purpose
  ---- ------------------ --------------------------------------------------
     9 `User`             Application login account linked to an employee.
    10 `Role`             Defines security roles in the application.
    11 `Permission`       Represents a single application permission.
    12 `RolePermission`   Maps permissions to roles.
    13 `UserRole`         Assigns one or more roles to a user.
    14 `UserSession`      Tracks login sessions and activity.

## 3. Medicine Master

    \# Table                Purpose
  ---- -------------------- --------------------------------------------
    15 `Medicine`           Master catalogue of medicines.
    16 `MedicineGeneric`    Generic medicine master.
    17 `MedicineCategory`   Medicine classification.
    18 `MedicineSchedule`   Drug schedule classification.
    19 `Manufacturer`       Medicine manufacturer master.
    20 `SaltComposition`    Chemical salt master.
    21 `MedicineSalt`       Maps medicines to one or more salts.
    22 `UnitOfMeasure`      Measurement units used throughout the ERP.

## 4. Inventory

    \# Table               Purpose
  ---- ------------------- -----------------------------------
    23 `Batch`             Batch and expiry information.
    24 `Stock`             Current stock balance.
    25 `StockMovement`     History of every stock movement.
    26 `StockAdjustment`   Manual inventory corrections.
    27 `StockTransfer`     Transfers stock between branches.
    28 `StockTake`         Physical inventory session.
    29 `StockTakeItem`     Items counted during stock take.

## 5. Purchase

    \# Table                   Purpose
  ---- ----------------------- ------------------------------
    30 `PurchaseOrder`         Purchase order header.
    31 `PurchaseOrderItem`     Purchase order line items.
    32 `GoodsReceipt`          Goods receipt header.
    33 `GoodsReceiptItem`      Goods receipt line items.
    34 `PurchaseInvoice`       Supplier invoice header.
    35 `PurchaseInvoiceItem`   Supplier invoice line items.
    36 `PurchaseReturn`        Purchase return header.
    37 `PurchaseReturnItem`    Purchase return line items.

## 6. Sales

    \# Table                Purpose
  ---- -------------------- ---------------------------
    38 `SalesInvoice`       Sales invoice header.
    39 `SalesInvoiceItem`   Sales invoice line items.
    40 `SalesReturn`        Sales return header.
    41 `SalesReturnItem`    Sales return line items.
    42 `SalesPayment`       Customer payment records.

## 7. Financial

    \# Table           Purpose
  ---- --------------- --------------------------------
    43 `Payment`       Outgoing payments.
    44 `Receipt`       Incoming receipts.
    45 `Ledger`        Accounting ledger master.
    46 `LedgerEntry`   Individual accounting entries.

## 8. Pricing

    \# Table             Purpose
  ---- ----------------- --------------------------------------
    47 `PriceList`       Price list header.
    48 `PriceListItem`   Medicine prices within a price list.
    49 `Tax`             Tax master.
    50 `DiscountRule`    Discount configuration.

## 9. Loyalty

    \# Table                  Purpose
  ---- ---------------------- -----------------------------
    51 `LoyaltyProgram`       Defines loyalty schemes.
    52 `LoyaltyTransaction`   Points earned and redeemed.

## 10. Prescription

    \# Table                Purpose
  ---- -------------------- ----------------------------------
    53 `Prescription`       Prescription header.
    54 `PrescriptionItem`   Medicines within a prescription.

## 11. Synchronization

    \# Table            Purpose
  ---- ---------------- -------------------------------------------
    55 `Outbox`         Offline sync queue.
    56 `SyncLog`        Synchronization history.
    57 `SyncConflict`   Conflict tracking during synchronization.

## 12. Audit

    \# Table             Purpose
  ---- ----------------- -----------------------------------------
    58 `AuditLog`        Audit trail of changes.
    59 `ChangeHistory`   Historical values for modified records.

## 13. Configuration

    \# Table                    Purpose
  ---- ------------------------ -------------------------------
    60 `Company`                Company master.
    61 `Branch`                 Branch master.
    62 `FinancialYear`          Financial period definitions.
    63 `SequenceGenerator`      Document number generator.
    64 `AppSetting`             Application settings.
    65 `PrinterConfiguration`   Printer setup.
    66 `BarcodeConfiguration`   Barcode setup.

## 14. Lookup / Masters

    \# Table       Purpose
  ---- ----------- -----------------------
    67 `Country`   Country master.
    68 `State`     State master.
    69 `City`      City master.
    70 `Area`      Area/locality master.

**Total Proposed Tables:** 70
