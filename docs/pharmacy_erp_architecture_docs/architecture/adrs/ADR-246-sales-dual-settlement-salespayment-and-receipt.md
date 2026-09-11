# ADR-246: Sales settlement via nested SalesPayment and Finance Receipt

**Status:** Active  
**Confidence:** Strongly inferred  
**Modules:** sales, finance

---

## Problem / Context

Customer collections can be recorded in sales or finance modules.

## Question Discussed

How do SalesPayment and Finance Receipt interact?

## Options Considered

1. SalesPayment only
2. Receipt only
3. Both share recomputeSalesInvoiceSettlement

## Decision Selected

Both paths update paidAmount/balanceAmount via recomputeSalesInvoiceSettlement; Receipt uses referenceType SALES_INVOICE.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

SalesPayment only; Receipt only

## Historical Source

- Doc 20 — sales-module.md settlement section

