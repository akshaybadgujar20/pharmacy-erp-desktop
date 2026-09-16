import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import { CreateTaxRequest, Tax, UpdateTaxRequest } from './tax.models';

@Injectable({ providedIn: 'root' })
export class TaxService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/taxes';

  list(params: Record<string, string>): Observable<{
    data: Tax[];
    pagination: Pagination;
  }> {
    return this.api.getPaginated<Tax>(this.basePath, params);
  }

  getById(id: string): Observable<Tax> {
    return this.api.get<Tax>(`${this.basePath}/${id}`);
  }

  create(body: CreateTaxRequest): Observable<Tax> {
    return this.api.post<Tax>(this.basePath, body);
  }

  update(id: string, body: UpdateTaxRequest): Observable<Tax> {
    return this.api.patch<Tax>(`${this.basePath}/${id}`, body);
  }

  delete(id: string, version: number): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`, {
      version: String(version),
    });
  }
}
