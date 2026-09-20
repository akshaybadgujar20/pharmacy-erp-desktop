# Pharmacy ERP seed data

Indian pharmacy demo data for local SQLite development.

## Layout

``` text
seed/
├── seed.ts                 # CLI entrypoint
├── lib/
│   ├── prisma-client.ts    # Prisma + better-sqlite3 adapter
│   ├── hydrate.ts          # DB re-sync for append / --only resume
│   ├── load-json.ts
│   ├── id-registry.ts
│   ├── seed-context.ts
│   ├── wipe.ts
│   └── generators/         # programmatic data
└── data/                   # static JSON masters (stable UUIDs)
    ├── geo/
    ├── configuration/
    ├── medicine/
    ├── pricing/
    └── security/
```

## What is JSON vs generated

| Source | Content |
|--------|---------|
| JSON | Country/state/city/area, company, branches, financial year, sequences, app settings, barcode/printer config, UOM, categories, schedules, generics, salts, tax, permissions/roles |
| Generated | Parties (customers, suppliers, doctors, employees), manufacturers, 50 medicines, 100 batches, price lists, inventory, purchase chain, ~100 sales invoices, 100 outbox rows, financial/audit samples |

Transactional rows use `@faker-js/faker` with seed `42026` for repeatability (UUIDs are random but volume/structure is stable).

## Target volumes (approximate, per fresh run)

| Domain | Target |
|--------|--------|
| Sales invoices | 100 |
| Batches | 100 |
| Stock movements | 100+ |
| Outbox | 100 |
| Parties | 100 (80 business parties + 20 manufacturers) |
| Medicines | 50 |

## CLI

Run from `backend/`:

``` bash
npm run db:seed:fresh          # wipe database, then full seed
npm run db:seed                # append / idempotent re-run (no wipe)
npm run db:seed -- --only sales   # resume from sales phase onward
npm run db:reset               # prisma db push --force-reset + fresh seed
```

Direct invocation:

``` bash
npx tsx seed/seed.ts --fresh
npx tsx seed/seed.ts
npx tsx seed/seed.ts --only sales
```

### Modes

| Mode | Flags | Behavior |
|------|-------|----------|
| Fresh | `--fresh` | Wipes all seed tables, then runs all phases from scratch |
| Append | (default) | Hydrates id registry + context from DB, skips existing master UUIDs, adds new generated rows |
| Resume | `--only <phase>` | Hydrates from DB, runs `<phase>` and all later phases only |

Phases (in order): `masters` → `party` → `medicine` → `pricing` → `inventory` → `purchase` → `sales` → `sync` → `financial`.

Resume assumes earlier phases have already completed and later phases have not yet run on the current database.

`--no-wipe` is accepted as a deprecated alias for append mode (omit `--fresh`).

## BIGINT IDs and document numbers

SQLite BIGINT primary keys from `db push` do not auto-increment reliably. The seed client uses the same `createPrismaClient()` factory as the NestJS app: each `create` without an explicit `id` allocates the next PK from the **`IdSequence`** row for that Prisma model (per-row DB update with optimistic **`version` BigInt** lock).

On append or `--only`, `hydrateFromDb()` calls `bootstrapIdSequence()` (ensures per-model counter rows exist and reconciles each `currentValue` with `MAX(id)` on that table) and rehydrates the uuid registry plus branch-scoped document-number sequences. `id-registry.ts` is a uuid→id map for FK resolution only — it does not hold a PK counter.

Document numbers (invoice, PO, GRN, etc.) remain in `SequenceGenerator`, separate from `IdSequence`.

## Schema rules enforced

- `Batch`: `purchaseRate` + `mrp` only (no `saleRate` on batch).
- `Stock`: one row per `(branchId, batchId)`.
- Document numbers: branch-scoped uniques (`SI-B01-000001`, etc.).
- Status fields: strings (`POSTED`, `DRAFT`, …).
- `Outbox`: `entityUuid`, not numeric `entityId`.

## Verification

After seeding:

``` bash
npx prisma studio
```

Spot-check: 100 sales invoices, 100 batches, 100 outbox rows, no negative `availableQuantity` on stock.

Default seed users (password `admin123`): `admin`, `pharmacist1`, `cashier1`, `procurement1`, `manager1`, and others.
