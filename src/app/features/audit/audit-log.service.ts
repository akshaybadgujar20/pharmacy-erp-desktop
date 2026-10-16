import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
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

interface AuditLogApiRow {
  id: string;
  module: string;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string | null;
  createdAt: string;
}

function toAuditLogRow(row: AuditLogApiRow): AuditLogRow {
  return {
    id: row.id,
    module: row.module,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    summary: row.description,
    createdAt: row.createdAt,
  };
}

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private readonly api = inject(ApiService);

  list(params: Record<string, string>) {
    return this.api.getPaginated<AuditLogApiRow>('/audit-logs', params).pipe(
      map((result) => ({
        ...result,
        data: result.data.map(toAuditLogRow),
      })),
    );
  }

  getById(id: string) {
    return this.api.get<AuditLogRow>(`/audit-logs/${id}`);
  }
}
