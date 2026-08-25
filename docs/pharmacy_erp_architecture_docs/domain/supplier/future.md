# Supplier — Future Enhancements

## Purpose

Roadmap for Supplier domain beyond current Party + Supplier + Payment integration.

## Responsibilities

- Deferred features and dependencies.

## Scope

Supplier master, payments, contracts, compliance.

## Related Entities

Current: [party_management.md](../../database/tables/party_management/party_management.md), [financial.md](../../database/tables/financial/financial.md).

## Planned Capabilities

### Master data

- Supplier contracts module — [contracts.md](contracts.md)
- Vendor qualification and document expiry alerts (drug license renewal)
- Multi-currency supplier support
- Supplier bank account sub-entity for payment files
- `PARTY:PARTY:READ` and branch-scoped vendor lists

### Payments and finance

- `FINANCE:PAYMENT:*` permission seeding
- Payment approval workflow above threshold
- TDS/GST withholding on payments
- Supplier statement PDF from Payment + PurchaseInvoice
- Advance adjustment automation against invoices

### Procurement integration

- Vendor scorecard (on-time delivery, rejection rate)
- Auto-suggest preferred supplier by medicine
- Block PO when drug license expired

### Compliance

- e-Invoice integration for purchase
- State-wise drug license format validation
- Audit pack export for statutory inspection

## Business Rules

Future rules must not break payable invariants — outstanding ≥ 0, ledger as source of truth.

## Domain Events

Anticipated: `SupplierContractActivated`, `DrugLicenseExpiring`, `PaymentApprovalRequired`.

## State Model

Possible **Qualified** pre-Active state for new vendors.

## Integrations

- Government GSTIN verification API
- Bank NEFT file generation
- Email PO to supplier contact from PartyContact

## Security Considerations

- Segregation of duties for payment approval
- Encrypt supplier bank details at rest

## Performance Considerations

- Supplier autocomplete FTS index at 10k+ vendors

## Dependencies

- Phase 09 financial ADO: [009_financial_management_accounting.md](../../ado/009_financial_management_accounting.md)
- Purchasing domain maturity for contract price default
