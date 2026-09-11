# ADR-227: New configuration/ module for Company, Branch, FY, sequences, printer, barcode

**Status:** Active  
**Confidence:** Explicit  
**Modules:** configuration

---

## Problem / Context

Org and device config tables need admin APIs.

## Question Discussed

Where do non-AppSetting config tables live?

## Options Considered

1. New configuration/ module
2. All in SettingsModule
3. Seed only

## Decision Selected

New `configuration/` module for Company, Branch, FinancialYear, SequenceGenerator, PrinterConfiguration, BarcodeConfiguration.

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

All config tables in SettingsModule; Seed only no HTTP

## Historical Source

- Doc 18 — subagent draft ADR-117

**Phase 2 draft cross-ref:** subagent draft ADR-117

