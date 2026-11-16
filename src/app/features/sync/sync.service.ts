import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../core/services/api.service';

export interface SyncRunLegSummary {
  id?: string;
  syncLogId?: string;
  syncType?: string;
  recordsUploaded: number;
  recordsDownloaded: number;
  failedRecords: number;
  conflictsDetected?: number;
  status: string;
  startedAt?: string;
  completedAt?: string | null;
}

export interface SyncRunLegDto {
  syncLogId: string;
  recordsUploaded: number;
  failedRecords: number;
  conflictsDetected?: number;
  status: string;
}

export interface SyncPullLegDto {
  syncLogId: string;
  recordsDownloaded: number;
  failedRecords: number;
  conflictsDetected: number;
  status: string;
}

export interface SyncRunResult {
  push: SyncRunLegDto;
  pull: SyncPullLegDto;
}

export interface SyncLatestRunResponse {
  push: SyncRunLegSummary | null;
  pull: SyncRunLegSummary | null;
}

@Injectable({ providedIn: 'root' })
export class SyncService {
  private readonly api = inject(ApiService);

  runNow() {
    return this.api.post<SyncRunResult>('/sync/runs');
  }

  latest() {
    return this.api.get<SyncLatestRunResponse | null>('/sync/runs/latest');
  }
}