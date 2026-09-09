import { SyncLog } from '@prisma/client';
import { serializeEpochMs } from '../utils/sync.util';

export interface SyncLogResponse {
  id: string;
  uuid: string;
  syncType: string;
  syncDirection: string;
  startedAt: string;
  completedAt: string | null;
  recordsUploaded: number;
  recordsDownloaded: number;
  conflictsDetected: number;
  failedRecords: number;
  status: string;
  errorMessage: string | null;
  deviceId: string | null;
  appVersion: string | null;
  createdAt: string;
  version: number;
}

export function toSyncLogResponse(syncLog: SyncLog): SyncLogResponse {
  return {
    id: syncLog.id.toString(),
    uuid: syncLog.uuid,
    syncType: syncLog.syncType,
    syncDirection: syncLog.syncDirection,
    startedAt: serializeEpochMs(syncLog.startedAt) ?? '',
    completedAt: serializeEpochMs(syncLog.completedAt),
    recordsUploaded: syncLog.recordsUploaded,
    recordsDownloaded: syncLog.recordsDownloaded,
    conflictsDetected: syncLog.conflictsDetected,
    failedRecords: syncLog.failedRecords,
    status: syncLog.status,
    errorMessage: syncLog.errorMessage,
    deviceId: syncLog.deviceId,
    appVersion: syncLog.appVersion,
    createdAt: serializeEpochMs(syncLog.createdAt) ?? '',
    version: syncLog.version,
  };
}
