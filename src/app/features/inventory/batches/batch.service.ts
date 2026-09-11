import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import { Batch, CreateBatchRequest, UpdateBatchRequest } from './batch.models';

@Injectable({ providedIn: 'root' })
export class BatchService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/batches';

  list(params: Record<string, string>): Observable<{
    data: Batch[];
    pagination: Pagination;
  }> {
    return this.api.getPaginated<Batch>(this.basePath, params);
  }

  getById(id: string): Observable<Batch> {
    return this.api.get<Batch>(`${this.basePath}/${id}`);
  }

  create(body: CreateBatchRequest): Observable<Batch> {
    return this.api.post<Batch>(this.basePath, body);
  }

  update(id: string, body: UpdateBatchRequest): Observable<Batch> {
    return this.api.patch<Batch>(`${this.basePath}/${id}`, body);
  }

  delete(id: string, version: number): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`, {
      version: String(version),
    });
  }
}
