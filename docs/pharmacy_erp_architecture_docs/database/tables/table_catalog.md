# 1. Party Management

## 1. Party

**Purpose**

Master record for every person or organization in the Pharmacy ERP.

**Usage**

Stores common information shared by customers, suppliers, doctors, employees, manufacturers, hospitals, distributors, and any other business entity. Every party is created only once and can have one or more business roles.

---

## 2. PartyRole

**Purpose**

Defines one or more business roles for a Party.

**Usage**

Allows the same Party to act as a Customer, Supplier, Doctor, Employee, Manufacturer, or any combination of roles without duplicating common information.

---

## 3. PartyAddress

**Purpose**

Stores one or more addresses for a Party.

**Usage**

Supports multiple address types such as Home, Office, Clinic, Hospital, Billing, Shipping, Warehouse, Factory, and other future address types. Each Party can have multiple addresses with one marked as the primary address.

---

## 4. PartyContact

**Purpose**

Stores multiple communication methods for a Party.

**Usage**

Supports Mobile Number, Alternate Mobile, Landline, Email Address, WhatsApp Number, Website, Fax, and other contact methods. Multiple contact records can be stored while identifying the primary contact.

---

## 5. Customer

**Purpose**

Stores customer-specific business information.

**Usage**

Contains information applicable only to customers, such as credit limit, credit period, loyalty points, loyalty card, preferred payment mode, price category, customer status, and other sales-related settings. General information like name, address, and contact details is maintained in the Party tables.

---

## 6. Supplier

**Purpose**

Stores supplier-specific business information.

**Usage**

Contains supplier-related details such as GST Number, Drug License Number, PAN Number, payment terms, credit period, lead time, banking information, preferred supplier status, and other procurement-related settings. Common information is maintained in the Party tables.

---

## 7. Doctor

**Purpose**

Stores doctor-specific professional information.

**Usage**

Contains registration number, specialization, qualification, clinic details, consultation fee, years of experience, department, and other professional information. Personal information such as name, addresses, and contact details are maintained in the Party tables.

---

## 8. Employee

**Purpose**

Stores employee-specific employment information.

**Usage**

Contains employee code, designation, department, joining date, salary information, reporting manager, payroll details, attendance settings, and employment status. Personal information is maintained in the Party tables.

# 2. User & Security

## 9. User

**Purpose**

Represents a user account that can log in to the Pharmacy ERP system.

**Usage**

Stores login credentials, account status, authentication settings, and links the user account to an Employee. Every person using the application must have a User account. A User may have one or more roles that determine what features they can access.

---

## 10. Role

**Purpose**

Defines a collection of permissions assigned to users.

**Usage**

Represents business roles such as Administrator, Pharmacist, Cashier, Store Manager, Purchase Manager, Inventory Manager, and Accountant. Roles simplify permission management by grouping related permissions together.

---

## 11. Permission

**Purpose**

Defines a single action that can be performed within the application.

**Usage**

Represents fine-grained access rights such as View Medicines, Create Sales Invoice, Edit Purchase Order, Delete Customer, Approve Stock Adjustment, Print Reports, or Manage Users. Permissions are the building blocks of the security model.

---

## 12. RolePermission

**Purpose**

Maps Permissions to Roles.

**Usage**

Determines which permissions belong to each role. For example, a Pharmacist role may have permission to create invoices and manage prescriptions, while a Cashier role may only be allowed to create invoices and receive payments.

---

## 13. UserRole

**Purpose**

Maps Users to one or more Roles.

**Usage**

Allows a single user to have multiple responsibilities within the system. For example, one employee may be both a Store Manager and a Purchase Manager, inheriting permissions from both roles.

---

## 14. UserSession

**Purpose**

Tracks user login sessions and application activity.

**Usage**

Stores information such as login time, logout time, device information, IP address (for cloud deployments), last activity time, session expiration, and active session status. This helps with security auditing, concurrent session management, and troubleshooting.

