# ADR-138 addendum — SERVER_WINS resolve applies payload

**Status:** Amended

## Context

Original ADR-138: sync conflict resolve was metadata-only (no business table writes).

## Decision (amendment)

When an operator resolves a pending conflict with **`SERVER_WINS`**:

1. Nest calls `SyncApplyService.applyPullRecord` with `serverPayload` inside the same transaction as the conflict update.
2. On successful apply: conflict moves to `MANUAL_RESOLVED` with strategy `SERVER_WINS` (audited).
3. On apply failure: conflict stays `PENDING`; API returns conflict (409).

**CLIENT_WINS**, **MERGED**, and other strategies remain metadata-only until explicitly implemented.

## Code

- [`sync-conflict.service.ts`](../../../../backend/src/sync/services/sync-conflict.service.ts)
- [`sync-apply.service.ts`](../../../../backend/src/sync/services/sync-apply.service.ts)