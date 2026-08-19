# Pharmacy ERP seed data

Indian pharmacy demo data for local SQLite development.

## Layout

``` text
seed/
├── seed.ts                 # CLI entrypoint
├── lib/
│   ├── prisma-client.ts    # Prisma + better-sqlite3 adapter
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

## Target volumes (approximate)

| Domain | Target |
|--------|--------|
| Sales invoices | 100 |
| Batches | 100 |
| Stock movements | 100+ |
| Outbox | 100 |
| Parties | ~80 |
| Medicines | 50 |

## CLI

``` bash
npx tsx seed/seed.ts              # default: wipe + full seed
npx tsx seed/seed.ts --no-wipe    # append mode
npx tsx seed/seed.ts --only sales # from sales phase onward
```

Phases (in order): `masters` → `party` → `medicine` → `pricing` → `inventory` → `purchase` → `sales` → `sync` → `financial`.

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
