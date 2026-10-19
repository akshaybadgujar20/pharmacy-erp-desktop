import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { ApiService } from '../../core/services/api.service';

export interface AuditLogRow {
  id: string;
  uuid?: string;
  module: string;
  action: string;
  entityType: string;
  entityId: string | null;
  entityUuid?: string | null;
  summary: string | null;
  userId?: string | null;
  branchId?: string | null;
  ipAddress?: string | null;
  correlationId?: string | null;
  actionTimestamp?: string;
  createdAt: string;
}

interface AuditLogApiRow {
  id: string;
  uuid?: string;
  module: string;
  action: string;
  entityType: string;
  entityId: string | null;
  entityUuid?: string | null;
  description: string | null;
  userId?: string | null;
  branchId?: string | null;
  ipAddress?: string | null;
  correlationId?: string | null;
  actionTimestamp?: string;
  createdAt: string;
}

function toAuditLogRow(row: AuditLogApiRow): AuditLogRow {
  return {
    id: row.id,
    uuid: row.uuid,
    module: row.module,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    entityUuid: row.entityUuid,
    summary: row.description,
    userId: row.userId,
    branchId: row.branchId,
    ipAddress: row.ipAddress,
    correlationId: row.correlationId,
    actionTimestamp: row.actionTimestamp,
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
