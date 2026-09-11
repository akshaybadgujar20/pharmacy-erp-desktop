import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import { LedgerEntry } from './ledger-entry.models';

@Injectable({ providedIn: 'root' })
export class LedgerEntryService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/ledger-entries';

  list(params: Record<string, string>): Observable<{
    data: LedgerEntry[];
    pagination: Pagination;
  }> {
    return this.api.getPaginated<LedgerEntry>(this.basePath, params);
  }

  getById(id: string): Observable<LedgerEntry> {
    return this.api.get<LedgerEntry>(`${this.basePath}/${id}`);
  }
}
