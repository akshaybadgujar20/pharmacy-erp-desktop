import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  CreatePurchaseOrderItemRequest,
  PurchaseOrderItem,
  UpdatePurchaseOrderItemRequest,
} from './purchase-order-item.models';

@Injectable({ providedIn: 'root' })
export class PurchaseOrderItemService {
  private readonly api = inject(ApiService);

  list(
    orderId: string,
    params: Record<string, string>,
  ): Observable<{ data: PurchaseOrderItem[]; pagination: Pagination }> {
    return this.api.getPaginated<PurchaseOrderItem>(
      `/purchase-orders/${orderId}/items`,
      params,
    );
  }

  create(
    orderId: string,
    body: CreatePurchaseOrderItemRequest,
  ): Observable<PurchaseOrderItem> {
    return this.api.post<PurchaseOrderItem>(`/purchase-orders/${orderId}/items`, body);
  }

  update(
    orderId: string,
    id: string,
    body: UpdatePurchaseOrderItemRequest,
  ): Observable<PurchaseOrderItem> {
    return this.api.patch<PurchaseOrderItem>(
      `/purchase-orders/${orderId}/items/${id}`,
      body,
    );
  }

  delete(orderId: string, id: string, version: number): Observable<void> {
    return this.api.delete<void>(`/purchase-orders/${orderId}/items/${id}`, {
      version: String(version),
    });
  }
}
