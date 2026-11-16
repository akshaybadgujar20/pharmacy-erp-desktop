# Sync cloud API (Nest client contract)

Target implementation: **external Spring Boot + JPA + PostgreSQL**. The Nest desktop backend calls this API during `POST /sync/runs` (push then pull). Phase 1 syncs **masters + party** entity types only.

**Client code:** `backend/src/sync/cloud/`, allowlist `backend/src/sync/constants/sync-phase1-entity-types.ts`.

## Base URL

`SYNC_CLOUD_URL` — no trailing slash (example: `https://cloud.example.com/api/sync`).

## Headers (all requests)

| Header | Source |
|--------|--------|
| `Authorization` | Bearer JWT from the authenticated sync request (forwarded from Nest) |
| `Content-Type` | `application/json` (push only) |
| `X-Device-Id` | Request context `deviceId` |
| `X-Branch-Id` | Request context `branchId` when set |
| `X-Company-Id` | Request context `companyId` when set |

## POST `/push`

Upload a batch of outbox operations from one device/branch.

### Request

```json
{
  "deviceId": "desktop-dev-001",
  "branchId": "1",
  "operations": [
    {
      "operationId": "uuid",
      "entityType": "Medicine",
      "entityUuid": "uuid",
      "operation": "CREATE",
      "entityVersion": "3",
      "sequenceNo": "42",
      "payload": { "uuid": "...", "medicineCode": "..." }
    }
  ]
}
```

### Response `200`

```json
{
  "results": [
    {
      "operationId": "uuid",
      "status": "ACCEPTED",
      "serverEntityVersion": "4",
      "serverPayload": null
    }
  ]
}
```

| `status` | Meaning |
|----------|---------|
| `ACCEPTED` | Applied on server |
| `DUPLICATE` | Same `operationId` already processed (idempotent) |
| `CONFLICT` | Optimistic lock failed; `serverPayload` contains server row |

## GET `/pull`

Query parameters: `deviceId`, `branchId`, `cursor` (optional), `limit` (default 50, max 200).

### Response `200`

```json
{
  "records": [
    {
      "entityType": "Customer",
      "entityUuid": "uuid",
      "operation": "UPDATE",
      "entityVersion": "5",
      "originDeviceId": "other-device",
      "payload": {
        "data": {
          "uuid": "uuid",
          "customerCode": "C001",
          "partyUuid": "..."
        }
      }
    }
  ],
  "nextCursor": "opaque-token-or-null",
  "hasMore": false
}
```

Records whose `originDeviceId` equals the requesting device are typically still returned; the **client skips echo** records before apply.

## Phase 2 entities (`SYNC_PHASE2_ENABLED=true`)

When enabled on the Nest client, push/pull includes pricing, prescriptions, purchase, sales, inventory, finance, and loyalty types. Payloads should use expanded envelopes with `data` containing scalar fields as strings and foreign keys as `*Uuid` fields.

| Group | Types | Pull apply policy |
|-------|--------|-------------------|
| Pricing | PriceList, PriceListItem, Tax, DiscountRule | Server wins |
| Prescription | Prescription, PrescriptionItem | Server wins (items after header) |
| Purchase / Sales | PO, GRN, PUR, returns, SalesInvoice, SalesPayment, SalesReturn | Server wins on snapshot |
| Inventory | Batch, Stock, StockMovement, adjustments, transfers, stock take | **Conflict-first** (Stock qty) |
| Finance / Loyalty | Ledger, entries, Payment, Receipt, loyalty rows | Conflict-first or server win per type |

Document headers may include nested `lines[]` with `entityUuid` per line when the cloud sends composite payloads.

### Example: PurchaseOrder push payload (header + lines)

```json
{
  "payloadVersion": 1,
  "entityVersion": "3",
  "data": {
    "uuid": "po-uuid-1",
    "purchaseOrderNumber": "PO-2024-001",
    "supplierUuid": "supplier-uuid-1",
    "branchUuid": "branch-uuid-1",
    "orderDate": "1710000000000",
    "netAmount": "15000.00",
    "status": "APPROVED",
    "lines": [
      {
        "entityUuid": "poi-uuid-1",
        "uuid": "poi-uuid-1",
        "lineNumber": 1,
        "medicineUuid": "medicine-uuid-1",
        "unitUuid": "uom-tablet",
        "orderedQuantity": "100",
        "unitPrice": "50.00",
        "lineAmount": "5000.00"
      },
      {
        "entityUuid": "poi-uuid-2",
        "uuid": "poi-uuid-2",
        "lineNumber": 2,
        "medicineUuid": "medicine-uuid-2",
        "unitUuid": "uom-strip",
        "orderedQuantity": "200",
        "unitPrice": "50.00",
        "lineAmount": "10000.00"
      }
    ]
  }
}
```

## Conflict rules (Phase 1)

| Entity group | Rule |
|--------------|------|
| Masters + party (Phase 1 allowlist) | **Server wins** on pull; on push `CONFLICT`, client attempts server-win apply from `serverPayload` |
| Inventory / sales (not in Phase 1 push filter) | Outbox stays `PENDING` until a later phase |
| Apply failure | Create local `SyncConflict` row (`VERSION_MISMATCH` or `APPLY_FAILED`) |

## Related

- [Data and sync](./data-and-sync.md)
- [Synchronization tables](../database/tables/synchronization/synchronization.md)
- [Functional synchronization](../functional/synchronization.md)