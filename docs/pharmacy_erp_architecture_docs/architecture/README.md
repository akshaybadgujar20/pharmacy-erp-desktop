# Architecture

Topic-based architecture docs for the Pharmacy ERP. Start here instead of the legacy monolithic handbook.

## Start here

| Doc | Contents |
|-----|----------|
| [Overview](./overview.md) | Vision, system diagram, tech stack, design principles, DDD, events |
| [Early foundations](./early-foundations.md) | **Implemented** — auth, env vars, settings, Angular/Electron, i18n, shortcuts |
| [Application architecture](./application-architecture.md) | Angular, Electron, NestJS, REST API |
| [Data and sync](./data-and-sync.md) | Offline-first, sync strategy, multi-store / branch scoping |
| [Product & UX](./product-ux.md) | UX guidelines, keyboard-first, workflow-driven UI |
| [Integrations](./integrations.md) | Hardware, printing, barcode, reporting |
| [Security](./security.md) | Electron hardening, JWT auth summary |
| [Logging and audit](./logging-and-audit.md) | **Implemented** — Winston logging, `AuditService`, correlation IDs |
| [Engineering standards](./engineering-standards.md) | Coding, testing, CI/CD, performance, release checklist |

## Templates & ADRs

- [ADR index](./adrs/README.md)
- [ADR template](./templates/adr-template.md)
- [Module template](./templates/module-template.md)

## Related

- [Database docs](../database/database_overview.md)
- [Persistence patterns](../database/persistence-patterns.md)
- [Legacy handbook](../../pharmacy_erp_architecture_handbook.md) — archived; use topic docs above
