# Pharmacy ERP Database Tables Overview

High-level list of proposed database tables.

## Party Management

| No. | Table        | Description                                     |
|----:|--------------|-------------------------------------------------|
|   1 | Party        | Master record for every person or organization. |
|   2 | PartyRole    | Maps a party to one or more roles.              |
|   3 | PartyAddress | Stores multiple addresses for a party.          |
|   4 | PartyContact | Stores multiple contact methods.                |
|   5 | Customer     | Customer-specific business information.         |
|   6 | Supplier     | Supplier-specific business information.         |
|   7 | Doctor       | Doctor-specific professional information.       |
|   8 | Employee     | Employee-specific employment information.       |

## User & Security

| No. | Table          | Description                |
|----:|----------------|----------------------------|
|   9 | User           | Application login account. |
|  10 | Role           | Security role.             |
|  11 | Permission     | Single permission.         |
|  12 | RolePermission | Maps permissions to roles. |
|  13 | UserRole       | Assigns roles to users.    |
|  14 | UserSession    | Tracks login sessions.     |

## Medicine Master

| No. | Table            | Description               |
|----:|------------------|---------------------------|
|  15 | Medicine         | Medicine master.          |
|  16 | MedicineGeneric  | Generic medicine master.  |
|  17 | MedicineCategory | Medicine category.        |
|  18 | MedicineSchedule | Drug schedule.            |
|  19 | Manufacturer     | Manufacturer master.      |
|  20 | SaltComposition  | Chemical salt master.     |
|  21 | MedicineSalt     | Medicine-to-salt mapping. |
|  22 | UnitOfMeasure    | Measurement units.        |

## Inventory

| No. | Table           | Description                  |
|----:|-----------------|------------------------------|
|  23 | Batch           | Batch and expiry details.    |
|  24 | Stock           | Current stock.               |
|  25 | StockMovement   | Inventory movement history.  |
|  26 | StockAdjustment | Manual stock corrections.    |
|  27 | StockTransfer   | Inter-branch transfers.      |
|  28 | StockTake       | Physical stock verification. |
|  29 | StockTakeItem   | Items counted in stock take. |

## Purchase

| No. | Table               | Description              |
|----:|---------------------|--------------------------|
|  30 | PurchaseOrder       | Purchase order header.   |
|  31 | PurchaseOrderItem   | Purchase order items.    |
|  32 | GoodsReceipt        | Goods receipt header.    |
|  33 | GoodsReceiptItem    | Goods receipt items.     |
|  34 | PurchaseInvoice     | Supplier invoice header. |
|  35 | PurchaseInvoiceItem | Supplier invoice items.  |
|  36 | PurchaseReturn      | Purchase return header.  |
|  37 | PurchaseReturnItem  | Purchase return items.   |

## Sales

| No. | Table            | Description                      |
|----:|------------------|----------------------------------|
|  38 | SalesInvoice     | Sales invoice header.            |
|  39 | SalesInvoiceItem | Sales invoice items.             |
|  40 | SalesReturn      | Sales return header.             |
|  41 | SalesReturnItem  | Sales return items.              |
|  42 | SalesPayment     | Payment received from customers. |

## Financial

| No. | Table       | Description       |
|----:|-------------|-------------------|
|  43 | Payment     | Outgoing payment. |
|  44 | Receipt     | Incoming receipt. |
|  45 | Ledger      | Ledger master.    |
|  46 | LedgerEntry | Accounting entry. |

## Pricing

| No. | Table         | Description       |
|----:|---------------|-------------------|
|  47 | PriceList     | Price list.       |
|  48 | PriceListItem | Price list items. |
|  49 | Tax           | Tax master.       |
|  50 | DiscountRule  | Discount rules.   |

## Loyalty

| No. | Table              | Description      |
|----:|--------------------|------------------|
|  51 | LoyaltyProgram     | Loyalty schemes. |
|  52 | LoyaltyTransaction | Points history.  |

## Prescription

| No. | Table            | Description             |
|----:|------------------|-------------------------|
|  53 | Prescription     | Prescription header.    |
|  54 | PrescriptionItem | Prescription medicines. |

## Synchronization

| No. | Table        | Description                |
|----:|--------------|----------------------------|
|  55 | Outbox       | Offline sync queue.        |
|  56 | SyncLog      | Synchronization history.   |
|  57 | SyncConflict | Synchronization conflicts. |

## Audit

| No. | Table         | Description        |
|----:|---------------|--------------------|
|  58 | AuditLog      | Audit trail.       |
|  59 | ChangeHistory | Historical values. |

## Configuration

| No. | Table                | Description           |
|----:|----------------------|-----------------------|
|  60 | Company              | Company details.      |
|  61 | Branch               | Branch details.       |
|  62 | FinancialYear        | Financial year.       |
|  63 | SequenceGenerator    | Document numbering.   |
|  64 | AppSetting           | Application settings. |
|  65 | PrinterConfiguration | Printer settings.     |
|  66 | BarcodeConfiguration | Barcode settings.     |

## Lookup / Masters

| No. | Table   | Description     |
|----:|---------|-----------------|
|  67 | Country | Country master. |
|  68 | State   | State master.   |
|  69 | City    | City master.    |
|  70 | Area    | Area master.    |

**Total Tables:** 70
