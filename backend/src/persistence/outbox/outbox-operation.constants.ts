export const OutboxOperation = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
} as const;

export type OutboxOperation = (typeof OutboxOperation)[keyof typeof OutboxOperation];

export const OutboxSyncStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  SYNCED: 'SYNCED',
  FAILED: 'FAILED',
} as const;
