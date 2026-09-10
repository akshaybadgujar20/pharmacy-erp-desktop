# ADR-011: LedgerPostingService in persistence module (shared double-entry)

**Status:** Active  
**Confidence:** Strongly inferred  
**Modules:** Persistence, finance, purchase, sales

---

## Problem / Context

Purchase and sales invoice post flows need balanced double-entry vouchers with financial-year validation; logic must not be duplicated per module.

## Question Discussed

Where should voucher posting and reversal live?

## Options Considered

1. Shared `LedgerPostingService` in `persistence/ledger/`
2. Finance-module-only posting with purchase/sales calling finance HTTP internally
3. Inline ledger inserts in each workflow service

## Decision Selected

**LedgerPostingService** in persistence module — `postVoucher` / `reverseVoucher` with debit=credit validation and open FY check via finance util.

## Rationale

Documented in persistence-patterns.md as shared consumer for purchase-invoice, sales-invoice, sales-payment, sales-return, payment, receipt. Rationale for persistence vs finance module placement not explicitly recorded in chat.

## Architectural Impact

- `finance.util.ts` builds line payloads; `LedgerPostingService` posts them
- Ledger balance never stored — derived from immutable `LedgerEntry` rows
- Finance module owns COA admin; posting primitive is cross-cutting

## Historical Source

- [`database/persistence-patterns.md`](../../database/persistence-patterns.md) — Ledger posting section (Doc 03 cross-check)