# 3. Medicine Master

## 15. Medicine

**Purpose**

Serves as the central master record for every medicine available in the Pharmacy ERP.

**Usage**

Stores all common information about a medicine, including its name, generic, manufacturer, dosage form, strength, pack size, barcode, HSN code, tax category, storage requirements, prescription requirement, and other master attributes. All purchase, inventory, sales, pricing, and prescription modules reference this table.

---

## 16. MedicineGeneric

**Purpose**

Maintains the master list of generic medicines.

**Usage**

Groups different branded medicines under a common generic composition. This enables generic substitution, searching by generic name, inventory analysis, and reporting. For example, Crocin, Dolo 650, and Calpol all belong to the generic "Paracetamol."

---

## 17. MedicineCategory

**Purpose**

Classifies medicines into logical categories.

**Usage**

Used to organize medicines into categories such as Tablet, Capsule, Syrup, Injection, Ointment, Cream, Eye Drops, Surgical Items, Medical Devices, OTC Products, Ayurvedic Medicines, Cosmetics, and other business-defined classifications. Categories simplify searching, reporting, pricing, and inventory management.

---

## 18. MedicineSchedule

**Purpose**

Stores regulatory drug schedule classifications.

**Usage**

Defines the legal category under which a medicine is sold, such as Schedule H, Schedule H1, Schedule X, Narcotic Drugs, OTC, or other government-regulated classifications. This information helps enforce prescription requirements and ensures compliance with pharmaceutical regulations.

---

## 19. Manufacturer

**Purpose**

Maintains the master list of medicine manufacturers.

**Usage**

Stores pharmaceutical companies such as Sun Pharma, Cipla, Dr. Reddy's, Abbott, Lupin, Alkem, Mankind, Zydus, and others. A single manufacturer can produce many medicines, allowing consistent reporting and easier maintenance of manufacturer information.

---

## 20. SaltComposition

**Purpose**

Maintains the master list of active pharmaceutical ingredients (APIs) or chemical salts.

**Usage**

Stores chemical compounds such as Paracetamol, Ibuprofen, Amoxicillin, Clavulanic Acid, Azithromycin, Pantoprazole, and others. This enables searching medicines by their active ingredients and supports generic substitution and medical reporting.

---

## 21. MedicineSalt

**Purpose**

Defines the relationship between medicines and their active ingredients.

**Usage**

Supports medicines containing one or multiple salts. For example, Augmentin contains both Amoxicillin and Clavulanic Acid. This table also stores the strength or quantity of each salt within a medicine, enabling accurate composition management.

---

## 22. UnitOfMeasure

**Purpose**

Maintains the standard units of measurement used throughout the ERP.

**Usage**

Stores units such as Tablet, Capsule, Strip, Bottle, Vial, Ampoule, Tube, Sachet, Box, Carton, Milliliter (ml), Gram (g), Kilogram (kg), and Piece. These units are referenced by medicines, inventory, purchasing, sales, and stock management to ensure consistent quantity calculations across the system.

# 4. Inventory

## 23. Batch

**Purpose**

Stores batch-level information for every medicine purchased and stocked in the pharmacy.

**Usage**

Each purchase of a medicine creates a new batch record containing details such as batch number, manufacturing date, expiry date, purchase price, selling price, MRP, supplier, and available quantity. Batch management enables FIFO/FEFO stock handling, expiry tracking, recalls, and accurate profit calculation.

---

## 24. Stock

**Purpose**

Maintains the current inventory available in the pharmacy.

**Usage**

Provides the real-time stock position of medicines, either batch-wise or as an overall quantity depending on business requirements. This table is referenced during purchasing, sales, returns, stock transfers, and inventory verification to determine current availability.

---

## 25. StockMovement

**Purpose**

Maintains a complete history of every inventory transaction.

**Usage**

