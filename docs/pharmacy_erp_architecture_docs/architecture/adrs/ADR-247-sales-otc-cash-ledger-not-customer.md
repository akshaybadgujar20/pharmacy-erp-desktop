# ADR-247: OTC sales without customerId post to CASH001 not CUST001

**Status:** Active  
**Confidence:** Strongly inferred  
**Modules:** sales, finance

---

## Problem / Context

Walk-in sales may have no customer master record.

## Question Discussed

Which ledger accounts for invoices without customerId?

## Options Considered

1. CASH001 cash ledger
2. CUST001 receivable
3. Error if no customer

## Decision Selected

OTC invoices without customerId debit/credit CASH001 on post and return.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

CUST001 receivable; Error if no customer

## Historical Source

- Doc 20 — sales-module.md settlement section

