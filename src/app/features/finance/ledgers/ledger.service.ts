import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  CreateLedgerRequest,
  Ledger,
  UpdateLedgerRequest,
} from './ledger.models';

@Injectable({ providedIn: 'root' })
export class LedgerService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/ledgers';

  list(params: Record<string, string>): Observable<{
    data: Ledger[];
    pagination: Pagination;
  }> {
    return this.api.getPaginated<Ledger>(this.basePath, params);
  }

  getById(id: string): Observable<Ledger> {
    return this.api.get<Ledger>(`${this.basePath}/${id}`);
  }

  create(body: CreateLedgerRequest): Observable<Ledger> {
    return this.api.post<Ledger>(this.basePath, body);
  }

  update(id: string, body: UpdateLedgerRequest): Observable<Ledger> {
    return this.api.patch<Ledger>(`${this.basePath}/${id}`, body);
  }

  delete(id: string, version: number): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`, {
      version: String(version),
    });
  }
}