Acts as the inventory ledger by recording every increase or decrease in stock. Transactions include purchases, sales, purchase returns, sales returns, stock adjustments, stock transfers, damaged goods, expired medicines, and stock corrections. This table provides complete stock traceability and audit history.

---

## 26. StockAdjustment

**Purpose**

Records manual corrections made to inventory quantities.

**Usage**

Used whenever stock must be increased or decreased outside normal business transactions. Examples include damaged medicines, expired stock, breakage, theft, missing inventory, excess stock found during counting, or data correction. Every adjustment records the reason, approving user, and affected quantities.

---

## 27. StockTransfer

**Purpose**

Manages inventory transfers between branches, warehouses, or storage locations.

**Usage**

Records the movement of medicines from one location to another while maintaining complete tracking of transferred batches, quantities, transfer dates, receiving branch confirmation, and transfer status. This ensures inventory remains synchronized across multiple pharmacy locations.

---

## 28. StockTake

**Purpose**

Represents a physical inventory verification session.

**Usage**

Created whenever the pharmacy performs stock counting, either periodically or on demand. It stores information such as the stock take date, branch, responsible employees, status, and completion details. Each stock take contains multiple counted items stored in the StockTakeItem table.

---

## 29. StockTakeItem

**Purpose**

Stores the individual medicine counts recorded during a stock verification process.

**Usage**

Contains the expected quantity, physically counted quantity, variance, adjustment required, batch information, and remarks for each medicine included in a Stock Take session. These records are later used to generate Stock Adjustment transactions when discrepancies are approved.


# 5. Purchase

## 30. PurchaseOrder

**Purpose**

Represents a purchase order issued to a supplier before medicines are received.

**Usage**

Created when the pharmacy places an order with a supplier. It stores supplier details, expected delivery date, order status, payment terms, total order value, and other purchase-related information. A Purchase Order serves as the official request to procure medicines and can later be converted into one or more Goods Receipts.

---

## 31. PurchaseOrderItem

**Purpose**

Stores the individual medicines requested in a Purchase Order.

**Usage**

Contains one record for each medicine included in the purchase order, along with ordered quantity, unit of measure, expected purchase price, discount, tax information, and remarks. These records are used to verify received quantities during goods receipt.

---

## 32. GoodsReceipt

**Purpose**

Represents the physical receipt of medicines from a supplier.

**Usage**

Created when ordered medicines are delivered to the pharmacy. It records the supplier, purchase order reference, receipt date, receiving employee, and receipt status. A single Purchase Order may generate multiple Goods Receipts if deliveries are made in parts.

---

## 33. GoodsReceiptItem

**Purpose**

Stores the medicines received during a Goods Receipt.

**Usage**

Contains batch numbers, manufacturing date, expiry date, received quantity, free quantity, purchase price, MRP, tax details, and other batch-specific information. Successfully received items create Batch records and update inventory.

---

## 34. PurchaseInvoice

**Purpose**

Represents the supplier's financial invoice for purchased medicines.

**Usage**

Stores invoice number, invoice date, supplier information, payment terms, taxable amount, GST, discounts, freight charges, and total invoice value. The Purchase Invoice is used for accounting, supplier payments, and financial reporting.

---

## 35. PurchaseInvoiceItem

**Purpose**

Stores the individual medicines included in a Purchase Invoice.

**Usage**

Contains medicine details, received batch, quantity, purchase rate, discount, GST, MRP, selling price, free quantity, and line total. These records determine inventory valuation and cost calculations.

---

## 36. PurchaseReturn

**Purpose**

Represents medicines returned to a supplier after purchase.

**Usage**

Created when medicines need to be returned due to expiry, damage, incorrect supply, excess quantity, product recall, or quality issues. The document records supplier information, return reason, approval status, and financial impact.

---

## 37. PurchaseReturnItem

**Purpose**

Stores the individual medicines included in a Purchase Return.

**Usage**

