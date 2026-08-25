# Medicine Master — Permissions

## Purpose

Define authorization for medicine master data operations. Permissions follow the `MODULE:RESOURCE:ACTION` string format issued in JWT claims by the auth service.

## Responsibilities

- Document seeded permissions for medicine master maintenance.
- Map API endpoints and UI actions to required permissions.
- Clarify relationship between master permissions and inventory/pricing permissions.

## Scope

### In Scope

- Medicine and closely related master maintenance guarded by `MASTER:MEDICINE:*`.
- Seed data reference from `permission.json`.

### Out of Scope

- Stock adjustment permissions — `INVENTORY:*`.
- Sales invoice permissions — `SALES:*`.
- Party/supplier management — `PARTY:*`.

## Related Entities

- **Permission** — security seed — [permission.json](../../../../backend/seed/data/security/permission.json)
- **RolePermission** — role grants — [role-permission.json](../../../../backend/seed/data/security/role-permission.json)
- **Medicine** — protected resource — [15_medicine.md](../../database/tables/medicine_master/15_medicine.md)

## Business Rules

1. **Canonical format** — permissions in JWT are `module:resource:action`, built from seed columns:

   | Seed field | Example value |
   |------------|---------------|
   | `module` | `MASTER` |
   | `resource` | `MEDICINE` |
   | `action` | `UPDATE` |
   | **JWT string** | **`MASTER:MEDICINE:UPDATE`** |

2. **Seed permission** — current seed defines one medicine master permission:

   | permissionCode | permissionName | JWT permission |
   |----------------|----------------|----------------|
   | `MASTER_MEDICINE` | Manage Medicines | `MASTER:MEDICINE:UPDATE` |

3. **UPDATE implies write** — create, update, soft delete, discontinue, and composition changes require `MASTER:MEDICINE:UPDATE` until granular actions are seeded.

4. **Read access** — no separate `MASTER:MEDICINE:READ` in seed today; authenticated users with branch context can read medicines for operations. Add explicit read permission when master data becomes restricted.

5. **Reference masters** — category, schedule, generic, manufacturer, UOM maintenance may share `MASTER:MEDICINE:UPDATE` initially or split into future `MASTER:CATEGORY:UPDATE`, etc.

6. **System schedules** — deleting or deactivating `isSystemSchedule` rows should require admin role even with medicine permission.

7. **Branch context** — medicine master is org-global; JWT still carries `branchId` for audit and downstream modules, not for row-level filter on `Medicine`.

## Domain Events

Permission checks occur **before** domain events are emitted:

- Denied request → HTTP 403, no outbox row.
- Granted commit → event + outbox as documented in [events.md](./events.md).

## State Model

Not applicable.

## Integrations

- **AuthService** — loads role permissions, formats as `MODULE:RESOURCE:ACTION` — see [auth.service.ts](../../../../backend/src/auth/auth.service.ts).
- **PermissionsGuard** — `@RequirePermissions('MASTER:MEDICINE:UPDATE')` on medicine controller routes.
- **AuditService** — records user id from JWT on successful mutations.

### Controller mapping (planned)

| Operation | HTTP | Permission |
|-----------|------|------------|
| List / search medicines | GET | Authenticated (future: `MASTER:MEDICINE:READ`) |
| Get medicine by uuid | GET | Authenticated |
| Create medicine | POST | `MASTER:MEDICINE:UPDATE` |
| Update medicine | PUT/PATCH | `MASTER:MEDICINE:UPDATE` |
| Soft delete medicine | DELETE | `MASTER:MEDICINE:UPDATE` |
| Manage composition | PUT | `MASTER:MEDICINE:UPDATE` |

## Security Considerations

- Never authorize from client-supplied headers alone; use JWT + `PermissionsGuard`.
- Log permission denials at warn level with correlation id.
- Narcotic medicine edits should trigger enhanced audit (future).
- Separate duties: purchasing clerk may read medicines but not edit master.

## Performance Considerations

- Permissions loaded once at login into JWT; no per-row permission DB lookup on medicine list.
- Cache role-permission matrix server-side on token refresh only.

## Future Enhancements

- Split permissions: `MASTER:MEDICINE:CREATE`, `READ`, `UPDATE`, `DELETE`.
- `MASTER:COMPOSITION:UPDATE` for pharmacist-only salt edits.
- `MASTER:SCHEDULE:ADMIN` for regulatory schedule maintenance.
- Field-level masking (cost visibility) remains in Inventory/Pricing domains.
