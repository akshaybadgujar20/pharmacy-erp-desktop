# Migration Strategy

## Current state

- **Schema:** Prisma multi-file layout under `backend/prisma/`; SQLite locally (`db/pharmacy.sqlite`)
- **Migrations:** Prisma migrate; `npm run db:reset` for dev fresh start
- **Seed:** deterministic `backend/seed/` — masters, security, demo users (`admin123`)
- **Cloud target:** PostgreSQL via shared logical model — see [prisma_sqlite_jpa_postgres_alignment](../database/prisma_sqlite_jpa_postgres_alignment.md)

## Implemented

| Area | Approach |
|------|----------|
| Fresh dev DB | `cd backend && npm run db:seed:fresh` or `db:reset` |
| Schema changes | Prisma migration + review in release checklist |
| ID strategy | BigInt local PK + UUID sync identity on all syncable entities |
| Status fields | String (not Prisma enums) for SQLite/Postgres parity |

## Planned (customer data migration)

Help customers migrate from Excel, legacy ERP, or CSV exports:

- Import wizard with preview and validation
- Staged import: masters first (Medicine, Party), then opening stock, then historical invoices (optional)
- Rollback on validation failure
- Error report per row

**Not implemented yet.** Initial deployments use seed data or manual master entry.

## Rules for imports

- Medicines keyed by name/barcode; batches by `(medicineId, batchNumber)`
- Parties created once in `Party` with roles assigned via `PartyRole`
- Opening stock creates `Batch` + `Stock` + opening `StockMovement` per branch
- Never import with local BigInt ids as sync keys — generate UUIDs

## Related

- [Engineering standards — release checklist](../architecture/engineering-standards.md)
- [Early foundations — database commands](../architecture/early-foundations.md#local-development)
