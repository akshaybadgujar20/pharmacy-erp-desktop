# Supplier — Terminology

## Purpose

Ubiquitous language for the Supplier bounded context aligned with party management and financial payment vocabulary.

## Responsibilities

- Map business terms to database columns and cross-context references.

## Scope

Supplier master data and payment terminology; not purchase invoice line items.

## Related Entities

[06_supplier.md](../../database/tables/party_management/06_supplier.md), [financial.md](../../database/tables/financial/financial.md).

## Glossary

| Term | Definition | Persistence |
|------|------------|-------------|
| **Supplier** | Party in vendor role | `Supplier` + Party |
| **Supplier Code** | Unique code (`SUP00001`) | `Supplier.supplierCode` |
| **Supplier Type** | MANUFACTURER, DISTRIBUTOR, WHOLESALER, OTHER | `Supplier.supplierType` |
| **GSTIN** | GST Identification Number (India) | `Supplier.gstin` |
| **Drug License Number** | State drug license for pharma vendors | `Supplier.drugLicenseNumber` |
| **PAN** | Permanent Account Number | `Supplier.panNumber` |
| **Preferred Supplier** | Suggested default on PO entry | `Supplier.preferredSupplier` |
| **Payable Outstanding** | Amount owed to supplier | `Supplier.outstandingAmount`; ledger-derived |
| **Payment Terms** | Credit days from supplier | `Supplier.paymentTermsDays` |
| **Supplier Payment** | Outgoing payment voucher | `Payment.paymentType = SUPPLIER_PAYMENT` |
| **Party** | Shared identity root | `Party` |

## Business Rules

- Use **Supplier** in purchasing screens; **Party** in unified master-data admin.
- **Vendor** is an acceptable synonym in UI labels but code uses Supplier.

## Domain Events

`SupplierPaymentCompleted` refers to Finance Payment post, not PurchaseInvoice creation.

## State Model

**Inactive supplier** — no new POs; existing payables remain.

## Integrations

Payment references supplier via business reference fields on `Payment` — see [payments.md](payments.md).

## Security Considerations

GSTIN/PAN are tax identifiers — restrict export in reports.

## Performance Considerations

Autocomplete searches `displayName` (Party) and `supplierCode`.

## Future Enhancements

**Contract** term reserved for future module — see [contracts.md](contracts.md).
