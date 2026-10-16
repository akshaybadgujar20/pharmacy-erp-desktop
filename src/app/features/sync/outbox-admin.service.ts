import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../core/services/api.service';

export interface OutboxRow {
  id: string;
  entityType: string;
  syncStatus: string;
  retryCount: number;
  lastError: string | null;
  createdAt: string;
  version: string;
}

@Injectable({ providedIn: 'root' })
export class OutboxAdminService {
  private readonly api = inject(ApiService);

  list(params: Record<string, string>) {
    return this.api.getPaginated<OutboxRow>('/outbox', params);
  }

  retry(id: string, version: string) {
    return this.api.post(`/outbox/${id}/retry`, { version });
  }
}
