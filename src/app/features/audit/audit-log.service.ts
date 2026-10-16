import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../core/services/api.service';

export interface AuditLogRow {
  id: string;
  module: string;
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string | null;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private readonly api = inject(ApiService);

  list(params: Record<string, string>) {
    return this.api.getPaginated<AuditLogRow>('/audit-logs', params);
  }

  getById(id: string) {
    return this.api.get<AuditLogRow>(`/audit-logs/${id}`);
  }
}