Contains batch number, returned quantity, purchase price, GST, return reason, and adjustment value for each medicine being returned. These records decrease inventory, update stock history, and generate supplier credit adjustments where applicable.

# 6. Sales

## 38. SalesInvoice

**Purpose**

Represents the primary sales transaction between the pharmacy and a customer.

**Usage**

Created whenever medicines or healthcare products are sold. It stores customer information, invoice number, invoice date, billing details, taxes, discounts, payment summary, prescribing doctor (if applicable), and overall invoice status. It serves as the official sales document and is used for inventory updates, accounting, GST reporting, and customer purchase history.

---

## 39. SalesInvoiceItem

**Purpose**

Stores the individual medicines and products sold within a Sales Invoice.

**Usage**

Contains one record for each medicine or product sold, including batch number, quantity, selling price, discount, GST, MRP, expiry date, free quantity, and line total. These records decrease inventory, calculate profit margins, and maintain complete batch-level traceability for every sale.

---

## 40. SalesReturn

**Purpose**

Represents medicines returned by a customer after a sale.

**Usage**

Created when customers return medicines due to damage, incorrect billing, product defects, manufacturer recalls, expiry issues, or other approved business reasons. The document records customer details, original invoice reference, return reason, approval status, refund method, and financial adjustments.

---

## 41. SalesReturnItem

**Purpose**

Stores the individual medicines included in a Sales Return.

**Usage**

Contains batch number, returned quantity, selling price, GST, return reason, and adjustment amount for each returned medicine. Approved returns increase inventory where applicable, update stock history, generate customer refunds or credit notes, and maintain complete audit records.

---

## 42. SalesPayment

**Purpose**

Records payments received against Sales Invoices.

**Usage**

Stores payment information such as Cash, UPI, Credit Card, Debit Card, Net Banking, Gift Voucher, Store Credit, Credit Account, or mixed payment modes. It also supports partial payments, advance payments, outstanding balances, payment references, and payment reconciliation, ensuring accurate financial tracking for every customer sale.

# 7. Financial

## 43. Payment

**Purpose**

Records all outgoing payments made by the pharmacy.

**Usage**

Stores payments made to suppliers, employees, government authorities, service providers, utility companies, landlords, and other parties. It supports multiple payment methods such as Cash, Cheque, UPI, NEFT, RTGS, IMPS, Credit Card, and Bank Transfer. Payments can be linked to one or more Purchase Invoices or other financial transactions.

---

## 44. Receipt

**Purpose**

Records all incoming payments received by the pharmacy.

**Usage**

Stores money received from customers, insurance companies, corporate clients, distributors, or any other source. Supports multiple payment methods including Cash, UPI, Cards, Net Banking, and mixed-mode payments. Receipts may be linked to one or more Sales Invoices and help manage outstanding customer balances.

---

## 45. Ledger

**Purpose**

Maintains the master list of financial accounts used by the ERP.

**Usage**

Represents accounting heads such as Cash Account, Bank Account, Customer Accounts, Supplier Accounts, Sales Account, Purchase Account, GST Accounts, Expense Accounts, Income Accounts, and other accounting ledgers. Every financial transaction ultimately affects one or more ledger accounts, making this table the foundation of the accounting system.

---

## 46. LedgerEntry

**Purpose**

Stores every accounting transaction posted to the General Ledger.

**Usage**

Acts as the accounting journal by recording Debit and Credit entries generated from business transactions such as purchases, sales, receipts, payments, purchase returns, sales returns, stock adjustments, expenses, and journal vouchers. These entries are used to generate Trial Balance, Profit & Loss Statement, Balance Sheet, GST reports, and other financial statements while maintaining a complete audit trail.

# 8. Pricing

## 47. PriceList

**Purpose**

Defines a pricing scheme that can be applied to different customer groups or business scenarios.

**Usage**

Stores information about various price lists such as Retail Price, Wholesale Price, Institutional Price, Corporate Price, Hospital Price, Distributor Price, or Promotional Price. A pharmacy can maintain multiple price lists simultaneously and assign them to specific customers or customer categories.

