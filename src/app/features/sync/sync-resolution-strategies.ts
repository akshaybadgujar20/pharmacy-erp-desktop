export const SYNC_RESOLUTION_STRATEGIES = [
  'SERVER_WINS',
  'CLIENT_WINS',
  'MERGED',
  'MANUAL',
] as const;

export type SyncResolutionStrategy = (typeof SYNC_RESOLUTION_STRATEGIES)[number];