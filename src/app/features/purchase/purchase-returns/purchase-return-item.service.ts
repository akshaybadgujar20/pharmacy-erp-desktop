import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  CreatePurchaseReturnItemRequest,
  PurchaseReturnItem,
  UpdatePurchaseReturnItemRequest,
} from './purchase-return-item.models';

@Injectable({ providedIn: 'root' })
export class PurchaseReturnItemService {
  private readonly api = inject(ApiService);

  list(
    returnId: string,
    params: Record<string, string>,
  ): Observable<{ data: PurchaseReturnItem[]; pagination: Pagination }> {
    return this.api.getPaginated<PurchaseReturnItem>(
      `/purchase-returns/${returnId}/items`,
      params,
    );
  }

  create(
    returnId: string,
    body: CreatePurchaseReturnItemRequest,
  ): Observable<PurchaseReturnItem> {
    return this.api.post<PurchaseReturnItem>(`/purchase-returns/${returnId}/items`, body);
  }

  update(
    returnId: string,
    id: string,
    body: UpdatePurchaseReturnItemRequest,
  ): Observable<PurchaseReturnItem> {
    return this.api.patch<PurchaseReturnItem>(
      `/purchase-returns/${returnId}/items/${id}`,
      body,
    );
  }

  delete(returnId: string, id: string, version: number): Observable<void> {
    return this.api.delete<void>(`/purchase-returns/${returnId}/items/${id}`, {
      version: String(version),
    });
  }
}
