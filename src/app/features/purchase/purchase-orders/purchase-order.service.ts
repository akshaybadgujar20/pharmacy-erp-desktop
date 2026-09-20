import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  CreatePurchaseOrderRequest,
  PurchaseOrder,
  PurchaseOrderWorkflowRequest,
  UpdatePurchaseOrderRequest,
} from './purchase-order.models';

@Injectable({ providedIn: 'root' })
export class PurchaseOrderService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/purchase-orders';

  list(params: Record<string, string>): Observable<{
    data: PurchaseOrder[];
    pagination: Pagination;
  }> {
    return this.api.getPaginated<PurchaseOrder>(this.basePath, params);
  }

  getById(id: string): Observable<PurchaseOrder> {
    return this.api.get<PurchaseOrder>(`${this.basePath}/${id}`);
  }

  create(body: CreatePurchaseOrderRequest): Observable<PurchaseOrder> {
    return this.api.post<PurchaseOrder>(this.basePath, body);
  }

  update(id: string, body: UpdatePurchaseOrderRequest): Observable<PurchaseOrder> {
    return this.api.patch<PurchaseOrder>(`${this.basePath}/${id}`, body);
  }

  submit(id: string, body: PurchaseOrderWorkflowRequest): Observable<PurchaseOrder> {
    return this.api.post<PurchaseOrder>(`${this.basePath}/${id}/submit`, body);
  }

  approve(id: string, body: PurchaseOrderWorkflowRequest): Observable<PurchaseOrder> {
    return this.api.post<PurchaseOrder>(`${this.basePath}/${id}/approve`, body);
  }

  reject(id: string, body: PurchaseOrderWorkflowRequest): Observable<PurchaseOrder> {
    return this.api.post<PurchaseOrder>(`${this.basePath}/${id}/reject`, body);
  }

  send(id: string, body: PurchaseOrderWorkflowRequest): Observable<PurchaseOrder> {
    return this.api.post<PurchaseOrder>(`${this.basePath}/${id}/send`, body);
  }

  forceClose(id: string, body: PurchaseOrderWorkflowRequest): Observable<PurchaseOrder> {
    return this.api.post<PurchaseOrder>(`${this.basePath}/${id}/force-close`, body);
  }

  cancel(id: string, body: PurchaseOrderWorkflowRequest): Observable<PurchaseOrder> {
    return this.api.post<PurchaseOrder>(`${this.basePath}/${id}/cancel`, body);
  }

  delete(id: string, version: string): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`, {
      version: String(version),
    });
  }
}
