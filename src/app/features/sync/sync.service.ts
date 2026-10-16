import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../core/services/api.service';

export interface SyncRunSummary {
  syncLogId: string;
  recordsUploaded: number;
  failedRecords: number;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class SyncService {
  private readonly api = inject(ApiService);

  runNow() {
    return this.api.post<SyncRunSummary>('/sync/runs');
  }

  latest() {
    return this.api.get<SyncRunSummary | null>('/sync/runs/latest');
  }
}
