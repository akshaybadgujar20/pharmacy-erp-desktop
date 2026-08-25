# Customer — Integration

## Purpose

Describe how the Customer bounded context integrates with adjacent domains, shared services, and external systems.

## Responsibilities

- Define integration points, data flow direction, and identifier strategy.
- Link to table overviews for persistence details.

## Scope

### In Scope

- Sales, Finance, Loyalty, Sync, Audit, Settings.

### Out of Scope

- Supplier and purchasing integrations.

## Related Entities

| Context | Link |
|---------|------|
| Party management | [party_management.md](../../database/tables/party_management/party_management.md) |
| Loyalty | [loyalty.md](../../database/tables/loyalty/loyalty.md) |
| Financial | [financial.md](../../database/tables/financial/financial.md) |

## Integration Points

### Sales

| Direction | Mechanism | Details |
|-----------|-----------|---------|
| Customer → Sales | FK `SalesInvoice.customerId` | Walk-in default customer seeded |
| Sales → Loyalty | Invoice post hook | Creates `LoyaltyTransaction` |
| Sales → Customer | Credit check | Reads `creditLimit`, `outstandingAmount` |

Sales must reference `Customer.id` locally; sync payloads use `customerUuid`.

### Finance

| Direction | Mechanism | Details |
|-----------|-----------|---------|
| Sales → LedgerEntry | Invoice post | Debits Customer Receivable |
| Receipt → LedgerEntry | Receipt post | Credits receivable; reduces outstanding |
| Finance → Customer | Reconciliation job | Updates `outstandingAmount` cache |

Receivable sub-ledger links to party/customer via ledger configuration — see [45_ledger.md](../../database/tables/financial/45_ledger.md).

### Loyalty

| Direction | Mechanism | Details |
|-----------|-----------|---------|
| LoyaltyProgram → Sales | Active program selection | Default program flag |
| Sales → LoyaltyTransaction | EARN/REDEEM on post | [52_loyalty_transaction.md](../../database/tables/loyalty/52_loyalty_transaction.md) |
| Loyalty → Customer | Cache update | `loyaltyPoints` denormalized |

Points authoritative source is transaction sum — see [loyalty.md](../../database/tables/loyalty/loyalty.md).

### Sync (offline-first)

- All entities expose `uuid`; outbox publishes Party/Customer changes.
- Conflict resolution: last-write-wins on profile fields with `version` check.
- Tombstone sync via `deletedAt` on Party.

### Audit

- `AuditService.log` in same `UnitOfWork` as customer mutations.
- Module: `PARTY`; actions: REGISTER, UPDATE, DEACTIVATE.

### Settings

- Default walk-in customer uuid from `AppSetting` (branch → company fallback).
- Loyalty enabled flag may gate WF-C04/C05.

## Business Rules

- Cross-context calls must not bypass aggregate services (no direct Prisma from Sales to Party tables except read repositories).

## Domain Events

Integration handlers subscribe to events in [events.md](events.md); prefer outbox consumer pattern over synchronous coupling.

## State Model

Inactive customers remain readable by Finance for aging reports; hidden from Sales picker.

## Security Considerations

- Cross-context reads respect same JWT and branch scope.
- Sync payloads minimize PII on edge devices.

## Performance Considerations

- Customer lookup cache at POS invalidated on `CustomerProfileUpdated` event.
- Batch sync of customer master during off-peak hours.

## Future Enhancements

- REST API for external CRM bidirectional sync.
- HL7/FHIR patient link for hospital pharmacy (Doctor + Customer dual role).
