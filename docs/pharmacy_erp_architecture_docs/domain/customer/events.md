# Customer — Domain Events

## Purpose

Document domain events emitted by the Customer bounded context for audit, integration, cache invalidation, and outbox-based sync.

## Responsibilities

- Define event names, payloads, triggers, and consumers.
- Distinguish domain events from integration/event-bus technical messages.

## Scope

### In Scope

- Customer aggregate and loyalty-related events owned or initiated by customer workflows.

### Out of Scope

- SalesInvoicePosted (Sales domain) — though it triggers loyalty earn downstream.

## Related Entities

Party, Customer, LoyaltyProgram, LoyaltyTransaction.

## Event Catalog

### Customer aggregate events

| Event | Trigger | Payload (key fields) | Consumers |
|-------|---------|----------------------|-----------|
| `CustomerRegistered` | Party + Customer + role saved | `partyUuid`, `customerUuid`, `customerCode`, `customerType`, `displayName` | Audit, search index, outbox |
| `CustomerProfileUpdated` | Party/address/contact/customer fields changed | `customerUuid`, `changedFields[]`, `version` | Audit, CRM sync |
| `CustomerCreditLimitChanged` | `creditLimit` updated | `customerUuid`, `oldLimit`, `newLimit`, `changedBy` | Audit, sales credit cache |
| `CustomerDeactivated` | isActive false on customer or role | `customerUuid`, `reason` | Sales block list |
| `CustomerReactivated` | reverse deactivation | `customerUuid` | Sales allow list |
| `CustomerArchived` | soft delete | `partyUuid`, `deletedAt` | Sync tombstone |

### Loyalty events (customer context)

| Event | Trigger | Payload | Consumers |
|-------|---------|---------|-----------|
| `LoyaltyPointsEarned` | Sales posts EARN transaction | `customerUuid`, `transactionUuid`, `points`, `invoiceUuid` | Customer cache, SMS optional |
| `LoyaltyPointsRedeemed` | Sales posts REDEEM | `customerUuid`, `points`, `invoiceUuid` | Customer cache |
| `LoyaltyPointsAdjusted` | Manual ADJUSTMENT | `customerUuid`, `points`, `remarks`, `authorizedBy` | Audit |
| `LoyaltyTransactionReversed` | REVERSAL type posted | `originalTransactionUuid`, `reversalUuid` | Balance recalc |

## Business Rules

- Events publish **after** database commit via outbox pattern (`UnitOfWork`).
- Payloads use `uuid` identifiers only for cross-device sync.
- `CustomerProfileUpdated` should not include full PII in outbox payload when syncing to untrusted devices — use field-level policy.

## Domain Events

Event naming: past tense, PascalCase, business language (not CRUD).

## State Model

Only **Active** customers emit earn events; deactivated customers reject earn at source (Sales guard).

## Integrations

| Consumer | Events subscribed |
|----------|-------------------|
| AuditService | All customer and loyalty adjustment events |
| Outbox | `CustomerRegistered`, `CustomerProfileUpdated`, loyalty earn/redeem |
| Search / POS cache | `CustomerRegistered`, `CustomerProfileUpdated`, `CustomerDeactivated` |
| Finance (informational) | `CustomerCreditLimitChanged` |

Cross-reference: [loyalty.md](../../database/tables/loyalty/loyalty.md) for transaction types.

## Security Considerations

- Event payloads must not contain secrets (full phone numbers in logs — use masking).
- Loyalty adjustment events require `authorizedBy` employee id.

## Performance Considerations

- Batch profile imports should debounce `CustomerProfileUpdated` or emit single `CustomersBulkImported`.

## Future Enhancements

- Cloud webhook `CustomerRegistered` for external CRM.
- Event sourcing read model for customer timeline UI.
