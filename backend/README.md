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

### Prerequisites

1. Apply the schema to SQLite (`db push` or `migrate dev`).
2. Run `npx prisma generate`.

### Commands

``` bash
cd backend
npm install
npx prisma generate
# prepare DB (choose one):
npx prisma db push
# or: npx prisma migrate dev --name init
npm run db:seed:fresh
npx prisma studio
```

Other scripts:

``` bash
npm run db:seed          # seed (default: wipe + reseed)
npm run db:seed:fresh    # explicit fresh seed
npm run db:reset         # force-reset DB + seed
npx prisma db seed       # uses package.json prisma.seed hook
```

Use `--no-wipe` to append (may hit unique constraints). Use `--only sales` to re-run from a phase onward.

See [seed/README.md](seed/README.md) for folder layout and row-count targets.

### Troubleshooting

- **FK errors** - run `npx prisma db push` or `migrate dev` before seeding.
- **Unique constraint** - re-run with `npm run db:seed:fresh` or `db:reset.

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

``` bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
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

