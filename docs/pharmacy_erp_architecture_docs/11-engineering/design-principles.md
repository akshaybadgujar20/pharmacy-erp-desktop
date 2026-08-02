# Design Principles

> Source: Original Architecture Handbook

## Principle 1
### Simplicity

Simple code lasts longer.

Avoid unnecessary abstraction.

---

## Principle 2
### Modularity

Every business domain lives independently.

Examples:

- Inventory
- Sales
- Purchase
- Supplier
- Reports
- Users
- Billing

Never mix business logic.

---

## Principle 3
### Single Responsibility

Each class should have only one responsibility.

Bad

```
SalesService
    Save Sale
    Print Invoice
    Send SMS
    Sync Data
```

Good

```
SalesService
InvoiceService
PrinterService
SMSService
SyncService
```

---

## Principle 4
### Offline First

The application should never depend on internet availability.

Internet is an enhancement—not a requirement.

---

## Principle 5
### Performance First

Every screen should feel instant.

Targets

- Medicine Search < 200ms
- Invoice Save < 500ms
- Barcode Scan < 100ms

---
