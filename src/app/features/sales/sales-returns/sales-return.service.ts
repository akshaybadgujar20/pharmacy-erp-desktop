import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  CreateSalesReturnRequest,
  SalesReturn,
  SalesReturnWorkflowRequest,
  UpdateSalesReturnRequest,
} from './sales-return.models';

@Injectable({ providedIn: 'root' })
export class SalesReturnService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/sales-returns';

  list(params: Record<string, string>): Observable<{
    data: SalesReturn[];
    pagination: Pagination;
  }> {
    return this.api.getPaginated<SalesReturn>(this.basePath, params);
  }

  getById(id: string): Observable<SalesReturn> {
    return this.api.get<SalesReturn>(`${this.basePath}/${id}`);
  }

  create(body: CreateSalesReturnRequest): Observable<SalesReturn> {
    return this.api.post<SalesReturn>(this.basePath, body);
  }

  update(id: string, body: UpdateSalesReturnRequest): Observable<SalesReturn> {
    return this.api.patch<SalesReturn>(`${this.basePath}/${id}`, body);
  }

  approve(id: string, body: SalesReturnWorkflowRequest): Observable<SalesReturn> {
    return this.api.post<SalesReturn>(`${this.basePath}/${id}/approve`, body);
  }

  cancel(id: string, body: SalesReturnWorkflowRequest): Observable<SalesReturn> {
    return this.api.post<SalesReturn>(`${this.basePath}/${id}/cancel`, body);
  }

  delete(id: string, version: string): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`, {
      version: String(version),
    });
  }
}
