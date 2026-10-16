import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../core/services/api.service';

export interface SyncConflictRow {
  id: string;
  entityType: string;
  resolutionStatus: string;
  version: string;
}

@Injectable({ providedIn: 'root' })
export class SyncConflictAdminService {
  private readonly api = inject(ApiService);

  list(params: Record<string, string>) {
    return this.api.getPaginated<SyncConflictRow>('/sync-conflicts', params);
  }

  resolve(id: string, version: string, remarks?: string) {
    return this.api.post(`/sync-conflicts/${id}/resolve`, { version, remarks });
  }
}
