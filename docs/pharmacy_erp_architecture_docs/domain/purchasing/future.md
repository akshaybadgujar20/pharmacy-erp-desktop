# Purchasing — Future Enhancements

## Purpose

Roadmap for procurement capabilities beyond current PO → GRN → invoice → return implementation.

**Database reference (current):** [Purchase overview](../../database/tables/purchase/purchase.md)

## Responsibilities

- Guide prioritization without committing delivery dates
- Flag cross-domain dependencies

## Scope

### In Scope

- Planned purchasing features
- Integration and permission expansions

### Out of Scope

- Detailed technical design for unreleased work

## Related Entities

Current eight purchase tables; future tables for RFQ, contracts, ASN.

## Business Rules

Future work must preserve:

- GRN as sole inbound stock creation path (unless explicit ADR for consignment)
- Branch-scoped document numbers
- Atomic post with outbox + audit

## Domain Events

Extend [events.md](./events.md) with versioned payloads when adding RFQ/contract events.

## State Model

New documents (RFQ, ASN) need distinct status enums — do not overload PO status.

## Integrations

| Initiative | Touchpoints |
|------------|-------------|
| Three-way match | PO, GRN, invoice lines |
| Supplier portal | PO send, ASN inbound |
| Reorder automation | Inventory min/max, PO generate |
| Landed cost | GRN freight allocation to batch cost |
| EDI | External message maps to PO/GRN |
| Quality hold | GRN post to quarantine stock status |

## Security

- Expand seed: `PURCHASE:GOODS_RECEIPT:POST`, `PURCHASE:PURCHASE_ORDER:APPROVE`, `PURCHASE:PURCHASE_INVOICE:CREATE`, `PURCHASE:PURCHASE_RETURN:APPROVE`
- API keys for supplier portal scoped per supplier

## Performance

- HO consolidation: nightly sync of posted GRNs vs real-time outbox
- Archive completed POs older than retention window

## Future

### Near term

1. Full permission matrix in security seed
2. PO approval threshold and segregation of duties setting
3. GRN–invoice qty/cost variance report

### Medium term

4. Approved vendor list per medicine
5. OCR supplier invoice capture
6. Debit note from purchase return

### Long term

7. RFQ and comparative quote tables
8. Import shipment with customs landed cost
9. Direct distributor catalog sync (API ordering)