---

## 48. PriceListItem

**Purpose**

Stores medicine prices belonging to a specific Price List.

**Usage**

Contains the selling price, discount, effective dates, minimum quantity, maximum quantity, and pricing rules for each medicine within a Price List. This allows the same medicine to have different selling prices based on customer type, branch, promotional offers, or contractual agreements.

---

## 49. Tax

**Purpose**

Maintains the master list of taxes applicable to medicines and other products.

**Usage**

Stores GST rates, cess, tax codes, HSN/SAC mappings, effective dates, and other taxation information. Medicines and products reference this table to ensure accurate tax calculations during purchasing, sales, returns, and financial reporting. The table also supports future tax changes without modifying product records.

---

## 50. DiscountRule

**Purpose**

Defines reusable discount policies used throughout the ERP.

**Usage**

Stores discount rules based on customer category, medicine category, manufacturer, supplier, quantity purchased, invoice value, promotional campaigns, loyalty programs, seasonal offers, or special agreements. Discount rules are automatically evaluated during billing to determine the applicable discount while maintaining consistency across all sales transactions.

# 9. Loyalty

## 51. LoyaltyProgram

**Purpose**

Defines the customer loyalty programs offered by the pharmacy.

**Usage**

Stores the configuration of loyalty schemes such as point earning rules, redemption rules, minimum purchase amount, validity period, eligible products, customer categories, and promotional campaigns. Multiple loyalty programs can be created over time, allowing the pharmacy to run seasonal offers or targeted reward programs without changing the billing logic.

---

## 52. LoyaltyTransaction

**Purpose**

Maintains the complete history of loyalty points earned, redeemed, adjusted, or expired.

**Usage**

Records every loyalty-related transaction generated from customer purchases, returns, manual adjustments, promotional bonuses, or point redemptions. Each transaction stores the source document (such as Sales Invoice), points earned or redeemed, current balance, transaction date, and remarks. This provides a complete audit trail of a customer's loyalty account and enables accurate reward calculations.

# 10. Prescription

## 53. Prescription

**Purpose**

Represents a doctor's prescription issued to a patient.

**Usage**

Stores prescription details such as patient, prescribing doctor, prescription date, diagnosis (optional), prescription number, validity period, remarks, and overall prescription status. A prescription may be entered manually by the pharmacist, imported electronically, or linked to a scanned prescription. One prescription can contain multiple prescribed medicines stored in the PrescriptionItem table.

---

## 54. PrescriptionItem

**Purpose**

Stores the individual medicines prescribed within a Prescription.

**Usage**

Contains one record for each prescribed medicine, including medicine name, dosage, strength, frequency, duration, quantity, route of administration, substitution permissions, and pharmacist remarks. These records assist pharmacists during dispensing, ensure prescription compliance, and can be directly converted into Sales Invoice Items while maintaining a reference to the original prescription.

# 11. Synchronization

## 55. Outbox

**Purpose**

Stores all local data changes that need to be synchronized with the cloud server.

**Usage**

Whenever a record is created, updated, or deleted in the local SQLite database, a corresponding Outbox entry is created instead of immediately calling the server. Each entry contains the affected table, operation type (Create, Update, Delete), record identifier, payload, timestamp, retry count, and synchronization status. The synchronization service processes these entries in the background whenever an internet connection is available, making the application fully offline-first.

---

## 56. SyncLog

**Purpose**

Maintains the complete history of all synchronization operations between the local database and the cloud server.

**Usage**

Records every synchronization attempt, including start time, end time, synchronization direction (Upload or Download), number of records processed, success count, failure count, errors, and execution status. This information is used for troubleshooting synchronization issues, monitoring synchronization health, and generating diagnostic reports.

---

## 57. SyncConflict

**Purpose**

Tracks data conflicts that occur during synchronization.

