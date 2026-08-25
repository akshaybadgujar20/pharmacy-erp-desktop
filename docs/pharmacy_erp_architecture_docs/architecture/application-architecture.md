# Application Architecture

## Angular

Use feature modules.

Example layout:

```text
sales/
purchase/
inventory/
customer/
supplier/
reports/
shared/
core/
```

Never place business logic inside components.

Components → Services → Backend

Implemented client layer: [Early foundations — Angular client](./early-foundations.md#angular-client-layer).

## Electron

**Renderer** runs Angular. Never expose Node directly.

**Main process** is responsible for:

- Printing
- File System
- Window Management
- Auto Updates

Use **Context Isolation** and a **Preload Script** with `contextBridge` to expose only the APIs Angular needs.

Implemented IPC: [Early foundations — Electron IPC](./early-foundations.md#electron-ipc).

## NestJS

Structure:

```text
Controller
    ↓
DTO
    ↓
Validation
    ↓
Service
    ↓
Prisma
    ↓
SQLite
```

Keep:

- Controllers thin
- Services rich
- DTOs validated
- Business rules in services

Implemented modules: [Early foundations](./early-foundations.md) (auth, settings, logging, persistence).

## API Design

Use REST consistently.

Example:

```text
GET    /sales
POST   /sales
PUT    /sales/{id}
DELETE /sales/{id}
```

Return standard error structures. Version APIs when needed.

The backend wraps responses in `{ success, data }` / `{ success, error }` — see `ApiService` in the Angular client layer.

## Related docs

- [Overview](./overview.md)
- [Security](./security.md)
- [Persistence patterns](../database/persistence-patterns.md)
