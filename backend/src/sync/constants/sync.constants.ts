export const SyncConflictResolutionStatus = {
  PENDING: 'PENDING',
  AUTO_RESOLVED: 'AUTO_RESOLVED',
  MANUAL_RESOLVED: 'MANUAL_RESOLVED',
  RESOLVED: 'RESOLVED',
} as const;

export type SyncConflictResolutionStatus =
  (typeof SyncConflictResolutionStatus)[keyof typeof SyncConflictResolutionStatus];

export const SyncConflictResolutionStrategy = {
  SERVER_WINS: 'SERVER_WINS',
  CLIENT_WINS: 'CLIENT_WINS',
  MERGED: 'MERGED',
  MANUAL: 'MANUAL',
} as const;

export type SyncConflictResolutionStrategy =
  (typeof SyncConflictResolutionStrategy)[keyof typeof SyncConflictResolutionStrategy];

export const OutboxAuditEntityType = 'Outbox' as const;
