import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  CreatePurchaseReturnRequest,
  PurchaseReturn,
  PurchaseReturnWorkflowRequest,
  UpdatePurchaseReturnRequest,
} from './purchase-return.models';

@Injectable({ providedIn: 'root' })
export class PurchaseReturnService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/purchase-returns';

  list(params: Record<string, string>): Observable<{
    data: PurchaseReturn[];
    pagination: Pagination;
  }> {
    return this.api.getPaginated<PurchaseReturn>(this.basePath, params);
  }

  getById(id: string): Observable<PurchaseReturn> {
    return this.api.get<PurchaseReturn>(`${this.basePath}/${id}`);
  }

  create(body: CreatePurchaseReturnRequest): Observable<PurchaseReturn> {
    return this.api.post<PurchaseReturn>(this.basePath, body);
  }

  update(id: string, body: UpdatePurchaseReturnRequest): Observable<PurchaseReturn> {
    return this.api.patch<PurchaseReturn>(`${this.basePath}/${id}`, body);
  }

  submit(id: string, body: PurchaseReturnWorkflowRequest): Observable<PurchaseReturn> {
    return this.api.post<PurchaseReturn>(`${this.basePath}/${id}/submit`, body);
  }

  approve(id: string, body: PurchaseReturnWorkflowRequest): Observable<PurchaseReturn> {
    return this.api.post<PurchaseReturn>(`${this.basePath}/${id}/approve`, body);
  }

  reject(id: string, body: PurchaseReturnWorkflowRequest): Observable<PurchaseReturn> {
    return this.api.post<PurchaseReturn>(`${this.basePath}/${id}/reject`, body);
  }

  cancel(id: string, body: PurchaseReturnWorkflowRequest): Observable<PurchaseReturn> {
    return this.api.post<PurchaseReturn>(`${this.basePath}/${id}/cancel`, body);
  }

  delete(id: string, version: number): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`, {
      version: String(version),
    });
  }
}
