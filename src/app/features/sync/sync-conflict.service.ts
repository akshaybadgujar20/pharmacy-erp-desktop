import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../core/services/api.service';

export interface SyncConflictRow {
  id: string;
  entityType: string;
  resolutionStatus: string;
  version: string;
}

export interface SyncConflictDetail extends SyncConflictRow {
  localPayload: string | null;
  serverPayload: string | null;
  remarks: string | null;
}

@Injectable({ providedIn: 'root' })
export class SyncConflictAdminService {
  private readonly api = inject(ApiService);

  list(params: Record<string, string>) {
    return this.api.getPaginated<SyncConflictRow>('/sync-conflicts', params);
  }

  getById(id: string) {
    return this.api.get<SyncConflictDetail>(`/sync-conflicts/${id}`);
  }

  resolve(id: string, version: string, remarks?: string) {
    return this.api.post(`/sync-conflicts/${id}/resolve`, { version, remarks });
  }
}
