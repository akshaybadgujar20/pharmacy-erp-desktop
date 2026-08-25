# Customer — Future Enhancements

## Purpose

Capture planned evolution of the Customer domain without committing to implementation timelines. Guides ADO backlog and ADR discussions.

## Responsibilities

- List deferred capabilities and known gaps.
- Avoid scope creep in current phase implementations.

## Scope

### In Scope

- Customer master data, loyalty, credit, integrations roadmap.

### Out of Scope

- Implementation details for other domains.

## Related Entities

Current model: [party_management.md](../../database/tables/party_management/party_management.md), [loyalty.md](../../database/tables/loyalty/loyalty.md).

## Planned Capabilities

### Master data

| Enhancement | Rationale |
|-------------|-----------|
| Customer segmentation tags | Marketing and pricing cohorts |
| Duplicate Party merge workflow | Data quality |
| `PARTY:PARTY:READ` permission | Separate read-only clerks |
| Branch-scoped customer visibility | Multi-branch franchise |
| Import/export CSV with validation report | Migration from legacy systems |

### Credit and finance

| Enhancement | Rationale |
|-------------|-----------|
| Per-branch credit limits | Corporate accounts across branches |
| Credit hold / suspend state | Temporary block without deactivation |
| Automated dunning reminders | Outstanding receivable management |
| Real-time outstanding from ledger only | Remove denormalized cache |

### Loyalty

| Enhancement | Rationale |
|-------------|-----------|
| Multi-program enrollment per customer | Campaign targeting |
| Tiered membership (Silver/Gold) | Beyond flat program rules |
| Points expiry batch job | EXPIRY transactions scheduled |
| `LOYALTY:TRANSACTION:CREATE` permission | Formalize manual adjustments |
| Product/category-specific earn rules | Merchandising |

### Compliance and privacy

| Enhancement | Rationale |
|-------------|-----------|
| Consent tracking for marketing | Regulatory |
| Right-to-erasure workflow | GDPR-style requests |
| PII field-level encryption at rest | Security hardening |

## Business Rules

Future features must preserve invariants in [invariants.md](invariants.md) or explicitly version the model.

## Domain Events

New events anticipated: `CustomerMerged`, `CustomerSegmentAssigned`, `LoyaltyPointsExpired`.

## State Model

Potential **Suspended** state between Active and Inactive — requires state machine update.

## Integrations

- External CRM webhook on `CustomerRegistered`.
- SMS gateway on loyalty earn milestones.
- Insurance eligibility API for corporate customers.

## Security Considerations

- Merge and erase workflows need dual approval and full audit trail.

## Performance Considerations

- Customer search at scale may require dedicated read model (Elasticsearch/SQLite FTS).

## Dependencies

- Finance receivable sub-ledger maturity for real-time outstanding.
- Loyalty phase ADO: [011_loyalty_customer_rewards.md](../../ado/011_loyalty_customer_rewards.md).
