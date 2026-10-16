import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../core/services/api.service';

export interface ChangeHistoryRow {
  id: string;
  entityType: string;
  entityId: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changedAt: string;
}

@Injectable({ providedIn: 'root' })
export class ChangeHistoryService {
  private readonly api = inject(ApiService);

  list(params: Record<string, string>) {
    return this.api.getPaginated<ChangeHistoryRow>('/change-histories', params);
  }
}
