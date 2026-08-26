## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter
repository.

This project uses **Prisma ORM** with **SQLite** for local development.

## Project setup

``` bash
npm install
```

## Database Setup

The project uses Prisma ORM for database access and migrations.

### Prisma schema structure

Prisma schemas are organized using a **multi-file and multi-folder
structure**.

The main Prisma schema directory is:

``` text
prisma/
├── migrations/
├── schema.prisma
├── configuration/
├── masters/
├── party_management/
├── medicine_master/
├── inventory/
├── purchase/
├── sales/
├── pricing/
├── prescription/
├── financial/
├── loyalty/
├── user_and_security/
├── synchronization/
└── audit/
```

The Prisma configuration is located at:

``` text
prisma.config.ts
```

The configuration points Prisma to the complete `prisma/` schema
directory:

``` ts
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: "file:../db/pharmacy.sqlite",
  },
});
```

Individual `.prisma` files can be organized into logical folders such
as:

``` text
prisma/party_management/
```

Do not import individual `.prisma` files into `schema.prisma`. Prisma
discovers the schema files from the configured schema directory.

## Seed data

Sample data lives under `seed/`. Static **JSON masters** (geo, company, branches, medicine references, tax, security) use stable UUIDs; **generators** create parties, medicines, inventory, purchase/sales flows, sync outbox, and financial/audit samples.

Full reference: [seed/README.md](seed/README.md).

### Prerequisites

1. Apply the schema to SQLite (`db push` or `migrate dev`).
2. Run `npx prisma generate`.

### First-time setup

``` bash
cd backend
npm install
npx prisma generate
npx prisma db push          # or: npx prisma migrate dev --name init
npm run db:seed:fresh       # wipe + full seed
npx prisma studio           # optional: inspect data
```

### Seed commands (from `backend/`)

| Command | Behavior |
|---------|----------|
| `npm run db:seed:fresh` | Wipe all seed tables, then run all phases from scratch |
| `npm run db:seed` | Append mode — hydrate from DB, skip existing master UUIDs, add new generated rows |
| `npm run db:seed -- --only <phase>` | Resume from `<phase>` onward (hydrates first; earlier phases must already be seeded) |
| `npm run db:reset` | `prisma db push --force-reset` + fresh seed |
| `npx prisma db seed` | Same as `db:seed:fresh` (uses `package.json` `prisma.seed` hook) |

Phases (in order): `masters` → `party` → `medicine` → `pricing` → `inventory` → `purchase` → `sales` → `sync` → `financial`.

Examples:

``` bash
npm run db:seed:fresh
npm run db:seed                              # add another batch of demo data
npm run db:seed -- --only sales              # re-run sales → sync → financial
npx tsx seed/seed.ts --fresh
npx tsx seed/seed.ts --only inventory
```

`--no-wipe` is accepted as a deprecated alias for append mode (omit `--fresh`).

After seeding, demo login: `admin` / `admin123` (see [early-foundations.md](../docs/pharmacy_erp_architecture_docs/architecture/early-foundations.md)).

### Troubleshooting

- **FK errors** — run `npx prisma db push` or `migrate dev` before seeding.
- **Unique constraint on append** — use `npm run db:seed:fresh` or `db:reset` for a clean slate.
- **Empty context on `--only`** — run a full fresh seed first, or ensure the target phase’s dependencies exist in the DB.

### Format and validate the Prisma schema

After creating or modifying Prisma schema files:

``` bash
npx prisma format
```

Then validate the complete schema:

``` bash
npx prisma validate
```

### Create and apply a migration

After creating or modifying a Prisma model:

``` bash
npx prisma migrate dev --name <migration-name>
```

Example:

``` bash
npx prisma migrate dev --name create_party_management
```

This will:

-   Read the complete multi-file Prisma schema
-   Create a new migration under `prisma/migrations/`
-   Apply the migration to the local SQLite database
-   Update Prisma migration history
-   Regenerate Prisma Client

### Check migration status

``` bash
npx prisma migrate status
```

### Apply existing migrations

For deployment/production environments:

``` bash
npx prisma migrate deploy
```

### Generate Prisma Client

If Prisma Client needs to be regenerated manually:

``` bash
npx prisma generate
```

### Open Prisma Studio

To view and manage the local database:

``` bash
npx prisma studio
```

### Prisma migration workflow

When changing the database schema, follow this workflow:

``` text
Modify the appropriate .prisma file
        ↓
npx prisma format
        ↓
npx prisma validate
        ↓
npx prisma migrate dev --name <migration-name>
        ↓
Migration created
        ↓
Migration applied to local SQLite
        ↓
Prisma Client regenerated
        ↓
Commit prisma/migrations/ to Git
```

**Important:**

-   Keep Prisma models organized in logical folders under `prisma/`.
-   Do not manually modify the database schema.
-   Do not manually import individual `.prisma` files into
    `schema.prisma`.
-   Do not delete existing migrations that have already been
    committed/applied.
-   Migration files must be committed to Git.
-   Use `migrate dev` during development.
-   Use `migrate deploy` when deploying existing migrations to
    production.
-   Run `prisma format` and `prisma validate` after schema changes and
    before creating a migration.

## Compile and run the project

``` bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```


## Persistence layer

Business modules should use `PersistenceModule` (unit of work, request context, sequences, outbox, inventory ledger) instead of ad-hoc Prisma transactions.

Design and usage: [persistence-patterns.md](../docs/pharmacy_erp_architecture_docs/database/persistence-patterns.md)

Integration tests against seeded SQLite:

``` bash
npm run test:persistence
```
## Run tests

Full reference: [Testing architecture doc](../docs/pharmacy_erp_architecture_docs/architecture/testing.md).

### All suites

```bash
# Unit tests (src/**/*.spec.ts) — mocked, no database
npm run test

# Watch / coverage / debug
npm run test:watch
npm run test:cov
npm run test:debug

# Persistence integration (seeded db/pharmacy.sqlite, --runInBand)
npm run test:persistence

# HTTP e2e (auth, party, app)
npm run test:e2e
```

Seed before persistence or e2e if needed: `npm run db:seed:fresh`.

### Feature-based (unit)

```bash
npm run test -- --testPathPatterns=auth
npm run test -- --testPathPatterns=party
npm run test -- --testPathPatterns=reporting
npm run test -- --testPathPatterns=settings
npm run test -- --testPathPatterns=src/common
```

### Single file (unit)

Path relative to `src/` (Jest `rootDir`):

```bash
npm run test -- party/customer.service.spec.ts
npm run test -- reporting/core/report-registry.service.spec.ts
npm run test -- auth/auth.service.spec.ts
```

### Feature-based (persistence / e2e)

```bash
npm run test:persistence -- --testPathPatterns=sequence-generator
npm run test:persistence -- --testPathPatterns=outbox-in-transaction
npm run test:e2e -- --testPathPatterns=auth.e2e-spec
npm run test:e2e -- --testPathPatterns=party.e2e-spec
```

### Lint before tests

```bash
npm run lint
npm run format
```

## Deployment

When you're ready to deploy your NestJS application to production, there
are some key steps you can take to ensure it runs as efficiently as
possible. Check out the [deployment
documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS
application, check out [Mau](https://mau.nestjs.com), our official
platform for deploying your applications on AWS. Mau makes deployment
straightforward and fast, requiring just a few simple steps:

``` bash
npm install -g @nestjs/mau
mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing
you to focus on building features rather than managing infrastructure.

