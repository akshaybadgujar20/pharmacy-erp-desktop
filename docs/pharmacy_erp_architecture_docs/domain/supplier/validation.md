# Supplier — Validation

## Purpose

Input validation for supplier commands and DTOs.

## Responsibilities

- Field rules, formats, cross-field checks, error mapping.

## Scope

Party, Supplier, address, contact validation.

## Related Entities

[06_supplier.md](../../database/tables/party_management/06_supplier.md).

## Validation Rules

### Supplier

| Field | Rules |
|-------|-------|
| `supplierType` | Required; MANUFACTURER, DISTRIBUTOR, WHOLESALER, OTHER |
| `supplierCode` | Generated on create; max 30 chars |
| `gstin` | Optional; 15 chars; pattern `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$` |
| `drugLicenseNumber` | Optional; max 50 |
| `panNumber` | Optional; 10 chars PAN pattern |
| `creditLimit` | ≥ 0 |
| `paymentTermsDays` | Integer ≥ 0 |
| `preferredSupplier` | Boolean |
| `outstandingAmount` | Read-only on API |

### Party (supplier registration)

| Field | Rules |
|-------|-------|
| `partyType` | Usually ORGANIZATION for vendors |
| `displayName` | Required; max 200 |
| `organizationName` | Required when ORGANIZATION |

### Cross-field

| Rule | Check |
|------|-------|
| GSTIN unique | DB lookup excluding self on update |
| Manufacturer type | Warn if drugLicenseNumber empty |
| Version | Required on update for optimistic lock |

## Business Rules

Implements BR-S10–BR-S13 from [business-rules.md](business-rules.md).

## Domain Events

Validation failure → HTTP 400; no events.

## State Model

Cannot activate without passing statutory warnings policy.

## Integrations

class-validator on NestJS DTOs; domain validation for GSTIN checksum (future).

## Security Considerations

Reject script injection in organizationName and address fields.

## Performance Considerations

GSTIN uniqueness via indexed query.

## Future Enhancements

Online GSTIN verification API integration.