**Usage**

Created whenever the same record has been modified in both the local SQLite database and the cloud PostgreSQL database before synchronization occurs. The table stores both versions of the data, identifies the conflicting fields, records the conflict reason, and tracks the chosen resolution strategy. Conflicts may be resolved automatically using predefined business rules or manually by the user when necessary.

# 12. Audit

## 58. AuditLog

**Purpose**

Maintains a complete audit trail of all business operations performed within the Pharmacy ERP.

**Usage**

Records every significant action performed by users or system processes, such as creating, updating, deleting, approving, cancelling, printing, logging in, logging out, and synchronizing records. Each audit entry captures the affected table, record identifier, operation type, user, timestamp, device, and other contextual information. This table supports regulatory compliance, security investigations, troubleshooting, and accountability.

---

## 59. ChangeHistory

**Purpose**

Maintains the history of data modifications made to individual records.

**Usage**

Stores the previous and new values whenever important business data changes. Each record identifies the table, affected column, old value, new value, user who made the change, modification date, and reason for the change (when applicable). This allows administrators to review historical changes, compare versions, restore previous values if necessary, and understand how data has evolved over time.

# 13. Configuration

## 60. Company

**Purpose**

Stores the master information of the pharmacy or organization operating the ERP.

**Usage**

Contains company details such as company name, legal name, GSTIN, Drug License Number, PAN, CIN (if applicable), address, contact information, logo, financial settings, and other statutory information. This table is referenced by invoices, reports, tax documents, and all official business communications.

---

## 61. Branch

**Purpose**

Represents an individual pharmacy branch, warehouse, or business location.

**Usage**

Stores branch-specific information including branch name, code, address, contact details, manager, GST registration (if applicable), stock location, and operational status. Supports multi-branch operations by allowing inventory, sales, purchases, employees, and financial transactions to be managed independently for each branch.

---

## 62. FinancialYear

**Purpose**

Defines the accounting periods used by the organization.

**Usage**

Stores financial year details such as start date, end date, status (Open, Closed, Archived), and closing information. Business transactions are associated with a financial year to support accounting reports, GST filings, year-end closing, and historical financial analysis.

---

## 63. SequenceGenerator

**Purpose**

Generates unique document numbers for various business transactions.

**Usage**

Maintains independent numbering sequences for documents such as Sales Invoice, Purchase Invoice, Purchase Order, Goods Receipt, Stock Adjustment, Payment Voucher, Receipt Voucher, and other business documents. Supports configurable prefixes, suffixes, financial-year-wise numbering, branch-wise numbering, and automatic sequence generation.

---

## 64. AppSetting

**Purpose**

Stores configurable application settings and business rules.

**Usage**

Maintains system-wide configuration values such as default currency, tax calculation method, rounding rules, barcode settings, expiry alerts, stock warning levels, invoice printing preferences, synchronization settings, backup schedules, and other configurable parameters. This eliminates the need to hardcode business rules within the application.

---

## 65. PrinterConfiguration

**Purpose**

Stores printer configuration for different business documents.

**Usage**

Maintains printer assignments for invoice printing, barcode labels, shelf labels, prescriptions, purchase reports, stock reports, and other printable documents. Supports multiple printers, paper sizes, print templates, and branch-specific printer configurations.

---

## 66. BarcodeConfiguration

**Purpose**

Defines barcode generation and printing settings.

**Usage**

Stores barcode formats (Code 128, QR Code, EAN-13, etc.), barcode prefixes, label dimensions, font sizes, print layouts, and barcode generation rules. This allows consistent barcode printing for medicines, inventory labels, and business documents across all branches.

---

## 67. BackupConfiguration *(Recommended Addition)*

**Purpose**

Stores backup and restore configuration for the local database.

**Usage**

Maintains automatic backup schedules, backup locations, retention policies, compression settings, encryption options, and cloud backup preferences. Since your ERP is offline-first with SQLite, automated backups are critical to prevent data loss and simplify disaster recovery.

