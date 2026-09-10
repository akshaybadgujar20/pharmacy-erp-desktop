# ADR-014: SettingsService with in-memory cache for runtime toggles

**Status:** Active  
**Confidence:** Explicit  
**Modules:** Settings, purchase, sales

---

## Problem / Context

Feature modules need runtime configuration (GRN without PO, MRP cap, expired sale flags) without hardcoding or hitting DB on every post.

## Question Discussed

How should `AppSetting` rows be read by other modules?

## Options Considered

1. `SettingsService` with typed getters + short-lived in-memory cache per key
2. Direct Prisma reads in each consumer
3. Environment variables only

## Decision Selected

**SettingsService** — `getBoolean`/`getString`/etc. with branch→company fallback and ~60s cache; mutations via settings HTTP API with audit+outbox.

## Rationale

Early foundations Phase 1c; purchase and sales import `SettingsModule` for runtime reads.

## Architectural Impact

- Keys in `setting-keys.constants.ts`
- `PurchaseModule` and `SalesModule` Nest-import SettingsModule
- Pricing does not import settings — sales reads price lists directly

## Historical Source

- [`plans/early-foundations_4083198d.plan.md`](../../../../plans/early-foundations_4083198d.plan.md) — Phase 1c (Doc 04)
