export const SyncPushResultStatus = {
  ACCEPTED: 'ACCEPTED',
  DUPLICATE: 'DUPLICATE',
  CONFLICT: 'CONFLICT',
} as const;

export type SyncPushResultStatus =
  (typeof SyncPushResultStatus)[keyof typeof SyncPushResultStatus];

export interface SyncCloudPushOperation {
  operationId: string;
  entityType: string;
  entityUuid: string;
  operation: string;
  entityVersion: string;
  sequenceNo: string;
  payload: unknown;
}

export interface SyncCloudPushRequest {
  deviceId: string;
  branchId: string | null;
  operations: SyncCloudPushOperation[];
}

export interface SyncCloudPushResultItem {
  operationId: string;
  status: string;
  serverEntityVersion?: string | null;
  serverPayload?: unknown;
}

export interface SyncCloudPushResponse {
  results: SyncCloudPushResultItem[];
}

export interface SyncCloudPullRecord {
  entityType: string;
  entityUuid: string;
  operation: string;
  entityVersion: string;
  originDeviceId?: string | null;
  payload: unknown;
}

export interface SyncCloudPullResponse {
  records: SyncCloudPullRecord[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface SyncCloudRequestContext {
  deviceId: string;
  branchId?: bigint;
  companyId?: bigint;
  authorization?: string;
}