---

## Recommended Configuration Architecture

```text
                    Company
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
      Branch                 Financial Year
          │                         │
          ├────────────┐            │
          ▼            ▼            ▼
  SequenceGenerator  AppSetting  PrinterConfiguration
          │            │            │
          └────────────┼────────────┘
                       ▼
              BarcodeConfiguration
                       │
                       ▼
              BackupConfiguration
```

## Why these tables?

These tables contain **configuration data**, not **transaction data**.

Unlike Sales, Purchase, or Inventory tables, configuration records change infrequently but are referenced by almost every module in the ERP.

Examples:

- **Company** → Printed on invoices and reports.
- **Branch** → Identifies where transactions occur.
- **FinancialYear** → Determines accounting periods.
- **SequenceGenerator** → Produces document numbers.
- **AppSetting** → Controls application behavior.
- **PrinterConfiguration** → Determines where documents are printed.
- **BarcodeConfiguration** → Controls barcode generation.
- **BackupConfiguration** → Protects business data.

Keeping these settings in dedicated tables makes the ERP highly configurable without requiring code changes when business requirements evolve.

# 14. Lookup / Masters

## 68. Country

**Purpose**

Maintains the master list of countries used throughout the Pharmacy ERP.

**Usage**

Stores country names, ISO country codes, dialing codes, currency information, and other country-specific metadata. This table is referenced by addresses, company information, suppliers, customers, employees, and regulatory documents to ensure consistent country selection across the application.

---

## 69. State

**Purpose**

Maintains the master list of states or provinces belonging to a country.

**Usage**

Stores state names, state codes, GST state codes, and references to the corresponding country. It is used while maintaining addresses, GST compliance, taxation, logistics, reporting, and geographical filtering throughout the ERP.

---

## 70. City

**Purpose**

Maintains the master list of cities within each state.

**Usage**

Stores city names and their associated state. Referenced by Party Addresses, Company, Branches, Suppliers, Customers, Doctors, Employees, and other modules requiring geographical information. Maintaining a centralized city master improves address consistency and reporting accuracy.

---

## 71. Area

**Purpose**

Maintains the master list of localities, areas, or regions within a city.

**Usage**

Stores locality names, postal codes (optional), delivery zones, and references to the parent city. Used for customer addresses, supplier locations, delivery planning, route optimization, home delivery services, sales analysis by locality, and branch service area management.

---

## Recommended Lookup Architecture

```text
Country
    │
    ▼
 State
    │
    ▼
  City
    │
    ▼
  Area
    │
    ▼
PartyAddress
    │
    ├── Customer
    ├── Supplier
    ├── Doctor
    ├── Employee
    ├── Company
    └── Branch
```

## Why use Lookup Tables?

Lookup tables store **reference data** that changes very rarely but is used throughout the application.

Instead of storing text like:

```
Country = India
State   = Maharashtra
City    = Pune
Area    = Kothrud
```

in thousands of records, the ERP stores only the corresponding IDs.

This provides several benefits:

- Eliminates duplicate data.
- Ensures consistent spelling across the system.
- Simplifies searching and reporting.
- Improves data integrity using foreign keys.
- Makes future updates easier if geographical information changes.

## Future Lookup Tables

As the Pharmacy ERP grows, you will likely introduce additional lookup/master tables, such as:

- Currency
- Language
- Department
- Designation
- Gender
- BloodGroup
- PaymentMethod
- TaxCategory
- DiscountType
- AddressType
- ContactType
- PartyType
- DocumentType
- UnitCategory
- DosageForm
- MedicineRoute
- PrescriptionFrequency
- ReturnReason
- AdjustmentReason
- TransferStatus
- InvoiceStatus
- PurchaseStatus
- StockMovementType
- NotificationType

These lookup tables centralize business values, making the application more configurable, maintainable, and consistent without requiring code changes.

