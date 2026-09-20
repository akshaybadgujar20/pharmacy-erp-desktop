import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  CreateStockAdjustmentItemRequest,
  StockAdjustmentItem,
  UpdateStockAdjustmentItemRequest,
} from './stock-adjustment-item.models';

@Injectable({ providedIn: 'root' })
export class StockAdjustmentItemService {
  private readonly api = inject(ApiService);

  list(
    adjustmentId: string,
    params: Record<string, string>,
  ): Observable<{ data: StockAdjustmentItem[]; pagination: Pagination }> {
    return this.api.getPaginated<StockAdjustmentItem>(
      `/stock-adjustments/${adjustmentId}/items`,
      params,
    );
  }

  getById(adjustmentId: string, id: string): Observable<StockAdjustmentItem> {
    return this.api.get<StockAdjustmentItem>(
      `/stock-adjustments/${adjustmentId}/items/${id}`,
    );
  }

  create(
    adjustmentId: string,
    body: CreateStockAdjustmentItemRequest,
  ): Observable<StockAdjustmentItem> {
    return this.api.post<StockAdjustmentItem>(
      `/stock-adjustments/${adjustmentId}/items`,
      body,
    );
  }

  update(
    adjustmentId: string,
    id: string,
    body: UpdateStockAdjustmentItemRequest,
  ): Observable<StockAdjustmentItem> {
    return this.api.patch<StockAdjustmentItem>(
      `/stock-adjustments/${adjustmentId}/items/${id}`,
      body,
    );
  }

  delete(adjustmentId: string, id: string, version: string): Observable<void> {
    return this.api.delete<void>(`/stock-adjustments/${adjustmentId}/items/${id}`, {
      version: String(version),
    });
  }
}
