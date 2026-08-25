# Supplier — Permissions

## Purpose

Authorization for supplier master-data and payment operations.

## Responsibilities

- Map operations to RBAC permission codes.

## Scope

Party/supplier writes and financial payment actions.

## Related Entities

Seed: `PARTY_MANAGE` → `PARTY:PARTY:UPDATE`.

## Permission Model

| Permission | Module:Resource:Action | Seeded | Use |
|------------|------------------------|--------|-----|
| `PARTY:PARTY:UPDATE` | PARTY:PARTY:UPDATE | Yes | Register, update, deactivate supplier |
| `PARTY:PARTY:READ` | PARTY:PARTY:READ | Planned | View supplier master |
| `FINANCE:PAYMENT:CREATE` | FINANCE:PAYMENT:CREATE | Planned | Post supplier payment |
| `FINANCE:PAYMENT:READ` | FINANCE:PAYMENT:READ | Planned | View payment history |
| `FINANCE:PAYMENT:CANCEL` | FINANCE:PAYMENT:CANCEL | Planned | Cancel/reverse payment |
| `PURCHASE:SUPPLIER:READ` | PURCHASE:SUPPLIER:READ | Planned | PO entry lookup |

## Operation Matrix

| Operation | Permission |
|-----------|------------|
| Register / update supplier | `PARTY:PARTY:UPDATE` |
| View supplier on PO screen | `PURCHASE_CREATE` or `PARTY:PARTY:READ` |
| Create supplier payment | `FINANCE:PAYMENT:CREATE` |
| View supplier ledger | `FINANCE:PAYMENT:READ` or `REPORT:REPORT:READ` |
| Cancel posted payment | `FINANCE:PAYMENT:CANCEL` + supervisor |

## Business Rules

- Payment permissions strictly separate from party edit — accounts payable clerk may pay without editing GSTIN.
- Statutory field edit may require manager role mapping on `PARTY:PARTY:UPDATE`.

## Domain Events

Audit captures user and permission set on mutations.

## State Model

Read permissions allow viewing inactive suppliers for history.

## Integrations

NestJS `@RequirePermissions` guards; JWT carries permission codes.

## Security Considerations

Segregation of duties: user who creates supplier should not approve own first payment (future policy).

## Performance Considerations

Permission cache in JWT session.

## Future Enhancements

Branch-scoped supplier visibility permission.
