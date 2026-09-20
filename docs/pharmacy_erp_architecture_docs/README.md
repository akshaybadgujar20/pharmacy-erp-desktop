# Pharmacy ERP Knowledge Base

## Architecture

Start at [Architecture index](./architecture/README.md).

| Topic | Doc |
|-------|-----|
| Overview & principles | [overview.md](./architecture/overview.md) |
| Implemented platform layer | [early-foundations.md](./architecture/early-foundations.md) |
| Angular / Electron / NestJS | [application-architecture.md](./architecture/application-architecture.md) |
| Offline-first & sync | [data-and-sync.md](./architecture/data-and-sync.md) |
| Product & UX | [product-ux.md](./architecture/product-ux.md) |
| Integrations | [integrations.md](./architecture/integrations.md) |
| Security | [security.md](./architecture/security.md) |
| Logging & audit | [logging-and-audit.md](./architecture/logging-and-audit.md) |
| Backend developer guide | [backend-developer-guide.md](./architecture/backend-developer-guide.md) |
| Reporting | [reporting.md](./architecture/reporting.md) |
| Testing | [testing.md](./architecture/testing.md) |
| Engineering standards | [engineering-standards.md](./architecture/engineering-standards.md) |

## Functional

Start at [Functional index](./functional/README.md). End-to-end plain-English overview:

- [Functional overview](./functional/functional-overview.md)
- [Implementation status](./functional/implementation-status.md) — Backend / UI / UX maturity per module

| # | Module guide |
|---|--------------|
| 1 | [Party Management](./functional/party-management.md) |
| 2 | [User & Security](./functional/user-security.md) |
| 3 | [Medicine Master](./functional/medicine-master.md) |
| 4 | [Inventory](./functional/inventory.md) |
| 5 | [Purchase](./functional/purchase.md) |
| 6 | [Sales](./functional/sales.md) |
| 7 | [Financial](./functional/financial.md) |
| 8 | [Pricing](./functional/pricing.md) |
| 9 | [Loyalty](./functional/loyalty.md) |
| 10 | [Prescription](./functional/prescription.md) |
| 11 | [Synchronization](./functional/synchronization.md) |
| 12 | [Audit](./functional/audit.md) |
| 13 | [Configuration](./functional/configuration.md) |
| 14 | [Masters](./functional/masters.md) |

| Cross-cutting | Document |
|---------------|----------|
| Reporting | [reporting.md](./functional/reporting.md) |
| Glossary | [glossary.md](./functional/glossary.md) |
| Roles & permissions | [roles-and-permissions.md](./functional/roles-and-permissions.md) |
| Error codes | [error-codes.md](./functional/error-codes.md) |
| Devices & integrations | [integrations-and-devices.md](./functional/integrations-and-devices.md) |
| User experience | [user-experience.md](./functional/user-experience.md) |

## Domain

Start at [Domain index](./domain/README.md). Bounded contexts: [customer](./domain/customer.md), [sales](./domain/sales.md), [inventory](./domain/inventory.md), [product](./domain/product.md), [purchasing](./domain/purchasing.md), [supplier](./domain/supplier.md), [finance](./domain/finance.md).

## Database

- [Database overview](./database/database_overview.md)
- [Persistence patterns](./database/persistence-patterns.md)
- [Prisma / SQLite / Postgres alignment](./database/prisma_sqlite_jpa_postgres_alignment.md)
- [Architecture review](./database/architecture-review.md)
- Table specs: `./database/tables/<category>/<category>.md` (e.g. [sales](./database/tables/sales/sales.md)); Prisma models in `backend/prisma/schema.prisma`

## Legacy

- [Monolithic handbook](../pharmacy_erp_architecture_handbook.md) — archived; prefer topic docs above
