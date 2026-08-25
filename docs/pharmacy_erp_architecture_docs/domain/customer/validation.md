# Customer — Validation

## Purpose

Define input validation rules for customer commands and DTOs at API boundary and domain layer.

## Responsibilities

- List field constraints, formats, and cross-field validation.
- Map validation failures to application error codes.

## Scope

### In Scope

- Party, PartyRole, PartyAddress, PartyContact, Customer command validation.

### Out of Scope

- Sales invoice validation, loyalty program configuration validation.

## Related Entities

Column constraints from [01_party.md](../../database/tables/party_management/01_party.md), [05_customer.md](../../database/tables/party_management/05_customer.md), [03_party_address.md](../../database/tables/party_management/03_party_address.md), [04_party_contact.md](../../database/tables/party_management/04_party_contact.md).

## Validation Rules

### Party

| Field | Rules |
|-------|-------|
| `partyType` | Required; enum PERSON, ORGANIZATION |
| `displayName` | Required; max 200 chars; trim whitespace |
| `firstName`, `lastName` | Required when PERSON; max 100 each |
| `organizationName` | Required when ORGANIZATION; max 200 |
| `isActive` | Boolean |

### Customer

| Field | Rules |
|-------|-------|
| `customerType` | Required; RETAIL, WHOLESALE, CORPORATE |
| `customerCode` | Optional on create (generated); max 30; alphanumeric |
| `creditLimit` | Required; ≥ 0; max 12,2 decimal |
| `paymentTermsDays` | Required; integer ≥ 0 |
| `isTaxExempt` | Boolean |
| `loyaltyPoints` | Read-only on API update (reject if present) |

### PartyAddress

| Field | Rules |
|-------|-------|
| `addressType` | HOME, WORK, BILLING, SHIPPING |
| `line1` | Required; max 200 |
| `city`, `state` | Required for billing/shipping types |
| `postalCode` | Format per country setting |
| `isPrimary` | At most one primary per addressType per party |

### PartyContact

| Field | Rules |
|-------|-------|
| `contactType` | PHONE, EMAIL, WHATSAPP |
| `contactValue` | Required; phone E.164 or local format; email RFC5322 subset |
| `isPrimary` | At most one primary per contactType |

### Cross-field

| Rule | Validation |
|------|------------|
| Person vs org | PERSON requires firstName; ORGANIZATION requires organizationName |
| Credit vs type | CORPORATE with credit sales enabled should have creditLimit > 0 (warning) |
| Version | Update DTO must include matching `version` for optimistic lock |

## Business Rules

Validation enforces BR-C01–BR-C05 from [business-rules.md](business-rules.md) before persistence.

## Domain Events

Failed validation does not emit events; returns `400` with field errors via `ValidationPipe`.

## State Model

Cannot transition to Active if required Party/Customer validation fails.

## Integrations

- class-validator decorators on NestJS DTOs (`whitelist`, `forbidNonWhitelisted`).
- Domain-level validation in PartyCustomerService for rules not expressible declaratively.

## Security Considerations

- Sanitize displayName and address lines against XSS for web UI rendering.
- Reject bulk export fields in update DTOs.

## Performance Considerations

- Unique checks (`customerCode`) use indexed lookup; avoid full table scan.

## Future Enhancements

- GSTIN validation for corporate customers when B2B billing added.
- Duplicate detection on phone number fuzzy match.
