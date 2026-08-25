# Medicine Master — Domain Events

## Purpose

Document the domain events emitted when medicine master data changes, and how those events integrate with the transactional outbox for offline-first UUID sync.

## Responsibilities

- Name canonical events and their triggers.
- Map domain events to outbox `entityType`, `entityUuid`, and `operation`.
- Define payload expectations for downstream consumers (sync worker, audit, cache invalidation).

## Scope

### In Scope

- Events for `Medicine` aggregate lifecycle and composition changes.
- Outbox alignment with `OutboxEntityType.MEDICINE` and `OutboxOperation`.
- Audit log correlation.

### Out of Scope

- Inventory events (`Batch`, `StockMovement`) — Inventory domain.
- Pricing events (`PriceList`, `PriceListItem`) — Pricing domain.
- Sales/Purchase invoice events.

## Related Entities

| Entity | Outbox entity type | UUID field |
|--------|-------------------|------------|
| Medicine | `Medicine` | `medicine.uuid` |
| MedicineGeneric | (future) | `generic.uuid` |
| Manufacturer | (future) | `manufacturer.uuid` |

Reference: [entity-type.constants.ts](../../../../backend/src/persistence/outbox/entity-type.constants.ts)

## Business Rules

- Every committed medicine mutation that should sync MUST enqueue outbox in the **same database transaction** as the business write.
- Outbox `entityUuid` is always the medicine's `uuid`, never the local BIGINT `id`.
- `operationId` provides idempotency for sync retries.
- Soft delete emits `DELETE` operation; consumers treat as tombstone, not physical removal.
- Composition-only changes emit `UPDATE` with full or delta payload per sync contract.

## Domain Events

### MedicineCreated

**When:** A new `Medicine` row is inserted.

**Payload (illustrative):**

```json
{
  "uuid": "…",
  "medicineCode": "MED000042",
  "medicineName": "Crocin 500",
  "manufacturerUuid": "…",
  "categoryUuid": "…",
  "unitUuid": "…",
  "scheduleUuid": "…",
  "requiresPrescription": false,
  "isActive": true,
  "discontinued": false,
  "version": 1
}
```

**Outbox:** `operation = CREATE`, `entityType = Medicine`.

### MedicineUpdated

**When:** Any mutable field on `Medicine` changes (name, HSN, flags, references).

**Outbox:** `operation = UPDATE`.

**Consumers:** Invalidate medicine search cache; refresh POS catalog for the branch.

### MedicineCompositionChanged

**When:** `MedicineSalt` rows added, removed, or reordered.

**Note:** May be modeled as `MedicineUpdated` with embedded `salts[]` in payload, or a dedicated event name in application logs. Outbox remains `UPDATE` on the medicine uuid.

### MedicineDeactivated

**When:** `isActive` transitions from `true` to `false`.

**Downstream:** Block new PO lines and price list entries; existing stock unaffected.

### MedicineDiscontinued

**When:** `discontinued` transitions from `false` to `true`.

**Downstream:** Warn on purchase; allow sell-through of existing batches.

### MedicineDeleted

**When:** `deletedAt` is set (soft delete).

**Outbox:** `operation = DELETE`.

**Downstream:** Hide from all selectors; preserve historical invoice references.

### Reference master events (planned)

| Event | Entity |
|-------|--------|
| `MedicineGenericCreated` / `Updated` / `Deleted` | MedicineGeneric |
| `ManufacturerCreated` / `Updated` | Manufacturer |
| `MedicineCategoryCreated` / `Updated` | MedicineCategory |

These follow the same UUID + version pattern when outbox entity types are extended.

## State Model

Events reflect transitions between lifecycle states — see [state-machine.md](./state-machine.md):

- `MedicineCreated` → Active
- `MedicineDeactivated` → Inactive
- `MedicineDiscontinued` → Discontinued
- `MedicineDeleted` → Deleted (terminal)

## Integrations

| Consumer | Use |
|----------|-----|
| **Sync worker** | Pull `PENDING` outbox rows; upsert by `entityUuid` on cloud/peer |
| **AuditService** | Persist human-readable action + entity uuid |
| **AppLogger** | Structured log with correlation id from request context |
| **Desktop cache** | Subscribe to medicine updates for offline catalog refresh |

Sync status uses string values: `PENDING`, `PROCESSING`, `SYNCED`, `FAILED` (`OutboxSyncStatus`).

## Security Considerations

- Event payloads must not include secrets or PII beyond business fields.
- Sync endpoints must authenticate device and respect company scope.
- Deleted medicine events still require authorized sync channels.

## Performance Considerations

- Batch outbox processing by `deviceId` sequence for ordering guarantees.
- Keep payloads compact; omit unchanged composition on minor field updates when delta sync is supported.
- Index outbox by `syncStatus` and `createdAt` for worker polling.

## Future Enhancements

- Cloud webhook on `MedicineUpdated` for external PIM integration.
- Event catalog in schema registry with versioned payload shapes.
- Separate outbox entity types for `MedicineGeneric` and `Manufacturer`.
